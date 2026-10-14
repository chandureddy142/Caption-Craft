import React, { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasSettings, Subtitle, CaptionLanguage, ExportResolutionPreset } from "../types";
import { getSubtitleCanvasLayout, renderSubtitlesToCanvas } from "../utils/SubtitleRenderer";
import { getPlatformSafeZone } from "../utils/creatorTools";
import { getCaptionText } from "../utils/transliterate";
import {
  CAPTION_TEMPLATES,
  applyTemplateToSettings,
  type CaptionTemplateDefinition,
} from "../utils/captionTemplates";
import {
  BACKGROUND_THEMES,
  drawBackgroundToCanvas,
} from "../utils/backgroundThemes";
import {
  Check,
  FolderUp,
  Image as ImageIcon,
  LayoutTemplate,
  Maximize2,
  Minimize2,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Share2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { ExportModal } from "./ExportModal";
import { downloadStringAsFile, exportToSRT, exportToVTT } from "../utils/exporter";
import {
  getPreferredMimeType,
  getExportDimensions,
  getSupportedWebmMimeType,
} from "../utils/exportCapabilities";

function formatPrecisionTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00.000";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

const MIN_CAPTION_DURATION = 0.05;
type TimelineDragMode = "move" | "start" | "end";
type TimelineTiming = Pick<Subtitle, "start" | "end">;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

interface TimelineDrag {
  id: string;
  mode: TimelineDragMode;
  pointerId: number;
  startX: number;
  pixelsPerSecond: number;
  original: TimelineTiming;
  preview: TimelineTiming;
}

type CaptureStreamVideoElement = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

function getMediaCaptureStream(media: HTMLVideoElement): MediaStream | null {
  const capturableMedia = media as CaptureStreamVideoElement;
  if (typeof capturableMedia.captureStream === "function") {
    return capturableMedia.captureStream();
  }
  if (typeof capturableMedia.mozCaptureStream === "function") {
    return capturableMedia.mozCaptureStream();
  }
  return null;
}

function stopStreamTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
}

interface WorkspaceProps {
  mediaDuration?: number;
  videoFile: File | null;
  audioBlob?: Blob | null;
  subtitles: Subtitle[];
  language: CaptionLanguage;
  settings: CanvasSettings;
  setSettings: React.Dispatch<React.SetStateAction<CanvasSettings>>;
  setSubtitles?: React.Dispatch<React.SetStateAction<Subtitle[]>>;
  jumpTime: number | null;
  selectedSubtitleId?: string | null;
  onSelectSubtitle?: (id: string | null) => void;
  onDurationChange?: (duration: number) => void;
  onBackToUpload?: () => void;
  onOpenExport?: () => void;
  projectTitle?: string;
  onProjectTitleChange?: (title: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  videoFile,
  subtitles,
  language,
  settings,
  setSettings,
  setSubtitles,
  jumpTime,
  selectedSubtitleId: controlledSelectedSubtitleId,
  onSelectSubtitle,
  onDurationChange,
  onBackToUpload: _onBackToUpload,
  onOpenExport,
  projectTitle,
  onProjectTitleChange,
  mediaDuration = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRef = useRef<HTMLVideoElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const customImageRef = useRef<HTMLImageElement | null>(null);
  const customVideoRef = useRef<HTMLVideoElement | null>(null);
  const songMediaRef = useRef<HTMLAudioElement | null>(null);
  const [songDuration, setSongDuration] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState<"audio" | "background" | "caption" | "music">("caption");
  const [songVolume, setSongVolume] = useState(0.8);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const timelineViewportRef = useRef<HTMLDivElement>(null);

  const [activeCatalogTab, setActiveCatalogTab] = useState<"backgrounds" | "templates">("backgrounds");
  const [isZoom100, setIsZoom100] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const totalPlaybackDuration = Math.max(duration || 0, songDuration || 0, mediaDuration || 0);
  const effectiveDuration = totalPlaybackDuration > 0 ? totalPlaybackDuration : 1;
  const [volume, setVolume] = useState(1);
  const [localSelectedSubtitleId, setLocalSelectedSubtitleId] = useState<string | null>(null);
  const [editingSubtitleId, setEditingSubtitleId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [inlineEditorStyle, setInlineEditorStyle] = useState<React.CSSProperties | null>(null);
  const inlineEditorRef = useRef<HTMLTextAreaElement>(null);
  const editingSubtitleIdRef = useRef<string | null>(null);
  const draftTextRef = useRef("");
  const [exportResolution, setExportResolution] = useState<ExportResolutionPreset>("1080p");
  const [exportCurrentTime, setExportCurrentTime] = useState(0);
  const [localSongUrl, setLocalSongUrl] = useState<string | null>(null);
  const [localSongName, setLocalSongName] = useState<string | null>(null);
  const [timelineTimingPreview, setTimelineTimingPreview] = useState<(TimelineTiming & { id: string }) | null>(null);
  const timelineDragRef = useRef<TimelineDrag | null>(null);
  const captionTrackRef = useRef<HTMLDivElement>(null);

  const animationRef = useRef<number | undefined>(undefined);
  const drawFrameRef = useRef<() => void>(() => undefined);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const exportCancelledRef = useRef(false);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportAnimRef = useRef<number | undefined>(undefined);

  const selectedSubtitleId = controlledSelectedSubtitleId === undefined
    ? localSelectedSubtitleId
    : controlledSelectedSubtitleId;

  const selectSubtitle = (id: string | null) => {
    setLocalSelectedSubtitleId(id);
    onSelectSubtitle?.(id);
  };

  const getCanvasDimensions = () => {
    const height = 600;
    switch (settings.aspectRatio) {
      case "16:9": return { width: height * (16 / 9), height };
      case "9:16": return { width: height * (9 / 16), height };
      case "1:1": return { width: height, height };
      case "4:5": return { width: height * (4 / 5), height };
      default: return { width: height * (9 / 16), height };
    }
  };

  const dims = getCanvasDimensions();
  const isVideoMedia = Boolean(videoFile && (
    videoFile.type.startsWith("video/") || /\.(mp4|mov|webm|mkv)$/i.test(videoFile.name)
  ));

  const canExportWebm =
    getPreferredMimeType(true) !== null ||
    getSupportedWebmMimeType(true) !== null ||
    getSupportedWebmMimeType(false) !== null;

  useEffect(() => {
    if (!settings.customImageDataUrl) {
      customImageRef.current = null;
      drawFrameRef.current();
      return;
    }
    const img = new Image();
    img.src = settings.customImageDataUrl;
    img.onload = () => {
      customImageRef.current = img;
      drawFrameRef.current();
    };
  }, [settings.customImageDataUrl]);

  useEffect(() => {
    return () => {
      if (settings.customVideoUrl && settings.customVideoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(settings.customVideoUrl);
      }
    };
  }, [settings.customVideoUrl]);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const media = mediaRef.current;
    if (!canvas || !media) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const customVideo = customVideoRef.current;
    if (settings.backgroundTheme === "custom-video" && customVideo) {
      if (!media.paused && customVideo.paused) {
        void customVideo.play().catch(() => undefined);
      } else if (media.paused && !customVideo.paused) {
        customVideo.pause();
      }
      if (customVideo.duration > 0) {
        const loopTime = media.currentTime % customVideo.duration;
        if (Math.abs(customVideo.currentTime - loopTime) > 0.25) {
          customVideo.currentTime = loopTime;
        }
      }
    }

    drawBackgroundToCanvas(ctx, {
      themeId: settings.backgroundTheme,
      width: canvas.width,
      height: canvas.height,
      videoElement: media,
      isVideoMedia,
      customImage: customImageRef.current,
      customVideoElement: customVideoRef.current,
      overlayOpacity: settings.backgroundOverlayOpacity,
      fitMode: settings.fitMode,
    });

    if (settings.safeZones?.show) {
      const zone = getPlatformSafeZone(settings.safeZones.platform, settings.aspectRatio);
      const safeRect = {
        x: zone.safeArea.x * canvas.width,
        y: zone.safeArea.y * canvas.height,
        width: zone.safeArea.width * canvas.width,
        height: zone.safeArea.height * canvas.height,
      };
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(safeRect.x, safeRect.y, safeRect.width, safeRect.height);
      ctx.setLineDash([]);
      zone.blocked.forEach(region => {
        ctx.fillStyle = "rgba(15, 23, 42, 0.18)";
        ctx.fillRect(region.x * canvas.width, region.y * canvas.height, region.width * canvas.width, region.height * canvas.height);
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "12px sans-serif";
        ctx.fillText(region.label, region.x * canvas.width + 8, region.y * canvas.height + 18);
      });
      ctx.restore();
    }

    renderSubtitlesToCanvas(
      ctx,
      canvas.width,
      canvas.height,
      media.currentTime,
      subtitles,
      settings,
      language,
      selectedSubtitleId,
    );

    setCurrentTime(media.currentTime);
    if (isExporting && duration > 0) {
      setExportProgress(Math.min(100, (media.currentTime / duration) * 100));
    }

    if (!media.paused && !media.ended) {
      animationRef.current = requestAnimationFrame(() => drawFrameRef.current());
    }
  }, [duration, isExporting, isVideoMedia, language, selectedSubtitleId, settings, subtitles]);

  useEffect(() => {
    if (!isPlaying) return;
    let lastTime = performance.now();

    const masterClockLoop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setCurrentTime(prev => {
        const next = prev + delta;
        if (next >= effectiveDuration) {
          setIsPlaying(false);
          if (mediaRef.current) mediaRef.current.pause();
          if (songMediaRef.current) songMediaRef.current.pause();
          return effectiveDuration;
        }

        const media = mediaRef.current;
        if (media && !media.paused && media.currentTime >= (media.duration || 0)) {
          media.pause();
        }

        return next;
      });

      drawFrame();
      animationRef.current = requestAnimationFrame(masterClockLoop);
    };

    animationRef.current = requestAnimationFrame(masterClockLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, effectiveDuration, drawFrame]);

  useEffect(() => {
    const el = timelineViewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 0.85;
        setTimelineZoom(z => Math.max(0.4, Math.min(6, z * factor)));
      } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollLeft += e.deltaX;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    drawFrameRef.current = drawFrame;
  }, [drawFrame]);

  useEffect(() => {
    if (videoFile && mediaRef.current) {
      const url = URL.createObjectURL(videoFile);
      mediaRef.current.src = url;
      mediaRef.current.load();
      setDuration(0);
      setCurrentTime(0);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  const handleLoadedMetadata = () => {
    const media = mediaRef.current;
    if (!media || !Number.isFinite(media.duration)) return;
    setDuration(media.duration);
    onDurationChange?.(media.duration);
    drawFrame();
  };

  useEffect(() => {
    const media = mediaRef.current;
    if (media) {
      // Media ended handled by masterClockLoop
    }
  }, [isExporting]);

  useEffect(() => {
    if (jumpTime !== null && mediaRef.current) {
      const max = Number.isFinite(mediaRef.current.duration) ? mediaRef.current.duration : jumpTime;
      mediaRef.current.currentTime = Math.max(0, Math.min(jumpTime, max));
      drawFrame();
    }
  }, [drawFrame, jumpTime]);

  const pausePlayback = () => {
    const media = mediaRef.current;
    if (!media) return;
    media.pause();
    setIsPlaying(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const startEditing = (subtitle: Subtitle) => {
    pausePlayback();
    if (currentTime < subtitle.start || currentTime > subtitle.end) {
      if (mediaRef.current) mediaRef.current.currentTime = subtitle.start;
      setCurrentTime(subtitle.start);
    }
    selectSubtitle(subtitle.id);
    const nextDraft = getCaptionText(subtitle.text, language, subtitle.tenglishText);
    draftTextRef.current = nextDraft;
    setDraftText(nextDraft);
    editingSubtitleIdRef.current = subtitle.id;
    setEditingSubtitleId(subtitle.id);
  };

  const saveInlineEdit = () => {
    const id = editingSubtitleIdRef.current;
    if (!id) return;
    const nextText = draftTextRef.current;
    setSubtitles?.(prev => prev.map(subtitle => {
      if (subtitle.id !== id) return subtitle;
      if (language === "tenglish") return { ...subtitle, tenglishText: nextText };
      return { ...subtitle, text: nextText, tenglishText: language === "te" ? undefined : subtitle.tenglishText };
    }));
    editingSubtitleIdRef.current = null;
    setEditingSubtitleId(null);
  };

  const cancelInlineEdit = () => {
    editingSubtitleIdRef.current = null;
    setEditingSubtitleId(null);
    draftTextRef.current = "";
    setDraftText("");
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingSubtitleId) saveInlineEdit();
    canvasAreaRef.current?.focus();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * canvas.width / rect.width;
    const y = (event.clientY - rect.top) * canvas.height / rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const layout = getSubtitleCanvasLayout(ctx, canvas.width, canvas.height, currentTime, subtitles, settings, language);
    if (!layout) return;
    const withinX = x >= layout.left && x <= layout.left + layout.width;
    const withinY = y >= layout.y - layout.height / 2 && y <= layout.y + layout.height / 2;
    if (withinX && withinY) selectSubtitle(layout.subtitle.id);
  };

  const handleCanvasDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingSubtitleId) saveInlineEdit();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * canvas.width / rect.width;
    const y = (event.clientY - rect.top) * canvas.height / rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const layout = getSubtitleCanvasLayout(ctx, canvas.width, canvas.height, currentTime, subtitles, settings, language);
    if (!layout) return;
    if (
      x >= layout.left && x <= layout.left + layout.width &&
      y >= layout.y - layout.height / 2 && y <= layout.y + layout.height / 2
    ) startEditing(layout.subtitle);
  };

  const handleCanvasKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && editingSubtitleId) {
      event.preventDefault();
      cancelInlineEdit();
      return;
    }
    if (event.key === "Enter" && !editingSubtitleId && selectedSubtitleId) {
      const subtitle = subtitles.find(item => item.id === selectedSubtitleId);
      if (subtitle) {
        event.preventDefault();
        startEditing(subtitle);
      }
    }
  };

  const calculateInlineEditorStyle = useCallback((): React.CSSProperties | null => {
    if (!editingSubtitleId || !canvasAreaRef.current || !canvasRef.current) return null;
    const subtitle = subtitles.find(item => item.id === editingSubtitleId);
    if (!subtitle) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const layout = getSubtitleCanvasLayout(ctx, canvas.width, canvas.height, currentTime, [subtitle], settings, language);
    if (!layout) return null;
    const canvasRect = canvas.getBoundingClientRect();
    const frameRect = canvas.parentElement?.getBoundingClientRect() ?? canvasRect;
    const scaleX = canvas.clientWidth / canvas.width;
    const scaleY = canvas.clientHeight / canvas.height;
    const isTelugu = language === "te" || /[\u0C00-\u0C7F]/.test(subtitle.text);
    const fontFamily = isTelugu
      ? "'Noto Sans Telugu', 'Inter', sans-serif"
      : `${settings.fontFamily}, 'Noto Sans Telugu', sans-serif`;
    const horizontalPadding = settings.style === "box" || settings.textBackground ? 40 : settings.style === "outline" ? 12 : 0;
    const verticalPadding = settings.style === "box" || settings.textBackground ? 20 : settings.style === "outline" ? 12 : 0;
    const renderedWidth = layout.width * scaleX;
    const editorWidth = Math.min(canvas.clientWidth * 0.8, Math.max(renderedWidth, 180));
    const renderedLeft = canvasRect.left - frameRect.left + canvas.clientLeft + layout.left * scaleX;
    const left = settings.alignment === "left"
      ? renderedLeft
      : settings.alignment === "right"
        ? renderedLeft + renderedWidth - editorWidth
        : renderedLeft + (renderedWidth - editorWidth) / 2;
    const sidePadding = horizontalPadding * scaleX;
    return {
      position: "absolute",
      left,
      top: canvasRect.top - frameRect.top + canvas.clientTop + (layout.y - layout.height / 2) * scaleY,
      width: editorWidth,
      height: Math.max(1, layout.height * scaleY),
      minHeight: 0,
      paddingTop: verticalPadding * scaleY / 2,
      paddingBottom: verticalPadding * scaleY / 2,
      paddingLeft: settings.alignment === "left" ? 0 : sidePadding / 2,
      paddingRight: settings.alignment === "right" ? 0 : sidePadding / 2,
      color: settings.textColor,
      fontFamily,
      fontSize: `${layout.fontSize * scaleY}px`,
      lineHeight: `${layout.lineHeight * scaleY}px`,
      textAlign: settings.alignment,
      background: settings.style === "box" || settings.textBackground ? settings.boxColor || "rgba(0, 0, 0, 0.6)" : "transparent",
      borderRadius: settings.style === "box" || settings.textBackground ? "10px" : 0,
      zIndex: 2,
    };
  }, [currentTime, editingSubtitleId, language, settings, subtitles]);

  useEffect(() => {
    if (!editingSubtitleId) return undefined;
    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && inlineEditorRef.current?.contains(target)) return;
      saveInlineEdit();
    };
    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
  }, [editingSubtitleId]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setInlineEditorStyle(calculateInlineEditorStyle());
    });
    const canvas = canvasRef.current;
    const resizeObserver = canvas && editingSubtitleId && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => setInlineEditorStyle(calculateInlineEditorStyle()))
      : null;
    if (canvas && resizeObserver) resizeObserver.observe(canvas);
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
    };
  }, [calculateInlineEditorStyle]);

  useEffect(() => {
    drawFrame();
  }, [drawFrame]);

  const togglePlay = () => {
    const media = mediaRef.current;
    const song = songMediaRef.current;
    if (isExporting) return;

    if (!isPlaying) {
      if (currentTime >= effectiveDuration) {
        setCurrentTime(0);
        if (media) media.currentTime = 0;
        if (song) song.currentTime = 0;
      }
      if (media && media.currentTime < (media.duration || 0)) {
        void media.play().catch(() => undefined);
      }
      if (song && localSongUrl) {
        song.currentTime = currentTime;
        void song.play().catch(() => undefined);
      }
      setIsPlaying(true);
    } else {
      if (media) media.pause();
      if (song) song.pause();
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  };

  const handleExportFrame = () => {
    if (!canvasRef.current) {
      setExportError("Preview is not ready for a PNG export.");
      return;
    }
    setExportError("");
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "frame.png";
    a.click();
  };

  const handleExportSrt = () => {
    downloadStringAsFile(exportToSRT(subtitles, language), "captions.srt");
  };

  const handleExportVtt = () => {
    downloadStringAsFile(exportToVTT(subtitles, language), "captions.vtt");
  };

  const cancelExport = () => {
    exportCancelledRef.current = true;
    mediaRef.current?.pause();
    if (exportAnimRef.current) {
      cancelAnimationFrame(exportAnimRef.current);
      exportAnimRef.current = undefined;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      offscreenCanvasRef.current = null;
      setIsExporting(false);
      setExportError("Export cancelled.");
    }
  };

  const handleExportVideo = () => {
    const media = mediaRef.current;
    if (!media) {
      setExportError("Preview is not ready for a video export.");
      return;
    }
    if (!("MediaRecorder" in window)) {
      setExportError("This browser does not support canvas recording.");
      return;
    }

    const { width: targetWidth, height: targetHeight, videoBitsPerSecond } =
      getExportDimensions(exportResolution, settings.aspectRatio);

    const BASE_PREVIEW_HEIGHT = 600;
    const scaleFactor = targetHeight / BASE_PREVIEW_HEIGHT;

    const offscreen = document.createElement("canvas");
    offscreen.width = targetWidth;
    offscreen.height = targetHeight;
    offscreenCanvasRef.current = offscreen;

    if (typeof offscreen.captureStream !== "function") {
      setExportError("This browser does not support canvas capture streams.");
      return;
    }

    setIsExporting(true);
    setExportError("");
    setExportComplete(false);
    setExportProgress(0);
    setExportCurrentTime(0);
    exportCancelledRef.current = false;
    chunksRef.current = [];

    const canvasStream = offscreen.captureStream(30);
    const mediaStream = getMediaCaptureStream(media);
    const audioTracks = mediaStream?.getAudioTracks() ?? [];
    const videoTracks = canvasStream.getVideoTracks();

    if (videoTracks.length === 0) {
      stopStreamTracks(canvasStream);
      setIsExporting(false);
      setExportError("This browser did not provide a video track for export.");
      return;
    }

    const mimeType = getPreferredMimeType(audioTracks.length > 0)
      ?? getSupportedWebmMimeType(audioTracks.length > 0);
    if (!mimeType) {
      stopStreamTracks(canvasStream);
      stopStreamTracks(mediaStream);
      setIsExporting(false);
      setExportError("No supported export codec is available in this browser.");
      return;
    }

    const combinedStream = new MediaStream([
      ...videoTracks,
      ...(audioTracks.length > 0 ? audioTracks : []),
    ]);

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond,
      });
    } catch (error) {
      setIsExporting(false);
      setExportError(error instanceof Error ? error.message : "Unable to start video export.");
      stopStreamTracks(canvasStream);
      stopStreamTracks(mediaStream);
      return;
    }

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    const fileExt = "webm";
    const downloadMime = "video/webm";

    let exportEndedListener: (() => void) | null = null;
    const cleanupExport = (canvasStream: MediaStream, mediaStream: MediaStream | null) => {
      if (exportAnimRef.current) cancelAnimationFrame(exportAnimRef.current);
      exportAnimRef.current = undefined;
      if (exportEndedListener) {
        media.removeEventListener("ended", exportEndedListener);
        exportEndedListener = null;
      }
      offscreenCanvasRef.current = null;
      stopStreamTracks(canvasStream);
      stopStreamTracks(mediaStream);
      mediaRecorderRef.current = null;
      setIsExporting(false);
    };

    recorder.onstop = () => {
      if (!exportCancelledRef.current) {
        const blob = new Blob(chunksRef.current, { type: downloadMime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export-${exportResolution}.${fileExt}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        setExportComplete(true);
        setExportProgress(100);
      } else {
        setExportError("Export cancelled.");
      }
      cleanupExport(canvasStream, mediaStream);
    };

    recorder.onerror = () => {
      setExportError("The browser stopped the export unexpectedly.");
      cleanupExport(canvasStream, mediaStream);
    };

    mediaRecorderRef.current = recorder;
    media.currentTime = 0;

    const scaledSettings: CanvasSettings = {
      ...settings,
      fontSize: Math.round(settings.fontSize * scaleFactor),
    };

    const renderExportFrame = () => {
      const ctx = offscreen.getContext("2d");
      if (!ctx || exportCancelledRef.current) return;

      ctx.clearRect(0, 0, offscreen.width, offscreen.height);

      const customVideo = customVideoRef.current;
      if (settings.backgroundTheme === "custom-video" && customVideo && customVideo.duration > 0) {
        const loopTime = media.currentTime % customVideo.duration;
        if (Math.abs(customVideo.currentTime - loopTime) > 0.25) {
          customVideo.currentTime = loopTime;
        }
      }

      drawBackgroundToCanvas(ctx, {
        themeId: settings.backgroundTheme,
        width: offscreen.width,
        height: offscreen.height,
        videoElement: media,
        isVideoMedia,
        customImage: customImageRef.current,
        customVideoElement: customVideoRef.current,
        overlayOpacity: settings.backgroundOverlayOpacity,
        fitMode: settings.fitMode,
      });

      renderSubtitlesToCanvas(
        ctx,
        offscreen.width,
        offscreen.height,
        media.currentTime,
        subtitles,
        scaledSettings,
        language,
        null,
      );

      const t = media.currentTime;
      const d = Number.isFinite(media.duration) ? media.duration : duration;
      setExportCurrentTime(t);
      if (d > 0) setExportProgress(Math.min(100, (t / d) * 100));

      if (!media.paused && !media.ended && !exportCancelledRef.current) {
        exportAnimRef.current = requestAnimationFrame(renderExportFrame);
      }
    };

    const handleExportEnded = () => {
      if (exportCancelledRef.current || recorder.state === "inactive") return;
      renderExportFrame();
      setExportProgress(100);
      try {
        recorder.stop();
      } catch {
        setExportError("The browser could not finish the export.");
        cleanupExport(canvasStream, mediaStream);
      }
    };
    exportEndedListener = handleExportEnded;
    media.addEventListener("ended", handleExportEnded, { once: true });

    try {
      recorder.start();
    } catch (error) {
      setIsExporting(false);
      setExportError(error instanceof Error ? error.message : "Unable to start recording.");
      cleanupExport(canvasStream, mediaStream);
      return;
    }

    void media.play().then(() => {
      setIsPlaying(true);
      exportAnimRef.current = requestAnimationFrame(renderExportFrame);
    }).catch(error => {
      exportCancelledRef.current = true;
      recorder.stop();
      setIsPlaying(false);
      setExportError(error instanceof Error ? error.message : "Unable to play media for export.");
    });
  };

  useEffect(() => {
    if (!isPlaying || !timelineViewportRef.current) return;
    const el = timelineViewportRef.current;
    const playheadRatio = currentTime / effectiveDuration;
    const totalWidth = el.scrollWidth;
    const clientWidth = el.clientWidth;
    const playheadX = playheadRatio * totalWidth;
    if (playheadX > el.scrollLeft + clientWidth * 0.8 || playheadX < el.scrollLeft) {
      el.scrollLeft = Math.max(0, playheadX - clientWidth * 0.2);
    }
  }, [currentTime, isPlaying, effectiveDuration]); // Auto-scroll timeline scroller to follow playback

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mediaRef.current || !duration) return;
    if (editingSubtitleId) saveInlineEdit();
    const rect = event.currentTarget.getBoundingClientRect();
    const nextTime = Math.max(0, Math.min(duration, ((event.clientX - rect.left) / rect.width) * duration));
    mediaRef.current.currentTime = nextTime;
    drawFrame();
  };

  const getDraggedTiming = (drag: TimelineDrag, clientX: number): TimelineTiming => {
    const delta = (clientX - drag.startX) / drag.pixelsPerSecond;
    const { start, end } = drag.original;
    const minimum = Math.min(MIN_CAPTION_DURATION, duration);
    if (drag.mode === "move") {
      const length = end - start;
      const nextStart = clamp(start + delta, 0, duration - length);
      return { start: nextStart, end: nextStart + length };
    }
    if (drag.mode === "start") return { start: clamp(start + delta, 0, end - minimum), end };
    return { start, end: clamp(end + delta, start + minimum, duration) };
  };

  const beginTimelineDrag = (event: React.PointerEvent<HTMLElement>, subtitle: Subtitle, mode: TimelineDragMode) => {
    event.stopPropagation();
    if (editingSubtitleId) saveInlineEdit();
    if (event.pointerType === "mouse" && event.button !== 0) return;
    selectSubtitle(subtitle.id);
    if (mediaRef.current) {
      mediaRef.current.currentTime = subtitle.start;
      drawFrame();
    }
    if (!setSubtitles || !duration) return;
    if (timelineDragRef.current) return;
    const trackWidth = captionTrackRef.current?.getBoundingClientRect().width;
    if (!trackWidth) return;
    event.preventDefault();
    const minimum = Math.min(MIN_CAPTION_DURATION, duration);
    const start = clamp(subtitle.start, 0, duration - minimum);
    const end = clamp(subtitle.end, start + minimum, duration);
    timelineDragRef.current = {
      id: subtitle.id,
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      pixelsPerSecond: trackWidth / duration,
      original: { start, end },
      preview: { start, end },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleClipPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = timelineDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.preview = getDraggedTiming(drag, event.clientX);
    setTimelineTimingPreview({ id: drag.id, ...drag.preview });
  };

  const endTimelineDrag = (event: React.PointerEvent<HTMLElement>, cancelled = false) => {
    const drag = timelineDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    timelineDragRef.current = null;
    setTimelineTimingPreview(null);
    if (cancelled) return;
    const timing = getDraggedTiming(drag, event.clientX);
    if (timing.start === drag.original.start && timing.end === drag.original.end) return;
    setSubtitles?.(previous => previous.map(subtitle => {
      if (subtitle.id !== drag.id) return subtitle;
      const offset = timing.start - subtitle.start;
      return {
        ...subtitle,
        ...timing,
        words: drag.mode === "move" && subtitle.words
          ? subtitle.words.map(word => ({ ...word, start: word.start + offset, end: word.end + offset }))
          : subtitle.words,
      };
    }));
  };

  const nudgeCaptionEdge = (event: React.KeyboardEvent<HTMLButtonElement>, subtitle: Subtitle, edge: "start" | "end") => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    event.stopPropagation();
    if (!setSubtitles || !duration) return;
    const delta = event.key === "ArrowRight" ? 0.1 : -0.1;
    const minimum = Math.min(MIN_CAPTION_DURATION, duration);
    selectSubtitle(subtitle.id);
    setSubtitles(previous => previous.map(item => {
      if (item.id !== subtitle.id) return item;
      const start = clamp(item.start, 0, duration - minimum);
      const end = clamp(item.end, start + minimum, duration);
      return edge === "start"
        ? { ...item, start: clamp(start + delta, 0, end - minimum), end }
        : { ...item, start, end: clamp(end + delta, start + minimum, duration) };
    }));
  };

  const ratioOptions: Array<{ value: CanvasSettings["aspectRatio"]; label: string; detail: string }> = [
    { value: "9:16", label: "9:16", detail: "Reels" },
    { value: "16:9", label: "16:9", detail: "YouTube" },
    { value: "1:1", label: "1:1", detail: "Square" },
    { value: "4:5", label: "4:5", detail: "Portrait" },
  ];

  const setAppearance = <K extends keyof CanvasSettings>(key: K, value: CanvasSettings[K]) => {
    setSettings(previous => ({ ...previous, [key]: value }));
  };

  const handleApplyTemplate = (templateId: CanvasSettings["selectedTemplateId"]) => {
    if (!templateId) return;
    setSettings(previous => applyTemplateToSettings(previous, templateId));
  };

  const handleResetStyling = () => {
    setSettings(previous => applyTemplateToSettings(previous, "classic-white"));
  };

  const handleMediaUpload = (file: File) => {
    if (file.type.startsWith("video/")) {
      if (settings.customVideoUrl && settings.customVideoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(settings.customVideoUrl);
      }
      const url = URL.createObjectURL(file);
      setSettings(prev => ({
        ...prev,
        backgroundTheme: "custom-video",
        customVideoUrl: url,
        customImageDataUrl: undefined,
      }));
    } else if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setSettings(prev => ({
            ...prev,
            backgroundTheme: "custom-image",
            customImageDataUrl: reader.result as string,
            customVideoUrl: undefined,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderTemplateSampleText = (template: CaptionTemplateDefinition) => {
    const preview = template.previewSample;
    const sample = typeof preview === "string"
      ? preview
      : preview
        ? (language === "te"
          ? preview.te
          : language === "tenglish"
            ? preview.tenglish
            : preview.en)
        : template.name;

    const ts = template.settings;
    const isBox = ts.style === "box" || ts.textBackground;
    const isOutline = ts.style === "outline";
    const isKinetic = ts.style === "kinetic";

    const boxBg = isBox ? (ts.boxColor || "rgba(0,0,0,0.85)") : "transparent";
    const textColor = ts.textColor || "#ffffff";
    const highlightColor = ts.highlightColor || "#8b5cf6";
    const strokeColor = ts.boxColor || "#000000";
    const isTeluguText = language === "te" || /[\u0C00-\u0C7F]/.test(sample);
    const fontStack = isTeluguText
      ? "'Noto Sans Telugu', 'Inter', sans-serif"
      : `${ts.fontFamily || "'Inter', sans-serif"}, 'Noto Sans Telugu', sans-serif`;

    const words = sample.split(" ");
    const firstWord = words[0];
    const restWords = words.slice(1).join(" ");

    return (
      <div
        className="template-card-preview"
        style={{
          fontFamily: fontStack,
          backgroundColor: boxBg,
          padding: isBox ? "4px 8px" : "0",
          borderRadius: isBox ? "5px" : "0",
        }}
      >
        <span
          style={{
            color: isKinetic ? highlightColor : textColor,
            textShadow: isOutline
              ? `-1px -1px 0 ${strokeColor}, 1px -1px 0 ${strokeColor}, -1px 1px 0 ${strokeColor}, 1px 1px 0 ${strokeColor}`
              : "0 2px 4px rgba(0,0,0,0.6)",
          }}
        >
          {firstWord}
        </span>
        {restWords && (
          <span
            style={{
              marginLeft: "4px",
              color: textColor,
              textShadow: isOutline
                ? `-1px -1px 0 ${strokeColor}, 1px -1px 0 ${strokeColor}, -1px 1px 0 ${strokeColor}, 1px 1px 0 ${strokeColor}`
                : "0 2px 4px rgba(0,0,0,0.6)",
            }}
          >
            {restWords}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="preview-layout">
      {/* CENTER PANEL */}
      <main className="preview-workspace">
        <header className="workspace-header">
          <div className="workspace-title-group">
            {duration > 0 && (
              <span className="duration-pill" title="Total project duration">
                {formatDuration(duration)}
              </span>
            )}
            <input
              ref={titleInputRef}
              className="project-title-input"
              value={projectTitle ?? ""}
              maxLength={150}
              placeholder="Untitled project"
              size={Math.max((projectTitle || "Untitled project").length, 8)}
              onChange={event => onProjectTitleChange?.(event.target.value)}
              aria-label="Project title"
            />
            <button
              type="button"
              className="title-edit-icon"
              onClick={() => titleInputRef.current?.focus()}
              title="Edit title"
              aria-label="Edit title"
            >
              <Pencil size={13} />
            </button>
          </div>

          <div className="workspace-header-actions">
            <button
              type="button"
              className="fit-toggle-button"
              onClick={() => setIsZoom100(prev => !prev)}
              title={isZoom100 ? "Fit canvas to screen" : "Zoom to actual scale"}
              aria-label={isZoom100 ? "Fit canvas to screen" : "Zoom to actual scale"}
            >
              {isZoom100 ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isZoom100 ? "Fit" : "100%"}</span>
            </button>

            <label className="ratio-select-wrap">
              <span>Ratio</span>
              <select
                className="ratio-select"
                value={settings.aspectRatio}
                onChange={event => setSettings(previous => ({ ...previous, aspectRatio: event.target.value as CanvasSettings["aspectRatio"] }))}
                aria-label="Canvas aspect ratio"
              >
                {ratioOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} · {option.detail}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="export-trigger"
              onClick={() => {
                if (onOpenExport) {
                  onOpenExport();
                  return;
                }
                setExportError("");
                setExportComplete(false);
                setIsExportPanelOpen(true);
              }}
              disabled={!duration || isExporting}
            >
              <Share2 size={16} /> Export video
            </button>
          </div>
        </header>

        <div className="preview-stage" ref={canvasAreaRef} tabIndex={0} onKeyDown={handleCanvasKeyDown}>
          <div className={`canvas-frame ratio-${settings.aspectRatio.replace(":", "-")} ${isZoom100 ? "canvas-actual-size" : ""}`}>
            <canvas
              ref={canvasRef}
              width={dims.width}
              height={dims.height}
              onClick={handleCanvasClick}
              onDoubleClick={handleCanvasDoubleClick}
              aria-label="Caption preview. Click a visible caption to edit it."
              className={editingSubtitleId ? "editing" : ""}
            />
            {editingSubtitleId && inlineEditorStyle && (
              <textarea
                ref={inlineEditorRef}
                className="caption-inline-editor"
                style={inlineEditorStyle}
                autoFocus
                value={draftText}
                onChange={event => {
                  draftTextRef.current = event.target.value;
                  setDraftText(event.target.value);
                }}
                onBlur={saveInlineEdit}
                onKeyDown={event => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    cancelInlineEdit();
                  } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    saveInlineEdit();
                  }
                }}
                aria-label="Edit caption text"
              ></textarea>
            )}
          </div>
          {!videoFile && <div className="preview-empty">Upload media to start previewing</div>}
          <video
            ref={mediaRef}
            className="media-source"
            onTimeUpdate={drawFrame}
            onLoadedMetadata={handleLoadedMetadata}
            onLoadedData={drawFrame}
            onError={() => setExportError("The browser could not play this media format.")}
          ></video>
          {settings.customVideoUrl && (
            <video
              ref={customVideoRef}
              src={settings.customVideoUrl}
              className="media-source visually-hidden"
              loop
              muted
              playsInline
              preload="auto"
              onLoadedData={drawFrame}
              onError={() => setExportError("Unable to load the background video format.")}
            ></video>
          )}
        </div>

        {/* BOTTOM STUDIO TIMELINE PANEL */}
        <section className="player-panel">
          {/* PLAY CONTROLS & TIMECODE */}
          <div className="player-controls">
            <button
              type="button"
              className="studio-play-btn"
              onClick={togglePlay}
              disabled={isExporting}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            </button>

            <span className="studio-time-display current">{formatDuration(currentTime)}</span>

            <div className="studio-seek-bar-wrap">
              <div
                className="studio-seek-progress"
                style={{ width: `${(currentTime / effectiveDuration) * 100}%` }}
              />
              <input
                className="studio-seek-slider"
                type="range"
                min="0"
                max={effectiveDuration}
                step="0.01"
                value={Math.min(currentTime, effectiveDuration)}
                onChange={event => {
                  const targetTime = Number(event.target.value);
                  if (mediaRef.current) mediaRef.current.currentTime = targetTime;
                  if (songMediaRef.current) songMediaRef.current.currentTime = targetTime;
                  drawFrame();
                }}
                disabled={!effectiveDuration}
                aria-label="Seek media"
              />
            </div>

            <span className="studio-time-display total">{formatDuration(effectiveDuration)}</span>

            {/* CONTEXT-AWARE VOLUME CONTROLLER */}
            <span className="volume-context-pill">
              {selectedLayer === "music" && localSongUrl ? "Song Vol" : "Main Vol"}
            </span>
            <button
              type="button"
              className="studio-volume-btn"
              onClick={() => {
                if (selectedLayer === "music" && songMediaRef.current) {
                  songMediaRef.current.muted = !songMediaRef.current.muted;
                  setSongVolume(songMediaRef.current.muted ? 0 : 0.8);
                } else if (mediaRef.current) {
                  mediaRef.current.muted = !mediaRef.current.muted;
                  setVolume(mediaRef.current.muted ? 0 : 1);
                }
              }}
              aria-label="Toggle mute"
            >
              {(selectedLayer === "music" ? songVolume === 0 : volume === 0) ? (
                <VolumeX size={15} />
              ) : (
                <Volume2 size={15} />
              )}
            </button>
            <input
              className="studio-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedLayer === "music" ? songVolume : volume}
              onChange={event => {
                const next = Number(event.target.value);
                if (selectedLayer === "music") {
                  setSongVolume(next);
                  if (songMediaRef.current) {
                    songMediaRef.current.volume = next;
                    songMediaRef.current.muted = next === 0;
                  }
                } else {
                  setVolume(next);
                  if (mediaRef.current) {
                    mediaRef.current.volume = next;
                    mediaRef.current.muted = next === 0;
                  }
                }
              }}
              aria-label="Volume"
            />
          </div>

          {/* TIMELINE WITH UNCLIPPED MILLISECONDS RULER */}
          <div
            className="timeline-editor"
            aria-label="Timeline"
            
          >
            {/* HORIZONTAL PANNING WRAPPER */}
            <div
              className="timeline-viewport-scroller"
              ref={timelineViewportRef}
              
            >
              {/* VIRTUAL CANVAS SIZED FOR DEFAULT 20 SECONDS VIEWPORT */}
              <div
                className="timeline-virtual-canvas"
                style={{
                  width: `${Math.max(100, (effectiveDuration / 20) * 100 * timelineZoom)}%`,
                }}
              >
                {/* HIGH-PRECISION UNCLIPPED RULER */}
                <div className="timeline-ruler" aria-hidden="true">
                  {(() => {
                    const step = timelineZoom > 2 ? 0.25 : timelineZoom > 1 ? 0.5 : 1.0;
                    const ticks = [];
                    for (let t = 0; t <= effectiveDuration; t += step) {
                      const isMajor = Math.abs(t % 1) < 0.001;
                      ticks.push(
                        <div
                          key={t}
                          className={`ruler-tick ${isMajor ? "major" : "minor"}`}
                          style={{ left: `${(t / effectiveDuration) * 100}%` }}
                        >
                          <span className="ruler-tick-label">
                            {formatPrecisionTime(t)}
                          </span>
                        </div>
                      );
                    }
                    return ticks;
                  })()}
                </div>

                {/* 4-TIER TRACK STACK */}
                <div className={`timeline-tracks-stack active-layer-${selectedLayer}`}>
                  {/* TRACK 1: AUDIO */}
                  <div
                    className={`timeline-unified-row row-audio ${selectedLayer === "audio" ? "is-selected" : "is-dimmed"}`}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedLayer("audio");
                      selectSubtitle(null);
                    }}
                  >
                    <span className="track-name-tag audio-tag">Audio</span>
                    <div className="track-lane" onClick={handleTimelineClick}>
                      <div
                        className="track-lane-clip clip-audio-fill"
                        style={{
                          width: `${((duration || mediaDuration || 7) / effectiveDuration) * 100}%`,
                        }}
                      >
                        <span className="clip-label-text">{videoFile?.name || "Uploaded audio track"}</span>
                      </div>
                    </div>
                  </div>

                  {/* TRACK 2: BACKGROUND */}
                  <div
                    className={`timeline-unified-row row-bg ${selectedLayer === "background" ? "is-selected" : "is-dimmed"}`}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedLayer("background");
                      selectSubtitle(null);
                    }}
                  >
                    <span className="track-name-tag bg-tag">Background</span>
                    <div className="track-lane" onClick={handleTimelineClick}>
                      <div className="track-lane-clip clip-bg-fill" style={{ width: "100%" }}>
                        <span className="clip-label-text">
                          {settings.backgroundTheme === "custom-image"
                            ? "Custom photo backdrop"
                            : settings.backgroundTheme === "custom-video"
                              ? "Custom video backdrop"
                              : `Theme: ${settings.backgroundTheme ? settings.backgroundTheme.toUpperCase() : "MIDNIGHT"}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TRACK 3: CAPTION */}
                  <div
                    className={`timeline-unified-row row-caption track-row-captions ${selectedLayer === "caption" ? "is-selected" : "is-dimmed"}`}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedLayer("caption");
                    }}
                  >
                    <span className="track-name-tag caption-tag">Caption</span>
                    <div className="track-lane captions-lane" ref={captionTrackRef} onClick={handleTimelineClick}>
                      {subtitles.map(subtitle => {
                        const timing = timelineTimingPreview?.id === subtitle.id ? timelineTimingPreview : subtitle;
                        const startPercent = Math.max(0, Math.min(100, (timing.start / effectiveDuration) * 100));
                        const widthPercent = Math.max(0.5, ((timing.end - timing.start) / effectiveDuration) * 100);
                        const isSelected = subtitle.id === selectedSubtitleId;
                        const isEditingThis = editingSubtitleId === subtitle.id;

                        return (
                          <div
                            key={subtitle.id}
                            className={`caption-segment-pill ${isSelected ? "is-selected" : selectedSubtitleId ? "is-caption-dimmed" : ""}`}
                            style={{
                              left: `${startPercent}%`,
                              width: `${widthPercent}%`,
                            }}
                            onPointerDown={event => {
                              if (isEditingThis) return;
                              event.stopPropagation();
                              setSelectedLayer("caption");
                              selectSubtitle(subtitle.id);
                              beginTimelineDrag(event, subtitle, "move");
                            }}
                            onPointerMove={handleClipPointerMove}
                            onPointerUp={event => endTimelineDrag(event)}
                            onDoubleClick={e => {
                              e.stopPropagation();
                              startEditing(subtitle);
                            }}
                          >
                            <button
                              type="button"
                              className="caption-trim-handle start"
                              aria-label="Trim start"
                              onPointerDown={event => {
                                event.stopPropagation();
                                beginTimelineDrag(event, subtitle, "start");
                              }}
                              onKeyDown={event => nudgeCaptionEdge(event, subtitle, "start")}
                              onClick={e => e.stopPropagation()}
                            ></button>
                            
                            {isEditingThis ? (
                              <input
                                className="timeline-caption-inline-input"
                                autoFocus
                                value={draftText}
                                onChange={e => {
                                  draftTextRef.current = e.target.value;
                                  setDraftText(e.target.value);
                                }}
                                onBlur={saveInlineEdit}
                                onKeyDown={e => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    saveInlineEdit();
                                  }
                                  if (e.key === "Escape") {
                                    e.preventDefault();
                                    cancelInlineEdit();
                                  }
                                }}
                                onClick={e => e.stopPropagation()}
                                onPointerDown={e => e.stopPropagation()}
                              />
                            ) : (
                              <span className="caption-text-preview">
                                {getCaptionText(subtitle.text, language, subtitle.tenglishText)}
                              </span>
                            )}

                            <button
                              type="button"
                              className="caption-trim-handle end"
                              aria-label="Trim end"
                              onPointerDown={event => {
                                event.stopPropagation();
                                beginTimelineDrag(event, subtitle, "end");
                              }}
                              onKeyDown={event => nudgeCaptionEdge(event, subtitle, "end")}
                              onClick={e => e.stopPropagation()}
                            ></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* TRACK 4: MUSIC */}
                  <div
                    className={`timeline-unified-row row-music ${selectedLayer === "music" ? "is-selected" : "is-dimmed"}`}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedLayer("music");
                      selectSubtitle(null);
                    }}
                  >
                    <span className="track-name-tag music-tag">Music</span>
                    <div className="track-lane" onClick={handleTimelineClick}>
                      {localSongUrl ? (
                        <div className="track-lane-clip clip-music-fill" style={{ width: "100%" }}>
                          <span className="clip-label-text">{localSongName || "Custom song track"}</span>
                          <button
                            type="button"
                            className="track-song-remove-btn"
                            onClick={e => {
                              e.stopPropagation();
                              if (localSongUrl.startsWith("blob:")) URL.revokeObjectURL(localSongUrl);
                              setLocalSongUrl(null);
                              setLocalSongName(null);
                              setSongDuration(0);
                            }}
                            title="Remove song"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="track-add-song-slot" onClick={e => e.stopPropagation()}>
                          <span>+ Select song from local device</span>
                          <input
                            type="file"
                            accept="audio/*,.mp3,.wav,.aac,.ogg,.m4a"
                            className="visually-hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (localSongUrl && localSongUrl.startsWith("blob:")) URL.revokeObjectURL(localSongUrl);
                                const url = URL.createObjectURL(file);
                                setLocalSongUrl(url);
                                setLocalSongName(file.name);
                                setSelectedLayer("music");
                              }
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BACKGROUND AUDIO PLAYER FOR LOCAL SONG */}
          {localSongUrl && (
            <audio
              ref={songMediaRef}
              src={localSongUrl}
              preload="auto"
              onLoadedMetadata={e => {
                const songLen = e.currentTarget.duration;
                if (Number.isFinite(songLen) && songLen > 0) {
                  setSongDuration(songLen);
                  }
              }}
              onEnded={() => {
                if (mediaRef.current && mediaRef.current.paused) {
                  setIsPlaying(false);
                }
              }}
            />
          )}
        </section>

        {exportError && <div className="workspace-error" role="alert">{exportError}</div>}
        <ExportModal
          open={isExportPanelOpen}
          aspectRatio={settings.aspectRatio}
          canExportWebm={canExportWebm}
          isExporting={isExporting}
          exportProgress={exportProgress}
          exportError={exportError}
          exportComplete={exportComplete}
          exportResolution={exportResolution}
          onChangeResolution={setExportResolution}
          exportCurrentTime={exportCurrentTime}
          exportTotalDuration={duration}
          onClose={() => setIsExportPanelOpen(false)}
          onCancel={cancelExport}
          onExportWebm={handleExportVideo}
          onExportFrame={handleExportFrame}
          onExportSrt={handleExportSrt}
          onExportVtt={handleExportVtt}
        />
      </main>

      {/* RIGHT PANEL: STUDIO CATALOG & INSPECTOR */}
      <aside className="style-sidebar">
        <div className="style-sidebar-scroll">

          {/* MAIN HEADING */}
          <div className="catalog-header">
            <span className="catalog-title">Style &amp; Appearance</span>
            <div className="catalog-tabs" role="tablist" aria-label="Style panels">
              <button
                type="button"
                role="tab"
                aria-selected={activeCatalogTab === "backgrounds"}
                className={`catalog-tab-btn ${activeCatalogTab === "backgrounds" ? "is-active" : ""}`}
                onClick={() => setActiveCatalogTab("backgrounds")}
              >
                <ImageIcon size={13} />
                <span>Backgrounds</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCatalogTab === "templates"}
                className={`catalog-tab-btn ${activeCatalogTab === "templates" ? "is-active" : ""}`}
                onClick={() => setActiveCatalogTab("templates")}
              >
                <LayoutTemplate size={13} />
                <span>Templates</span>
              </button>
            </div>
          </div>

          {/* TAB 1: BACKGROUNDS */}
          {activeCatalogTab === "backgrounds" && (
            <div className="catalog-pane">
              {/* Plain Colors */}
              <div className="sub-catalog-group">
                <span className="sub-group-title">Plain Colors</span>
                <div className="swatch-strip" role="group" aria-label="Plain background colors">
                  {[
                    { color: "#000000", label: "Black" },
                    { color: "#090b10", label: "Obsidian" },
                    { color: "#111827", label: "Slate" },
                    { color: "#172554", label: "Navy" },
                    { color: "#1e1b4b", label: "Indigo" },
                    { color: "#2e1065", label: "Deep Violet" },
                    { color: "#31102b", label: "Plum" },
                    { color: "#1c1917", label: "Warm Dark" },
                  ].map(item => (
                    <button
                      key={item.color}
                      type="button"
                      className={`solid-color-btn ${settings.backgroundColor === item.color && settings.backgroundTheme === "midnight" ? "is-active" : ""}`}
                      style={{ backgroundColor: item.color }}
                      onClick={() => setSettings(prev => ({ ...prev, backgroundTheme: "midnight", backgroundColor: item.color }))}
                      title={item.label}
                    >
                      {settings.backgroundColor === item.color && settings.backgroundTheme === "midnight" && (
                        <Check size={10} color="#ffffff" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                  <label className="solid-color-btn custom-picker-btn" title="Pick custom plain color">
                    <span>+</span>
                    <input
                      type="color"
                      className="hidden-color-input"
                      value={settings.backgroundColor || "#000000"}
                      onChange={e => setSettings(prev => ({ ...prev, backgroundTheme: "midnight", backgroundColor: e.target.value }))}
                    />
                  </label>
                </div>
              </div>

              {/* Color Palettes & Gradients */}
              <div className="sub-catalog-group">
                <span className="sub-group-title">Color Palettes &amp; Gradients</span>
                <div className="carousel-row">
                  {BACKGROUND_THEMES.filter(t => !["custom-image", "custom-video", "paper"].includes(t.id)).map(theme => {
                    const isSelected = settings.backgroundTheme === theme.id;
                    const isOriginal = theme.id === "original-video";
                    const isDisabled = isOriginal && !isVideoMedia;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        disabled={isDisabled}
                        className={`catalog-card ${isSelected ? "is-selected" : ""} ${isDisabled ? "is-disabled" : ""}`}
                        onClick={() => !isDisabled && setSettings(prev => ({ ...prev, backgroundTheme: theme.id }))}
                        title={theme.name}
                      >
                        <div className="card-thumb" style={{ background: theme.previewCss }}>
                          {isSelected && <span className="card-check"><Check size={11} strokeWidth={3} /></span>}
                        </div>
                        <span className="card-label">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patterns & Textures */}
              <div className="sub-catalog-group">
                <span className="sub-group-title">Patterns &amp; Textures</span>
                <div className="carousel-row">
                  {BACKGROUND_THEMES.filter(t => ["paper", "studio", "gradient"].includes(t.id)).map(theme => {
                    const isSelected = settings.backgroundTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        className={`catalog-card ${isSelected ? "is-selected" : ""}`}
                        onClick={() => setSettings(prev => ({ ...prev, backgroundTheme: theme.id }))}
                        title={theme.name}
                      >
                        <div className="card-thumb" style={{ background: theme.previewCss }}>
                          {isSelected && <span className="card-check"><Check size={11} strokeWidth={3} /></span>}
                        </div>
                        <span className="card-label">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Backdrop Upload */}
              <div className="sub-catalog-group">
                <span className="sub-group-title">Upload Background</span>
                <label className="upload-dropzone">
                  <FolderUp size={16} />
                  <span>Choose Photo or Video</span>
                  <small>JPG, PNG, MP4, WebM</small>
                  <input
                    type="file"
                    accept="image/*,video/*,.mp4,.mov,.webm"
                    className="visually-hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleMediaUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>

                {(settings.customImageDataUrl || settings.customVideoUrl) && (
                  <div className="active-upload-pill">
                    <span>Active custom media</span>
                    <button
                      type="button"
                      className="clear-upload-btn"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        customImageDataUrl: undefined,
                        customVideoUrl: undefined,
                        backgroundTheme: isVideoMedia ? "original-video" : "midnight",
                      }))}
                      title="Remove custom backdrop"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TEMPLATES */}
          {activeCatalogTab === "templates" && (
            <div className="catalog-pane">
              {/* Classic Styles */}
              <div className="sub-catalog-group">
                <div className="sub-group-header">
                  <span className="sub-group-title">Classic Styles</span>
                  <button type="button" className="palette-reset-btn" onClick={handleResetStyling} title="Reset template">
                    <RotateCcw size={11} />
                  </button>
                </div>
                <div className="carousel-row">
                  {CAPTION_TEMPLATES.filter(t => ["classic-white", "bold-creator", "minimal-clean", "telugu-friendly"].includes(t.id)).map(template => {
                    const isSelected = settings.selectedTemplateId === template.id;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        className={`catalog-card ${isSelected ? "is-selected" : ""}`}
                        onClick={() => handleApplyTemplate(template.id)}
                        title={template.name}
                      >
                        <div className="card-thumb template-thumb">
                          {renderTemplateSampleText(template)}
                          {isSelected && <span className="card-check"><Check size={11} strokeWidth={3} /></span>}
                        </div>
                        <span className="card-label">{template.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transition Styles */}
              <div className="sub-catalog-group">
                <span className="sub-group-title">Transitions</span>
                <div className="carousel-row">
                  {CAPTION_TEMPLATES.filter(t => ["cinematic", "boxed-subtitle", "tenglish-creator"].includes(t.id)).map(template => {
                    const isSelected = settings.selectedTemplateId === template.id;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        className={`catalog-card ${isSelected ? "is-selected" : ""}`}
                        onClick={() => handleApplyTemplate(template.id)}
                        title={template.name}
                      >
                        <div className="card-thumb template-thumb">
                          {renderTemplateSampleText(template)}
                          {isSelected && <span className="card-check"><Check size={11} strokeWidth={3} /></span>}
                        </div>
                        <span className="card-label">{template.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Animation & Kinetic */}
              <div className="sub-catalog-group">
                <span className="sub-group-title">Animation &amp; Kinetic</span>
                <div className="carousel-row">
                  {CAPTION_TEMPLATES.filter(t => ["word-highlight", "karaoke", "karaoke-highlight", "yellow-emphasis"].includes(t.id)).map(template => {
                    const isSelected = settings.selectedTemplateId === template.id;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        className={`catalog-card ${isSelected ? "is-selected" : ""}`}
                        onClick={() => handleApplyTemplate(template.id)}
                        title={template.name}
                      >
                        <div className="card-thumb template-thumb">
                          {renderTemplateSampleText(template)}
                          {isSelected && <span className="card-check"><Check size={11} strokeWidth={3} /></span>}
                        </div>
                        <span className="card-label">{template.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="panel-divider" />

          {/* DOCKED TYPOGRAPHY INSPECTOR */}
          <section className="inspector-section">
            <span className="inspector-section-label">Typography</span>

            <div className="inspector-form">
              {/* Row 1: Font & Style */}
              <div className="field-split">
                <div className="control-group">
                  <span className="control-label">Font</span>
                  <div className="custom-select-wrap">
                    <select
                      className="studio-select"
                      value={settings.fontFamily}
                      onChange={event => setAppearance("fontFamily", event.target.value)}
                    >
                      <option value="'Inter', sans-serif">Inter</option>
                      <option value="'Noto Sans Telugu', sans-serif">Telugu Sans</option>
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="'Courier New', monospace">Mono</option>
                    </select>
                  </div>
                </div>

                <div className="control-group">
                  <span className="control-label">Style</span>
                  <div className="custom-select-wrap">
                    <select
                      className="studio-select"
                      value={settings.style}
                      onChange={event => setAppearance("style", event.target.value as CanvasSettings["style"])}
                    >
                      <option value="outline">Outline</option>
                      <option value="kinetic">Highlight</option>
                      <option value="box">Box Card</option>
                      <option value="minimalist">Minimal</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2: Size */}
              <div className="control-group">
                <div className="slider-header">
                  <span className="control-label">Size</span>
                  <span className="slider-badge">{settings.fontSize}px</span>
                </div>
                <div className="slider-wrap">
                  <input
                    type="range"
                    className="studio-slider"
                    min="24"
                    max="100"
                    step="1"
                    value={settings.fontSize}
                    onChange={event => setAppearance("fontSize", Number(event.target.value))}
                  />
                </div>
              </div>

              {/* Row 3: Position & Alignment */}
              <div className="field-split">
                <div className="control-group">
                  <span className="control-label">Position</span>
                  <div className="custom-select-wrap">
                    <select
                      className="studio-select"
                      value={settings.verticalPosition}
                      onChange={event => setAppearance("verticalPosition", Number(event.target.value))}
                    >
                      <option value="0.2">Top</option>
                      <option value="0.5">Center</option>
                      <option value="0.78">Lower 3rd</option>
                      <option value="0.88">Bottom</option>
                    </select>
                  </div>
                </div>

                <div className="control-group">
                  <span className="control-label">Align</span>
                  <div className="studio-segmented-pill">
                    <button
                      type="button"
                      className={`pill-btn ${settings.alignment === "left" ? "is-active" : ""}`}
                      onClick={() => setAppearance("alignment", "left")}
                    >
                      Left
                    </button>
                    <button
                      type="button"
                      className={`pill-btn ${settings.alignment === "center" ? "is-active" : ""}`}
                      onClick={() => setAppearance("alignment", "center")}
                    >
                      Center
                    </button>
                    <button
                      type="button"
                      className={`pill-btn ${settings.alignment === "right" ? "is-active" : ""}`}
                      onClick={() => setAppearance("alignment", "right")}
                    >
                      Right
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 4: Colors */}
              <div className="control-group">
                <span className="control-label">Color Palette</span>
                <div className="palette-chip-grid">
                  <label className="color-chip" title="Text Color">
                    <span className="color-preview" style={{ backgroundColor: settings.textColor }} />
                    <span className="chip-name">Text</span>
                    <input
                      type="color"
                      className="hidden-color-input"
                      value={settings.textColor.startsWith("#") ? settings.textColor : "#ffffff"}
                      onChange={event => setAppearance("textColor", event.target.value)}
                    />
                  </label>

                  <label className="color-chip" title="Highlight Accent">
                    <span className="color-preview" style={{ backgroundColor: settings.highlightColor }} />
                    <span className="chip-name">Accent</span>
                    <input
                      type="color"
                      className="hidden-color-input"
                      value={settings.highlightColor.startsWith("#") ? settings.highlightColor : "#8b5cf6"}
                      onChange={event => setAppearance("highlightColor", event.target.value)}
                    />
                  </label>

                  <label className="color-chip" title="Box Backdrop">
                    <span className="color-preview" style={{ backgroundColor: settings.boxColor }} />
                    <span className="chip-name">Box</span>
                    <input
                      type="color"
                      className="hidden-color-input"
                      value={settings.boxColor.startsWith("#") ? settings.boxColor : "#000000"}
                      onChange={event => setAppearance("boxColor", event.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>

          <div className="panel-divider" />

          {/* SAFE GUIDES */}
          <section className="inspector-section" style={{ paddingBottom: "16px" }}>
            <span className="inspector-section-label">Safe Guides</span>
            <div className="inspector-form">
              <label className="studio-toggle-bar">
                <span>Display Safe Zones</span>
                <input
                  type="checkbox"
                  className="studio-checkbox"
                  checked={!!settings.safeZones?.show}
                  onChange={event => setSettings(previous => ({
                    ...previous,
                    safeZones: { ...(previous.safeZones ?? { platform: "instagram" }), show: event.target.checked },
                  }))}
                />
              </label>

              {settings.safeZones?.show && (
                <div className="studio-segmented-pill" style={{ marginTop: "8px" }}>
                  <button
                    type="button"
                    className={`pill-btn ${settings.safeZones?.platform === "instagram" ? "is-active" : ""}`}
                    onClick={() => setSettings(prev => ({ ...prev, safeZones: { platform: "instagram", show: true } }))}
                  >
                    Reels
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${settings.safeZones?.platform === "tiktok" ? "is-active" : ""}`}
                    onClick={() => setSettings(prev => ({ ...prev, safeZones: { platform: "tiktok", show: true } }))}
                  >
                    TikTok
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${settings.safeZones?.platform === "youtube" ? "is-active" : ""}`}
                    onClick={() => setSettings(prev => ({ ...prev, safeZones: { platform: "youtube", show: true } }))}
                  >
                    Shorts
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>
      </aside>
    </div>
  );
};