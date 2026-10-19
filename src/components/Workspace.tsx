import React, { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasSettings, Subtitle, CaptionLanguage, ExportResolutionPreset } from "../types";
import { getSubtitleCanvasLayout, renderSubtitlesToCanvas } from "../utils/SubtitleRenderer";
import { getPlatformSafeZone } from "../utils/creatorTools";
import { getCaptionText } from "../utils/transliterate";
import AnimatedTemplatePreview from "./AnimatedTemplatePreview";
import {
  CAPTION_SECTIONS,
  CAPTION_TEMPLATES,
  applyTemplateToSettings,
} from "../utils/captionTemplates";
import {
  drawBackgroundToCanvas,
} from "../utils/backgroundThemes";
import {
  Check,
  FolderUp,
  Image as ImageIcon,
  LayoutTemplate,
  Maximize2,
  Minimize2,
    Pencil,
    Share2,
      X,
  Trash2,
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
  captionSearchQuery?: string;
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
  onPlaybackStateChange?: (state: any) => void;
}



export const Workspace: React.FC<WorkspaceProps> = ({
  captionSearchQuery = "",
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
  onPlaybackStateChange,
}) => {
  const [hoveredTemplateId, setHoveredTemplateId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRef = useRef<HTMLVideoElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const customImageRef = useRef<HTMLImageElement | null>(null);
  const customVideoRef = useRef<HTMLVideoElement | null>(null);
  const songMediaRef = useRef<HTMLAudioElement | null>(null);
  const [songDuration, setSongDuration] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState<"audio" | "background" | "caption" | "music" | null>("caption");
  const [songVolume, setSongVolume] = useState(0.8);

  const updateSongVolume = useCallback((v: number) => {
    setSongVolume(v);
    if (songMediaRef.current) {
      songMediaRef.current.volume = v;
      songMediaRef.current.muted = v === 0;
    }
  }, []);

  const [bgSegments, setBgSegments] = useState<Array<{ id: string; start: number; end: number }>>([
    { id: "bg-default", start: 0, end: 0 }
  ]);
  const [songSegments, setSongSegments] = useState<Array<{ id: string; start: number; end: number }>>([
    { id: "song-default", start: 0, end: 0 }
  ]);
  
  const normalizeCaption = (str: string) =>
    str.toLowerCase().replace(/[.,/#!$%^&*;:{}=-_~()?]/g, "").trim();

    const isCaptionSearched = (captionText: string, query: string) => {
    const q = normalizeCaption(query);
    if (!q) return true;
    const text = normalizeCaption(captionText);
    if (text.includes(q)) return true;
    const qWords = q.split(/\s+/).filter(Boolean);
    const textWords = text.split(/\s+/).filter(Boolean);
    return qWords.some(qw => textWords.some(tw => tw.includes(qw) || qw.includes(tw)));
  };
const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  /* read captionSearchQuery */
  const activeSearchTerm = captionSearchQuery ? captionSearchQuery.trim().toLowerCase() : "";
  useEffect(() => {
    if (activeSearchTerm && timelineContainerRef.current) {
      const match = subtitles.find(s => s.text.toLowerCase().includes(activeSearchTerm));
      if (match) {
        const pps = 80;
        const targetLeft = match.start * pps - timelineContainerRef.current.clientWidth / 2;
        timelineContainerRef.current.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
      }
    }
  }, [activeSearchTerm, subtitles]);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const timelineViewportRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const [activeCatalogTab, setActiveCatalogTab] = useState<"backgrounds" | "templates" | "typography" | "advanced">("backgrounds");
  const [isZoom100, setIsZoom100] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const totalPlaybackDuration = Math.max(duration || 0, songDuration || 0, mediaDuration || 0);
  const effectiveDuration = totalPlaybackDuration > 0 ? totalPlaybackDuration : 1;
  const totalTimelineDuration = effectiveDuration + 30;
  const [volume, setVolume] = useState(1);
  const [localSelectedSubtitleId, setLocalSelectedSubtitleId] = useState<string | null>(null);
  const [editingSubtitleId, setEditingSubtitleId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [_inlineEditorStyle, setInlineEditorStyle] = useState<React.CSSProperties | null>(null);
  const inlineEditorRef = useRef<HTMLTextAreaElement>(null);
  const popupInputRef = useRef<HTMLInputElement>(null);
  const editOpenedAtRef = useRef<number>(0);
  const editingSubtitleIdRef = useRef<string | null>(null);
  const draftTextRef = useRef("");
  const [exportResolution, setExportResolution] = useState<ExportResolutionPreset>("1080p");
  const [exportCurrentTime, setExportCurrentTime] = useState(0);
  const [localSongUrl, setLocalSongUrl] = useState<string | null>(null);
  const [localSongName, setLocalSongName] = useState<string | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const seekToTime = useCallback((targetTime: number) => {
    const clamped = Math.max(0, Math.min(effectiveDuration, targetTime));
    setCurrentTime(clamped);

    const media = mediaRef.current;
    if (media) {
      if (clamped <= (media.duration || 0)) {
        media.currentTime = clamped;
      } else {
        media.pause();
      }
    }

    const song = songMediaRef.current;
    if (song && localSongUrl) {
      if (clamped <= (song.duration || 0)) {
        song.currentTime = clamped;
      } else {
        song.pause();
      }
    }
  }, [effectiveDuration, localSongUrl]);

  const handleNeedlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsScrubbing(true);
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const wasPlaying = isPlaying;
    if (wasPlaying) {
      setIsPlaying(false);
      if (mediaRef.current) mediaRef.current.pause();
      if (songMediaRef.current) songMediaRef.current.pause();
    }

    const updateTimeFromPointer = (clientX: number) => {
      const scroller = timelineViewportRef.current;
      if (!scroller) return;
      const rect = scroller.getBoundingClientRect();
      const clickX = clientX - rect.left + scroller.scrollLeft;
      const canvasWidth = scroller.scrollWidth;
      if (canvasWidth <= 0) return;
      const rawTime = (clickX / canvasWidth) * totalTimelineDuration;
      seekToTime(rawTime);
    };

    const handlePointerMove = (ev: PointerEvent) => {
      updateTimeFromPointer(ev.clientX);
    };

    const handlePointerUp = (ev: PointerEvent) => {
      setIsScrubbing(false);
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {
        // no-op
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  const splitCaptionAtPlayhead = useCallback(() => {
    if (!setSubtitles) return;
    setSubtitles(prev => {
      if (!prev || !Array.isArray(prev)) return prev;
      const targetIndex = prev.findIndex(
        s => currentTime > s.start + 0.15 && currentTime < (s.end || effectiveDuration) - 0.15
      );
      if (targetIndex === -1) return prev;

      const seg = prev[targetIndex];
      const segEnd = seg.end || effectiveDuration;
      const firstHalfDuration = currentTime - seg.start;
      const totalDuration = segEnd - seg.start;
      const ratio = firstHalfDuration / totalDuration;

      const words = (seg.text || "").trim().split(/\s+/);
      const splitPoint = Math.max(1, Math.min(words.length - 1, Math.round(words.length * ratio)));

      const firstText = words.slice(0, splitPoint).join(" ") || seg.text;
      const secondText = words.slice(splitPoint).join(" ") || "...";

      const firstSegment = {
        ...seg,
        end: currentTime,
        text: firstText,
      };

      const secondSegment = {
        ...seg,
        id: crypto.randomUUID ? crypto.randomUUID() : "split_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        start: currentTime,
        end: segEnd,
        text: secondText,
      };

      const updated = [...prev];
      updated.splice(targetIndex, 1, firstSegment, secondSegment);
      return updated;
    });
  }, [currentTime, effectiveDuration, setSubtitles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        splitCaptionAtPlayhead();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [splitCaptionAtPlayhead]);
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

  
  useEffect(() => {
    if (songMediaRef.current) {
      songMediaRef.current.volume = songVolume;
      songMediaRef.current.muted = songVolume === 0;
    }
  }, [songVolume]);

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = volume;
      mediaRef.current.muted = volume === 0;
    }
  }, [volume]);

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
      backgroundColor: settings.backgroundColor,
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

    // setCurrentTime driven by master clock loop
    if (isExporting && duration > 0) {
      setExportProgress(Math.min(100, (media.currentTime / duration) * 100));
    }

    // requestAnimationFrame handled by masterClockLoop
  }, [duration, isExporting, isVideoMedia, language, selectedSubtitleId, settings, subtitles]);

  useEffect(() => {
    if (!isPlaying) return;
    let lastTime = performance.now();

    const masterClockLoop = (now: number) => {
      if (!isPlayingRef.current) return;
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setCurrentTime(prev => {
        const next = prev + delta;
        if (next >= effectiveDuration) {
          isPlayingRef.current = false;
          setIsPlaying(false);
          if (mediaRef.current) mediaRef.current.pause();
          if (songMediaRef.current) songMediaRef.current.pause();

          if (timelineViewportRef.current) {
            const scroller = timelineViewportRef.current;
            const scrollableWidth = scroller.scrollWidth - scroller.clientWidth;
            if (scrollableWidth > 0) {
              scroller.scrollLeft = (effectiveDuration / totalTimelineDuration) * scrollableWidth;
            }
          }
          return effectiveDuration;
        }

        const media = mediaRef.current;
        if (media) {
          if (next < (media.duration || 0)) {
            if (media.paused && !media.ended) void media.play().catch(() => undefined);
          } else {
            if (!media.paused) media.pause();
          }
        }

        const song = songMediaRef.current;
        if (song && localSongUrl) {
          if (next < (song.duration || 0)) {
            if (song.paused && !song.ended) void song.play().catch(() => undefined);
          } else {
            if (!song.paused) song.pause();
          }
        }

        if (timelineViewportRef.current) {
          const scroller = timelineViewportRef.current;
          const scrollableWidth = scroller.scrollWidth - scroller.clientWidth;
          if (scrollableWidth > 0) {
            scroller.scrollLeft = (next / totalTimelineDuration) * scrollableWidth;
          }
        }

        return next;
      });

      drawFrame();
      if (isPlayingRef.current) {
        animationRef.current = requestAnimationFrame(masterClockLoop);
      }
    };

    animationRef.current = requestAnimationFrame(masterClockLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, effectiveDuration, totalTimelineDuration, drawFrame]);

  useEffect(() => {
    const container = timelineContainerRef.current || timelineViewportRef.current;
    const scroller = timelineViewportRef.current;
    if (!container || !scroller) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = scroller.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const prevScrollLeft = scroller.scrollLeft;
        const prevScrollWidth = scroller.scrollWidth;
        const factor = e.deltaY < 0 ? 1.15 : 0.87;

        setTimelineZoom(prev => {
          const nextZoom = Math.max(0.5, Math.min(6, Number((prev * factor).toFixed(2))));
          requestAnimationFrame(() => {
            if (timelineViewportRef.current && prevScrollWidth > 0) {
              const newScrollWidth = timelineViewportRef.current.scrollWidth;
              const contentPoint = prevScrollLeft + cursorX;
              const newContentPoint = contentPoint * (newScrollWidth / prevScrollWidth);
              timelineViewportRef.current.scrollLeft = newContentPoint - cursorX;
            }
          });
          return nextZoom;
        });
      } else {
        const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
        if (delta !== 0) {
          e.preventDefault();
          scroller.scrollLeft += delta;
        }
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    drawFrameRef.current = drawFrame;
  }, [drawFrame]);

  
  
  useEffect(() => {
    onPlaybackStateChange?.({
      isPlaying,
      currentTime,
      duration: effectiveDuration,
      volume,
      songVolume,
      hasSong: Boolean(localSongUrl),
      togglePlay,
      seek: (t: number) => {
        seekToTime(t);
        drawFrame();
      },
      setVolume: (v: number) => {
        setVolume(v);
        if (mediaRef.current) {
          mediaRef.current.volume = v;
          mediaRef.current.muted = v === 0;
        }
      },
      setSongVolume: updateSongVolume,
      splitActiveLayer: handleSplitActiveLayer,
      deleteActiveLayer: handleDeleteActiveLayer,
    });
  }, [isPlaying, currentTime, effectiveDuration, volume, songVolume, localSongUrl, selectedLayer, selectedSegmentId, onPlaybackStateChange, seekToTime, drawFrame]);




  
  



  
  



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
    isPlayingRef.current = false;
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
    editOpenedAtRef.current = Date.now();
    setEditingSubtitleId(subtitle.id);
    setTimeout(() => {
      if (popupInputRef.current) {
        popupInputRef.current.focus();
        const len = popupInputRef.current.value.length;
        popupInputRef.current.setSelectionRange(len, len);
      }
    }, 50);
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
      if (target instanceof Node && (inlineEditorRef.current?.contains(target) || popupInputRef.current?.closest('.timeline-caption-edit-modal')?.contains(target))) return;
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

    if (!isPlayingRef.current) {
      if (currentTime >= effectiveDuration) {
        setCurrentTime(0);
        if (media) media.currentTime = 0;
        if (song) song.currentTime = 0;
        if (timelineViewportRef.current) timelineViewportRef.current.scrollLeft = 0;
      }
      if (media && currentTime < (media.duration || 0)) {
        media.currentTime = currentTime;
        void media.play().catch(() => undefined);
      }
      if (song && localSongUrl && currentTime < (song.duration || 0)) {
        song.currentTime = currentTime;
        void song.play().catch(() => undefined);
      }
      if (timelineViewportRef.current) {
        const scroller = timelineViewportRef.current;
        const trackScrollableWidth = scroller.scrollWidth - scroller.clientWidth;
        if (trackScrollableWidth > 0) {
          scroller.scrollLeft = (currentTime / effectiveDuration) * trackScrollableWidth;
        }
      }
      isPlayingRef.current = true;
      setIsPlaying(true);
    } else {
      isPlayingRef.current = false;
      setIsPlaying(false);
      if (media) media.pause();
      if (song) song.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
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
      backgroundColor: settings.backgroundColor,
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

  
  // @ts-ignore
  const handleSplitActiveLayer = () => {
    if (selectedLayer === "background") {
      setBgSegments(prev => {
        const seg = (prev.find(s => s.id === selectedSegmentId) || prev.find(s => currentTime > s.start && currentTime < (s.end || effectiveDuration)));
        if (!seg) return prev;
        const actualEnd = seg.end || effectiveDuration;
        if (currentTime <= seg.start + 0.05 || currentTime >= actualEnd - 0.05) return prev;
        const newSeg1 = { id: seg.id, start: seg.start, end: currentTime };
        const newSeg2 = { id: "bg-" + Date.now(), start: currentTime, end: actualEnd };
        return prev.map(s => s.id === seg.id ? newSeg1 : s).concat(newSeg2).sort((a,b) => a.start - b.start);
      });
    } else if (selectedLayer === "music") {
      setSongSegments(prev => {
        const actualEnd = songDuration || 7;
        const seg = (prev.find(s => s.id === selectedSegmentId) || prev.find(s => currentTime > s.start && currentTime < (s.end || actualEnd)));
        if (!seg) return prev;
        const segEnd = seg.end || actualEnd;
        if (currentTime <= seg.start + 0.05 || currentTime >= segEnd - 0.05) return prev;
        const newSeg1 = { id: seg.id, start: seg.start, end: currentTime };
        const newSeg2 = { id: "song-" + Date.now(), start: currentTime, end: segEnd };
        return prev.map(s => s.id === seg.id ? newSeg1 : s).concat(newSeg2).sort((a,b) => a.start - b.start);
      });
    }
  };

  const handleDeleteActiveLayer = () => {
    if (selectedLayer === "background") {
      if (bgSegments.length > 1 && selectedSegmentId) {
        setBgSegments(prev => prev.filter(s => s.id !== selectedSegmentId));
        setSelectedSegmentId(null);
      }
    } else if (selectedLayer === "music") {
      if (songSegments.length > 1 && selectedSegmentId) {
        setSongSegments(prev => prev.filter(s => s.id !== selectedSegmentId));
        setSelectedSegmentId(null);
      } else {
        if (localSongUrl && localSongUrl.startsWith("blob:")) URL.revokeObjectURL(localSongUrl);
        setLocalSongUrl(null);
        setLocalSongName(null);
        setSongDuration(0);
        setSongSegments([{ id: "song-default", start: 0, end: 0 }]);
        setSelectedSegmentId(null);
      }
    }
  };

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      if (mediaRef.current) mediaRef.current.pause();
      if (songMediaRef.current) songMediaRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    }

    if (editingSubtitleId) saveInlineEdit();
    const scroller = timelineViewportRef.current;
    if (!scroller) return;

    const rect = scroller.getBoundingClientRect();
    const scrollableWidth = scroller.scrollWidth - scroller.clientWidth;
    if (scrollableWidth <= 0) return;

    const needleScreenOffset = scroller.clientWidth * 0.25;
    const rawScroll = event.clientX - rect.left + scroller.scrollLeft - needleScreenOffset;
    const clampedScroll = Math.max(0, Math.min(scrollableWidth, rawScroll));
    const nextTime = Math.max(0, Math.min(effectiveDuration, (clampedScroll / scrollableWidth) * totalTimelineDuration));

    scroller.scrollLeft = clampedScroll;
    seekToTime(nextTime);
    drawFrame();
  };

  const getDraggedTiming = (drag: TimelineDrag, clientX: number): TimelineTiming => {
    const delta = (clientX - drag.startX) / drag.pixelsPerSecond;
    const { start, end } = drag.original;
    const audioLimit = duration || mediaDuration || 0;
    const minimum = Math.min(MIN_CAPTION_DURATION, audioLimit || effectiveDuration);
    const snapThreshold = 0.15;

    if (drag.mode === "move") {
      const length = end - start;
      let nextStart = clamp(start + delta, 0, Math.max(0, audioLimit - length));
      let nextEnd = nextStart + length;
      if (Math.abs(nextStart - currentTime) < snapThreshold) {
        nextStart = currentTime;
        nextEnd = Math.min(audioLimit, nextStart + length);
      } else if (Math.abs(nextEnd - currentTime) < snapThreshold) {
        nextEnd = Math.min(audioLimit, currentTime);
        nextStart = Math.max(0, nextEnd - length);
      }
      return { start: nextStart, end: nextEnd };
    }

    if (drag.mode === "start") {
      let nextStart = clamp(start + delta, 0, end - minimum);
      if (Math.abs(nextStart - currentTime) < snapThreshold && currentTime < end - minimum) {
        nextStart = currentTime;
      }
      return { start: nextStart, end };
    }

    let nextEnd = clamp(end + delta, start + minimum, audioLimit);
    if (Math.abs(nextEnd - currentTime) < snapThreshold && currentTime > start + minimum) {
      nextEnd = Math.min(audioLimit, currentTime);
    }
    return { start, end: nextEnd };
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
    const audioLimit = duration || mediaDuration || 0;
    const minimum = Math.min(MIN_CAPTION_DURATION, audioLimit);
    const start = clamp(subtitle.start, 0, Math.max(0, audioLimit - minimum));
    const end = clamp(subtitle.end, start + minimum, audioLimit);
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

  
  
  const handleSelectBackgroundWithConfirm = (applyAction: () => void) => {
    if (settings.customImageDataUrl || settings.customVideoUrl) {
      const confirmed = window.confirm("Switching background preset will remove your uploaded media backdrop. Do you want to continue?");
      if (!confirmed) return;
      if (settings.customVideoUrl && settings.customVideoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(settings.customVideoUrl);
      }
      setSettings(prev => ({
        ...prev,
        customImageDataUrl: undefined,
        customVideoUrl: undefined
      }));
    }
    applyAction();
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

  
  return (
    <div className="preview-layout">
      {/* CENTER PANEL */}
      <main className="preview-workspace">
        <header
          className="workspace-header"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(180px, 1fr) auto auto",
            alignItems: "center",
            width: "100%",
            height: "48px",
            minHeight: "48px",
            maxHeight: "48px",
            padding: "0 14px",
            boxSizing: "border-box",
            background: "#0d1117",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            gap: "14px",
            overflow: "hidden",
            userSelect: "none",
            flexWrap: "nowrap"
          }}
        >
          {/* 1. LEFT ZONE: Duration Pill + Editable File Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
            {duration > 0 && (
              <span
                className="duration-pill"
                title="File duration"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 8px",
                  borderRadius: "5px",
                  background: "rgba(255, 255, 255, 0.07)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#d1d5db",
                  fontSize: "11px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  flexShrink: 0
                }}
              >
                {formatDuration(duration)}
              </span>
            )}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                minWidth: 0,
                flex: "0 1 300px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "6px",
                padding: "2px 6px"
              }}
            >
              <input
                ref={titleInputRef}
                className="project-title-input"
                value={projectTitle || ""}
                placeholder="Untitled project"
                onChange={event => onProjectTitleChange?.(event.target.value)}
                aria-label="Project title"
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#f3f4f6",
                  fontSize: "12px",
                  fontWeight: 600,
                  width: "100%",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              />
              <button
                type="button"
                className="title-edit-icon"
                onClick={() => titleInputRef.current?.focus()}
                title="Edit name"
                aria-label="Edit name"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255, 255, 255, 0.45)",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px",
                  flexShrink: 0
                }}
              >
                <Pencil size={11} />
              </button>
            </div>
          </div>

          {/* 2. CENTER ZONE: Canvas Scale & Fit Mode */}
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <button
              type="button"
              className="fit-toggle-button"
              onClick={() => setIsZoom100(prev => !prev)}
              title={isZoom100 ? "Fit to view" : "Scale to 100%"}
              aria-label={isZoom100 ? "Fit to view" : "Scale to 100%"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 9px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: isZoom100 ? "var(--accent-glow, var(--accent-soft)" : "rgba(255, 255, 255, 0.04)",
                color: isZoom100 ? "#93c5fd" : "#d1d5db",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {isZoom100 ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span>{isZoom100 ? "Fit view" : "100%"}</span>
            </button>
          </div>

          {/* 3. RIGHT ZONE: Aspect Ratio & Export Action */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                padding: "3px 6px"
              }}
            >
              <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 500 }}>Ratio</span>
              <select
                className="ratio-select"
                value={settings.aspectRatio}
                onChange={event => setSettings(previous => ({ ...previous, aspectRatio: event.target.value as CanvasSettings["aspectRatio"] }))}
                aria-label="Aspect ratio"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#f3f4f6",
                  fontSize: "11px",
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                {ratioOptions.map(option => (
                  <option key={option.value} value={option.value} style={{ background: "#11141c", color: "#fff" }}>
                    {option.label} · {option.detail}
                  </option>
                ))}
              </select>
            </div>

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
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 13px",
                borderRadius: "6px",
                background: "var(--accent-primary)",
                color: "#ffffff",
                border: "none",
                fontSize: "11px",
                fontWeight: 700,
                cursor: !duration || isExporting ? "not-allowed" : "pointer",
                opacity: !duration || isExporting ? 0.5 : 1,
                boxShadow: "0 2px 8px var(--accent-glow, var(--accent-glow)",
                whiteSpace: "nowrap"
              }}
            >
              <Share2 size={12} />
              <span>Export</span>
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
            {/* Canvas textarea replaced by popup modal */}
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
        <section
          className="player-panel"
          onClick={e => {
            const target = e.target as HTMLElement;
            if (!target.closest(".track-lane-clip") && !target.closest(".caption-segment-pill") && !target.closest(".track-name-tag") && !target.closest(".track-add-song-slot")) {
              setSelectedLayer(null);
              selectSubtitle(null);
              setSelectedSegmentId(null);
            }
          }}
        >
          {/* TIMELINE EDITOR */}
          <div className="timeline-editor" aria-label="Timeline" ref={timelineContainerRef} style={{ display: "flex", width: "100%", overflow: "hidden", position: "relative" }}>
            {/* 100% FIXED LEFT LABELS COLUMN */}
            <div
              className="timeline-fixed-headers"
              style={{
                width: "120px",
                minWidth: "120px",
                flexShrink: 0,
                zIndex: 30,
                background: "#0c1017",
                borderRight: "1px solid #1a2230",
                display: "flex",
                flexDirection: "column",
                userSelect: "none"
              }}
            >
              <div style={{ height: "26px", borderBottom: "1px solid #1a2230", background: "#090c12" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "6px", paddingBottom: "14px" }}>
                <div
                  className={`track-name-tag ${selectedLayer === "audio" ? "is-selected" : ""}`}
                  style={{ height: "34px", display: "flex", alignItems: "center", padding: "0 12px", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.05em", color: "#38bdf8", cursor: "pointer" }}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedLayer("audio");
                    selectSubtitle(null);
                  }}
                >
                  AUDIO
                </div>

                <div
                  className={`track-name-tag ${selectedLayer === "background" ? "is-selected" : ""}`}
                  style={{ height: "34px", display: "flex", alignItems: "center", padding: "0 12px", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.05em", color: "#93c5fd", cursor: "pointer" }}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedLayer("background");
                    selectSubtitle(null);
                  }}
                >
                  BACKGROUND
                </div>

                <div
                  className={`track-name-tag ${selectedLayer === "caption" ? "is-selected" : ""}`}
                  style={{ height: "40px", display: "flex", alignItems: "center", padding: "0 12px", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.05em", color: "#e879f9", cursor: "pointer" }}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedLayer("caption");
                  }}
                >
                  CAPTION
                </div>

                <div
                  className={`track-name-tag ${selectedLayer === "music" ? "is-selected" : ""}`}
                  style={{ height: "34px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.05em", color: "#60a5fa", cursor: "pointer" }}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedLayer("music");
                    selectSubtitle(null);
                  }}
                >
                  <span>MUSIC</span>
                  {localSongUrl && (
                    <button
                      type="button"
                      className="music-tag-bin-btn"
                      title="Delete song from project"
                      onClick={e => {
                        e.stopPropagation();
                        if (localSongUrl.startsWith("blob:")) URL.revokeObjectURL(localSongUrl);
                        setLocalSongUrl(null);
                        setLocalSongName(null);
                        setSongDuration(0);
                        setSongSegments([{ id: "song-default", start: 0, end: 0 }]);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* HORIZONTALLY SCROLLABLE TRACK LANES */}
            <div style={{ flex: 1, minWidth: 0, position: "relative", overflow: "hidden", display: "flex" }}>
              {/* FIXED CENTER-LEFT PLAYHEAD NEEDLE (LOCKED AT 25%) */}
              <div
                style={{
                  position: "absolute",
                  left: "25%",
                  top: 0,
                  bottom: 0,
                  width: "2px",
                  background: "#ffffff",
                  boxShadow: "0 0 8px rgba(255, 255, 255, 0.95)",
                  zIndex: 35,
                  pointerEvents: "none",
                  transform: "translateX(-50%)"
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-2px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    boxShadow: "0 0 10px #ffffff",
                    cursor: isScrubbing ? "grabbing" : "grab",
                    pointerEvents: "auto",
                    touchAction: "none"
                  }}
                  onPointerDown={handleNeedlePointerDown}
                />
              </div>

              <div
                className="timeline-viewport-scroller"
                ref={timelineViewportRef}
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflowX: "auto",
                  overflowY: "hidden",
                  position: "relative"
                }}
                onScroll={e => {
                  if (isPlayingRef.current) return;
                  const scroller = e.currentTarget;
                  const scrollableWidth = scroller.scrollWidth - scroller.clientWidth;
                  if (scrollableWidth > 0) {
                    const newTime = Math.max(0, Math.min(effectiveDuration, (scroller.scrollLeft / scrollableWidth) * totalTimelineDuration));
                    setCurrentTime(newTime);
                    const media = mediaRef.current;
                    if (media && newTime <= (media.duration || 0)) {
                      media.currentTime = newTime;
                    }
                    const song = songMediaRef.current;
                    if (song && localSongUrl && newTime <= (song.duration || 0)) {
                      song.currentTime = newTime;
                    }
                    drawFrame();
                  }
                }}
              >
                <div
                  className="timeline-virtual-canvas"
                  style={{
                    width: `${Math.max(100, (totalTimelineDuration / 20) * 100 * timelineZoom)}%`,
                    position: "relative",
                    minWidth: "100%",
                    paddingLeft: "25%",
                    paddingRight: "75%",
                    boxSizing: "content-box"
                  }}
                >
                  {/* TIME RULER EXTENDING +30s BEYOND THE LONGEST TRACK */}
                  <div className="timeline-ruler" aria-hidden="true" onClick={handleTimelineClick} style={{ height: "26px", position: "relative" }}>
                    {(() => {
                      const step = timelineZoom > 2 ? 0.25 : timelineZoom > 1 ? 0.5 : 1.0;
                      const ticks = [];
                      for (let t = 0; t <= totalTimelineDuration; t += step) {
                        const isMajor = Math.abs(t % 1) < 0.001;
                        ticks.push(
                          <div
                            key={t}
                            className={`ruler-tick ${isMajor ? "major" : "minor"}`}
                            style={{ left: `${(t / totalTimelineDuration) * 100}%` }}
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

                  {/* TRACK LANES WITH FULL-WIDTH SHADOW BASE */}
                  <div className={`timeline-tracks-stack ${selectedLayer ? "has-layer-selected" : "all-layers-active"}`} style={{ width: "100%", minWidth: "100%", display: "flex", flexDirection: "column", gap: "6px", paddingTop: "6px", paddingBottom: "14px" }}>
                    {/* TRACK 1: AUDIO */}
                    <div
                      className={`timeline-unified-row row-audio ${selectedLayer === "audio" ? "is-selected" : selectedLayer ? "is-dimmed" : "is-active"}`}
                      style={{ height: "34px", display: "block", background: "rgba(12, 16, 23, 0.45)", borderRadius: "4px", overflow: "hidden" }}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedLayer("audio");
                        selectSubtitle(null);
                      }}
                    >
                      <div className="track-lane" onClick={handleTimelineClick} style={{ height: "100%", width: "100%", position: "relative" }}>
                        <div
                          className="track-lane-clip clip-audio-fill"
                          style={{
                            width: `${Math.min(100, ((duration || mediaDuration || 0) / totalTimelineDuration) * 100)}%`,
                            height: "100%"
                          }}
                        >
                          <span className="clip-label-text">{videoFile?.name || "Uploaded audio track"}</span>
                        </div>
                      </div>
                    </div>

                    {/* TRACK 2: BACKGROUND */}
                    <div
                      className={`timeline-unified-row row-bg ${selectedLayer === "background" ? "is-selected" : selectedLayer ? "is-dimmed" : "is-active"}`}
                      style={{ height: "34px", display: "block", background: "rgba(12, 16, 23, 0.45)", borderRadius: "4px" }}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedLayer("background");
                        selectSubtitle(null);
                      }}
                    >
                      <div className="track-lane" onClick={handleTimelineClick} style={{ height: "100%", width: "100%", position: "relative" }}>
                        {bgSegments.map((seg, idx) => {
                          const start = seg.start;
                          const audioEnd = (duration || mediaDuration || 0);
   const end = seg.end ? Math.min(seg.end, audioEnd) : audioEnd;
                          const leftPct = (start / totalTimelineDuration) * 100;
                          const widthPct = Math.max(0.5, ((end - start) / totalTimelineDuration) * 100);
                          const isSegSelected = selectedSegmentId === seg.id;
                          return (
                            <div
                              key={seg.id}
                              className={`track-lane-clip clip-bg-fill ${isSegSelected ? "is-segment-active" : ""}`}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                height: "100%"
                              }}
                              onClick={ev => {
                                ev.stopPropagation();
                                setSelectedLayer("background");
                                setSelectedSegmentId(seg.id);
                              }}
                            >
                              <span className="clip-label-text">
                                {settings.backgroundTheme === "custom-image"
                                  ? "Custom photo backdrop"
                                  : settings.backgroundTheme === "custom-video"
                                    ? "Custom video backdrop"
                                    : `Theme: ${settings.backgroundTheme ? settings.backgroundTheme.toUpperCase() : "MIDNIGHT"}`}
                                {bgSegments.length > 1 ? ` (${idx + 1})` : ""}
                              </span>
                              {bgSegments.length > 1 && (
                                <button
                                  type="button"
                                  className="track-song-remove-btn"
                                  onClick={ev => {
                                    ev.stopPropagation();
                                    setBgSegments(prev => prev.filter(s => s.id !== seg.id));
                                  }}
                                  title="Delete background segment"
                                >
                                  <X size={11} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* TRACK 3: CAPTION */}
                    <div
                      className={`timeline-unified-row row-caption track-row-captions ${selectedLayer === "caption" ? "is-selected" : selectedLayer ? "is-dimmed" : "is-active"}`}
                      style={{ height: "40px", display: "block", background: "rgba(12, 16, 23, 0.45)", borderRadius: "4px" }}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedLayer("caption");
                      }}
                    >
                      <div className="track-lane captions-lane" ref={captionTrackRef} onClick={handleTimelineClick} style={{ height: "100%", width: "100%", position: "relative" }}>
                        {subtitles.map(subtitle => {
                          const isSearchHit = captionSearchQuery && captionSearchQuery.trim()
                            ? isCaptionSearched(subtitle.text, captionSearchQuery)
                            : true;
                          const timing = timelineTimingPreview?.id === subtitle.id ? timelineTimingPreview : subtitle;
                          const startPercent = Math.max(0, Math.min(100, (timing.start / totalTimelineDuration) * 100));
                          const widthPercent = Math.max(0.5, ((timing.end - timing.start) / totalTimelineDuration) * 100);
                          const isSelected = subtitle.id === selectedSubtitleId;

                          return (
                            <div
                              key={subtitle.id}
                              className={`caption-segment-pill ${isSelected ? "is-selected" : selectedSubtitleId ? "is-caption-dimmed" : ""}`}
                              style={{
                                left: `${startPercent}%`,
                                width: `${widthPercent}%`,
                                filter: captionSearchQuery && captionSearchQuery.trim()
                                  ? (isSearchHit
                                      ? "brightness(1.3) contrast(1.1) drop-shadow(0 0 8px rgba(168, 85, 247, 0.95))"
                                      : "grayscale(100%) opacity(0.2)")
                                  : undefined,
                                transform: captionSearchQuery && captionSearchQuery.trim() && isSearchHit ? "scale(1.02)" : undefined,
                                transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                              }}
                              onPointerDown={event => {
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
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedLayer("caption");
                                selectSubtitle(subtitle.id);
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
                              />
                              
                              <span className="caption-text-preview">
                                {getCaptionText(subtitle.text, language, subtitle.tenglishText)}
                              </span>

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
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* TRACK 4: MUSIC */}
                    <div
                      className={`timeline-unified-row row-music ${selectedLayer === "music" ? "is-selected" : selectedLayer ? "is-dimmed" : "is-active"}`}
                      style={{ height: "34px", display: "block", background: "rgba(12, 16, 23, 0.45)", borderRadius: "4px" }}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedLayer("music");
                        selectSubtitle(null);
                      }}
                    >
                      <div className="track-lane" onClick={handleTimelineClick} style={{ height: "100%", width: "100%", position: "relative" }}>
                        {localSongUrl ? (
                          songSegments.map((seg, idx) => {
                            const start = seg.start;
                            const actualEnd = seg.end || songDuration || 7;
                            const leftPct = (start / totalTimelineDuration) * 100;
                            const widthPct = Math.max(0.5, ((actualEnd - start) / totalTimelineDuration) * 100);
                            const isSegSelected = selectedSegmentId === seg.id;
                            return (
                              <div
                                key={seg.id}
                                className={`track-lane-clip clip-music-fill ${isSegSelected ? "is-segment-active" : ""}`}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  height: "100%"
                                }}
                                onClick={ev => {
                                  ev.stopPropagation();
                                  setSelectedLayer("music");
                                  setSelectedSegmentId(seg.id);
                                }}
                              >
                                <span className="clip-label-text">
                                  {localSongName || "Custom song track"}
                                  {songSegments.length > 1 ? ` (${idx + 1})` : ""}
                                </span>
                                {songSegments.length > 1 && (
                                  <button
                                    type="button"
                                    className="track-song-remove-btn"
                                    onClick={ev => {
                                      ev.stopPropagation();
                                      setSongSegments(prev => prev.filter(s => s.id !== seg.id));
                                    }}
                                    title="Delete segment"
                                  >
                                    <X size={11} />
                                  </button>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <label
                            className="track-add-song-slot"
                            onClick={e => e.stopPropagation()}
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 0,
                              bottom: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              paddingLeft: "14px",
                              cursor: "pointer",
                              zIndex: 10,
                              whiteSpace: "nowrap"
                            }}
                          >
                            <span style={{ textAlign: "left" }}>+ Select song from local device</span>
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

            {/* DIRECT CAPTION EDIT POPUP */}
            {editingSubtitleId && (
              <div
                className="timeline-modal-backdrop"
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 99999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.55)",
                  backdropFilter: "blur(3px)",
                }}
                onPointerDown={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
              >
                <div
                  className="timeline-caption-edit-modal"
                  style={{
                    position: "relative",
                    zIndex: 100000,
                    pointerEvents: "auto",
                  }}
                  onPointerDown={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                  onDoubleClick={e => e.stopPropagation()}
                >
                  <span className="edit-modal-title">Edit Caption Text</span>
                  <input
                    ref={popupInputRef}
                    type="text"
                    className="edit-modal-input"
                    value={draftText}
                    autoFocus
                    onChange={e => {
                      draftTextRef.current = e.target.value;
                      setDraftText(e.target.value);
                    }}
                    onKeyDown={e => {
                      e.stopPropagation();
                      if (e.key === "Enter") saveInlineEdit();
                      if (e.key === "Escape") cancelInlineEdit();
                    }}
                  />
                  <div className="edit-modal-actions">
                    <button
                      type="button"
                      className="edit-modal-cancel"
                      onClick={e => {
                        e.stopPropagation();
                        cancelInlineEdit();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="edit-modal-save"
                      onClick={e => {
                        e.stopPropagation();
                        saveInlineEdit();
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                  setSongSegments(prev => {
                    if (prev.length <= 1 && (prev[0]?.id === "song-default" || !prev[0]?.end)) {
                      return [{ id: "song-default", start: 0, end: songLen }];
                    }
                    return prev;
                  });
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

          {/* MAIN HEADING & 4 TOP TABS */}
          <div className="catalog-header">
            <span className="catalog-title">Style &amp; Appearance</span>
            <div className="catalog-tabs" role="tablist" aria-label="Style panels" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
              <button
                type="button"
                role="tab"
                aria-selected={activeCatalogTab === "backgrounds"}
                className={"catalog-tab-btn " + (activeCatalogTab === "backgrounds" ? "is-active" : "")}
                onClick={() => setActiveCatalogTab("backgrounds")}
              >
                <ImageIcon size={13} />
                <span>Backgrounds</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCatalogTab === "templates"}
                className={"catalog-tab-btn " + (activeCatalogTab === "templates" ? "is-active" : "")}
                onClick={() => setActiveCatalogTab("templates")}
              >
                <LayoutTemplate size={13} />
                <span>Templates</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCatalogTab === "typography"}
                className={"catalog-tab-btn " + (activeCatalogTab === "typography" ? "is-active" : "")}
                onClick={() => setActiveCatalogTab("typography")}
              >
                <span>Typography</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCatalogTab === "advanced"}
                className={"catalog-tab-btn " + (activeCatalogTab === "advanced" ? "is-active" : "")}
                onClick={() => setActiveCatalogTab("advanced")}
              >
                <span>Advanced</span>
              </button>
            </div>
          </div>

          {/* TAB 1: BACKGROUNDS */}
          {activeCatalogTab === "backgrounds" && (
            <div className="catalog-pane" style={{ display: "flex", flexDirection: "column", gap: "18px", padding: "4px 0" }}>
              {/* 1. Plain Colors */}
              <div className="sub-catalog-group">
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Plain Colors
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { color: "#ffffff", label: "White" },
                    { color: "#ef4444", label: "Red" },
                    { color: "#22c55e", label: "Green" },
                    { color: "var(--accent-primary)", label: "Blue" },
                    { color: "#000000", label: "Black" },
                  ].map(item => (
                    <button
                      key={item.color}
                      type="button"
                      className={"solid-color-btn " + (settings.backgroundColor === item.color && settings.backgroundTheme === "midnight" ? "is-active" : "")}
                      style={{
                        backgroundColor: item.color,
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        border: settings.backgroundColor === item.color && settings.backgroundTheme === "midnight" ? "2px solid var(--accent-primary)" : "1px solid rgba(255, 255, 255, 0.2)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
                      }}
                      onClick={() => handleSelectBackgroundWithConfirm(() => setSettings(prev => ({ ...prev, backgroundTheme: "midnight", backgroundColor: item.color, customImageDataUrl: undefined, customVideoUrl: undefined })))}
                      title={item.label}
                    >
                      {settings.backgroundColor === item.color && settings.backgroundTheme === "midnight" && (
                        <Check size={12} color={item.color === "#ffffff" ? "#000000" : "#ffffff"} strokeWidth={3} />
                      )}
                    </button>
                  ))}
                  <label
                    title="Pick custom plain color"
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      border: "1px dashed rgba(255, 255, 255, 0.35)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "1rem",
                      background: "rgba(255, 255, 255, 0.05)"
                    }}
                  >
                    <span>+</span>
                    <input
                      type="color"
                      style={{ display: "none" }}
                      value={settings.backgroundColor || "#000000"}
                      onChange={e => { const val = e.target.value; handleSelectBackgroundWithConfirm(() => setSettings(prev => ({ ...prev, backgroundTheme: "midnight", backgroundColor: val, customImageDataUrl: undefined, customVideoUrl: undefined }))); }}
                    />
                  </label>
                </div>
              </div>

              {/* 2. 10 Gradients in horizontal row */}
              <div className="sub-catalog-group">
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Gradients
                </span>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    overflowX: "auto",
                    paddingBottom: "6px",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none"
                  }}
                >
                  {[{"id":"sunset-mesh","name":"Sunset","css":"linear-gradient(135deg, #ff512f, #dd2476)"},{"id":"deep-blue","name":"Deep Blue","css":"linear-gradient(135deg, #0f2027, #203a43, #2c5364)"},{"id":"purple-haze","name":"Purple Haze","css":"linear-gradient(135deg, #7f00ff, #e100ff)"},{"id":"emerald","name":"Emerald","css":"linear-gradient(135deg, #0ba360, #3cba92)"},{"id":"crimson-tide","name":"Crimson","css":"linear-gradient(135deg, #642b73, #c6426e)"},{"id":"cyber-punk","name":"Cyberpunk","css":"linear-gradient(135deg, #ff0844, #ffb199)"},{"id":"aurora","name":"Aurora","css":"linear-gradient(135deg, #00c6ff, #0072ff)"},{"id":"golden-hour","name":"Gold","css":"linear-gradient(135deg, #f7971e, #ffd200)"},{"id":"midnight-neon","name":"Midnight","css":"linear-gradient(135deg, #182848, #4b6cb7)"},{"id":"dark-matter","name":"Obsidian","css":"linear-gradient(135deg, #232526, #414345)"}].map(g => {
                    const isSelected = settings.backgroundTheme === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleSelectBackgroundWithConfirm(() => setSettings(prev => ({ ...prev, backgroundTheme: g.id as any, customImageDataUrl: undefined, customVideoUrl: undefined })))}
                        title={g.name}
                        style={{
                          flex: "0 0 90px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "56px",
                            borderRadius: "6px",
                            background: g.css,
                            border: isSelected ? "2px solid var(--accent-primary)" : "1px solid rgba(255, 255, 255, 0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: isSelected ? "0 0 10px rgba(168, 85, 247, 0.4)" : "none"
                          }}
                        >
                          {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: "0.65rem", color: isSelected ? "#93c5fd" : "rgba(255, 255, 255, 0.6)", textAlign: "center", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {g.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. 10 Patterns in horizontal row */}
              <div className="sub-catalog-group">
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Patterns
                </span>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    overflowX: "auto",
                    paddingBottom: "6px",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none"
                  }}
                >
                  {[{"id":"pattern-grid","name":"Grid","css":"radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), #0f172a","bgSize":"16px 16px"},{"id":"pattern-dots","name":"Dots","css":"radial-gradient(rgba(255,255,255,0.15) 1.5px, transparent 1.5px), #1e1b4b","bgSize":"14px 14px"},{"id":"pattern-lines","name":"Lines","css":"repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 0, transparent 10px), #0c1017"},{"id":"pattern-carbon","name":"Carbon","css":"linear-gradient(27deg, #151515 5px, transparent 5px) 0 5px, linear-gradient(207deg, #151515 5px, transparent 5px) 10px 0px, #111"},{"id":"pattern-cubes","name":"Blueprint","css":"linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px), #030712","bgSize":"20px 20px"},{"id":"pattern-hex","name":"Hexagon","css":"radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.15) 20%, transparent 20%), #090b10","bgSize":"18px 18px"},{"id":"pattern-paper","name":"Paper","css":"radial-gradient(#ffffff 0.5px, transparent 0.5px), #1e293b","bgSize":"12px 12px"},{"id":"pattern-noise","name":"Studio","css":"radial-gradient(circle at center, #1e293b 0%, #090d16 100%)"},{"id":"pattern-scanlines","name":"Scanlines","css":"repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px), #1e1b4b"},{"id":"pattern-glow","name":"Glow Orb","css":"radial-gradient(circle at 50% 30%, var(--accent-glow, rgba(59, 130, 246, 0.4) 0%, transparent 70%), #020617"}].map(p => {
                    const isSelected = settings.backgroundTheme === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectBackgroundWithConfirm(() => setSettings(prev => ({ ...prev, backgroundTheme: p.id as any, customImageDataUrl: undefined, customVideoUrl: undefined })))}
                        title={p.name}
                        style={{
                          flex: "0 0 90px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "56px",
                            borderRadius: "6px",
                            background: p.css,
                            backgroundSize: p.bgSize || "auto",
                            border: isSelected ? "2px solid var(--accent-primary)" : "1px solid rgba(255, 255, 255, 0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: isSelected ? "0 0 10px rgba(168, 85, 247, 0.4)" : "none"
                          }}
                        >
                          {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: "0.65rem", color: isSelected ? "#93c5fd" : "rgba(255, 255, 255, 0.6)", textAlign: "center", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Upload Background Box supporting all formats */}
              <div className="sub-catalog-group">
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Upload Background
                </span>
                <label
                  className="upload-dropzone"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "18px 12px",
                    border: "1px dashed rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    background: "rgba(18, 24, 38, 0.5)",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  <FolderUp size={18} color="var(--accent-primary)" />
                  <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "#ffffff" }}>Choose Photo or Video</span>
                  <small style={{ fontSize: "0.65rem", color: "rgba(255, 255, 255, 0.45)" }}>All image and video formats supported</small>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="visually-hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleMediaUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>

                {(settings.customImageDataUrl || settings.customVideoUrl) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background: "rgba(124, 58, 237, 0.12)",
                        border: "1px solid rgba(168, 85, 247, 0.25)"
                      }}
                    >
                      <span style={{ fontSize: "0.72rem", color: "#93c5fd", fontWeight: 500 }}>Active custom media</span>
                      <button
                        type="button"
                        style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          customImageDataUrl: undefined,
                          customVideoUrl: undefined,
                          backgroundTheme: isVideoMedia ? "original-video" : "midnight",
                        }))}
                        title="Remove custom backdrop"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.6)" }}>Fit Mode</span>
                      <div style={{ display: "flex", gap: "4px", background: "rgba(18, 24, 38, 0.9)", padding: "2px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                        {[
                          { key: "cover", label: "Fill" },
                          { key: "contain", label: "Fit" },
                          { key: "stretch", label: "Stretch" },
                          { key: "blur-fill", label: "Blur Fill" },
                        ].map(item => {
                          const isActive = (settings.fitMode || "cover") === item.key;
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setSettings(prev => ({ ...prev, fitMode: item.key as any }))}
                              style={{
                                padding: "4px 8px",
                                fontSize: "0.63rem",
                                fontWeight: 600,
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                color: "#ffffff",
                                background: isActive ? "var(--accent-hover)" : "transparent"
                              }}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeCatalogTab === "templates" && (
            <div className="catalog-pane" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "4px 0" }}>
              {CAPTION_SECTIONS.map(section => {
                const groupTemplates = CAPTION_TEMPLATES.filter(t => t.category === section.key);
                if (groupTemplates.length === 0) return null;
                return (
                  <div key={section.key} className="sub-catalog-group" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span
                      className="sub-group-title"
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        color: "rgba(255, 255, 255, 0.45)",
                        textTransform: "lowercase",
                        display: "block",
                      }}
                    >
                      {section.title}
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                      {groupTemplates.map(template => {
                        const isSelected = settings.selectedTemplateId === template.id;
                        return (
                          <button
                            key={template.id}
                            type="button"
                            aria-pressed={isSelected}
                            onMouseEnter={() => setHoveredTemplateId(template.id)}
                            onMouseLeave={() => setHoveredTemplateId(null)}
                            onFocus={() => setHoveredTemplateId(template.id)}
                            onBlur={() => setHoveredTemplateId(null)}
                            onClick={() => setSettings(applyTemplateToSettings(settings, template.id))}
                            style={{
                              background: isSelected ? "var(--accent-glow, rgba(59, 130, 246, 0.16)" : "#14171c",
                              border: isSelected ? "1.5px solid var(--accent-primary)" : "1px solid #232730",
                              borderRadius: "12px",
                              padding: "8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              cursor: "pointer",
                              textAlign: "left",
                              width: "100%",
                              minWidth: 0,
                              transition: "border-color 0.15s ease, background 0.15s ease",
                            }}
                          >
                            <AnimatedTemplatePreview
                              template={template}
                              isHovered={hoveredTemplateId === template.id}
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "100%", minWidth: 0 }}>
                              <span
                                style={{
                                  fontSize: "0.58rem",
                                  fontWeight: 700,
                                  color: "rgba(255, 255, 255, 0.4)",
                                  border: "1px solid rgba(255, 255, 255, 0.12)",
                                  borderRadius: "4px",
                                  padding: "1px 4px",
                                  textTransform: "lowercase",
                                  flexShrink: 0,
                                }}
                              >
                                bold
                              </span>
                              {template.badge && (
                                <span
                                  style={{
                                    fontSize: "0.58rem",
                                    fontWeight: 700,
                                    color: "#38bdf8",
                                    border: "1px solid rgba(56, 189, 248, 0.25)",
                                    borderRadius: "4px",
                                    padding: "1px 4px",
                                    textTransform: "lowercase",
                                    flexShrink: 0,
                                  }}
                                >
                                  {template.badge}
                                </span>
                              )}
                              <span
                                style={{
                                  marginLeft: "auto",
                                  fontSize: "0.68rem",
                                  fontWeight: 600,
                                  color: isSelected ? "#93c5fd" : "#cbd5e1",
                                  textTransform: "lowercase",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {template.name}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {activeCatalogTab === "typography" && (
            <div className="catalog-pane" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "4px 0" }}>
              <div className="sub-catalog-group">
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Font and Weight
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div className="custom-select-wrap">
                    <select className="studio-select" value={settings.fontFamily} onChange={e => setAppearance("fontFamily", e.target.value)} style={{ fontFamily: settings.fontFamily }}>
                      <optgroup label="serif">
                        <option key="Times New Roman" value={"\"Times New Roman\", Times, serif"} style={{ fontFamily: "\"Times New Roman\", Times, serif" }}>Times New Roman</option>
                        <option key="Georgia" value={"Georgia, serif"} style={{ fontFamily: "Georgia, serif" }}>Georgia</option>
                        <option key="Garamond" value={"Garamond, \"Hoefler Text\", serif"} style={{ fontFamily: "Garamond, \"Hoefler Text\", serif" }}>Garamond</option>
                        <option key="Palatino" value={"\"Palatino Linotype\", Palatino, serif"} style={{ fontFamily: "\"Palatino Linotype\", Palatino, serif" }}>Palatino</option>
                        <option key="Baskerville" value={"Baskerville, serif"} style={{ fontFamily: "Baskerville, serif" }}>Baskerville</option>
                        <option key="Cambria" value={"Cambria, Georgia, serif"} style={{ fontFamily: "Cambria, Georgia, serif" }}>Cambria</option>
                      </optgroup>
                      <optgroup label="sans-serif">
                        <option key="Arial" value={"Arial, Helvetica, sans-serif"} style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>Arial</option>
                        <option key="Helvetica" value={"\"Helvetica Neue\", Helvetica, Arial, sans-serif"} style={{ fontFamily: "\"Helvetica Neue\", Helvetica, Arial, sans-serif" }}>Helvetica</option>
                        <option key="Verdana" value={"Verdana, Geneva, sans-serif"} style={{ fontFamily: "Verdana, Geneva, sans-serif" }}>Verdana</option>
                        <option key="Trebuchet MS" value={"\"Trebuchet MS\", sans-serif"} style={{ fontFamily: "\"Trebuchet MS\", sans-serif" }}>Trebuchet MS</option>
                        <option key="Segoe UI" value={"\"Segoe UI\", Roboto, sans-serif"} style={{ fontFamily: "\"Segoe UI\", Roboto, sans-serif" }}>Segoe UI</option>
                        <option key="Tahoma" value={"Tahoma, Verdana, sans-serif"} style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>Tahoma</option>
                      </optgroup>
                      <optgroup label="monospace">
                        <option key="Courier New" value={"\"Courier New\", Courier, monospace"} style={{ fontFamily: "\"Courier New\", Courier, monospace" }}>Courier New</option>
                        <option key="Consolas" value={"Consolas, monospace"} style={{ fontFamily: "Consolas, monospace" }}>Consolas</option>
                        <option key="Monaco" value={"Monaco, monospace"} style={{ fontFamily: "Monaco, monospace" }}>Monaco</option>
                        <option key="Lucida Console" value={"\"Lucida Console\", monospace"} style={{ fontFamily: "\"Lucida Console\", monospace" }}>Lucida Console</option>
                        <option key="Source Code Pro" value={"\"Source Code Pro\", monospace"} style={{ fontFamily: "\"Source Code Pro\", monospace" }}>Source Code Pro</option>
                        <option key="Generic Monospace" value={"monospace"} style={{ fontFamily: "monospace" }}>Generic Monospace</option>
                      </optgroup>
                      <optgroup label="cursive">
                        <option key="Comic Sans MS" value={"\"Comic Sans MS\", cursive, sans-serif"} style={{ fontFamily: "\"Comic Sans MS\", cursive, sans-serif" }}>Comic Sans MS</option>
                        <option key="Brush Script MT" value={"\"Brush Script MT\", cursive"} style={{ fontFamily: "\"Brush Script MT\", cursive" }}>Brush Script MT</option>
                        <option key="Lucida Handwriting" value={"\"Lucida Handwriting\", cursive"} style={{ fontFamily: "\"Lucida Handwriting\", cursive" }}>Lucida Handwriting</option>
                        <option key="Apple Chancery" value={"\"Apple Chancery\", cursive"} style={{ fontFamily: "\"Apple Chancery\", cursive" }}>Apple Chancery</option>
                        <option key="Bradley Hand" value={"\"Bradley Hand\", cursive"} style={{ fontFamily: "\"Bradley Hand\", cursive" }}>Bradley Hand</option>
                        <option key="Generic Cursive" value={"cursive"} style={{ fontFamily: "cursive" }}>Generic Cursive</option>
                      </optgroup>
                      <optgroup label="fantasy">
                        <option key="Impact" value={"Impact, fantasy"} style={{ fontFamily: "Impact, fantasy" }}>Impact</option>
                        <option key="Papyrus" value={"Papyrus, fantasy"} style={{ fontFamily: "Papyrus, fantasy" }}>Papyrus</option>
                        <option key="Copperplate" value={"\"Copperplate Gothic\", Copperplate, fantasy"} style={{ fontFamily: "\"Copperplate Gothic\", Copperplate, fantasy" }}>Copperplate</option>
                        <option key="Harrington" value={"Harrington, fantasy"} style={{ fontFamily: "Harrington, fantasy" }}>Harrington</option>
                        <option key="Luminari" value={"Luminari, fantasy"} style={{ fontFamily: "Luminari, fantasy" }}>Luminari</option>
                        <option key="Generic Fantasy" value={"fantasy"} style={{ fontFamily: "fantasy" }}>Generic Fantasy</option>
                      </optgroup>
                      <optgroup label="system-ui">
                        <option key="System Default" value={"system-ui, -apple-system, sans-serif"} style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>System Default</option>
                        <option key="Segoe UI" value={"\"Segoe UI\", sans-serif"} style={{ fontFamily: "\"Segoe UI\", sans-serif" }}>Segoe UI</option>
                        <option key="Roboto" value={"Roboto, sans-serif"} style={{ fontFamily: "Roboto, sans-serif" }}>Roboto</option>
                        <option key="Cantarell" value={"Cantarell, sans-serif"} style={{ fontFamily: "Cantarell, sans-serif" }}>Cantarell</option>
                        <option key="San Francisco" value={"-apple-system, BlinkMacSystemFont, sans-serif"} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>San Francisco</option>
                        <option key="Ubuntu" value={"Ubuntu, sans-serif"} style={{ fontFamily: "Ubuntu, sans-serif" }}>Ubuntu</option>
                      </optgroup>
                      </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px", background: "rgba(18, 24, 38, 0.9)", padding: "2px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    {[
                      { key: "normal", label: "Regular" },
                      { key: "600", label: "Semi" },
                      { key: "700", label: "Bold" },
                      { key: "900", label: "Black" },
                    ].map(w => {
                      const isActive = (settings.fontWeight || "700") === w.key;
                      return (
                        <button
                          key={w.key}
                          type="button"
                          onClick={() => setAppearance("fontWeight", w.key as any)}
                          style={{
                            padding: "4px 6px",
                            fontSize: "0.63rem",
                            fontWeight: 600,
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            color: "#ffffff",
                            background: isActive ? "var(--accent-hover)" : "transparent"
                          }}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="sub-catalog-group">
                <div className="field-split">
                  <div className="control-group" style={{ flex: 1 }}>
                    <span className="control-label">Case</span>
                    <div className="studio-segmented-pill">
                      <button
                        type="button"
                        className={"pill-btn " + (settings.textTransform === "uppercase" ? "is-active" : "")}
                        onClick={() => setAppearance("textTransform", "uppercase")}
                      >
                        ALL CAPS
                      </button>
                      <button
                        type="button"
                        className={"pill-btn " + (settings.textTransform !== "uppercase" ? "is-active" : "")}
                        onClick={() => setAppearance("textTransform", "none")}
                      >
                        Normal
                      </button>
                    </div>
                  </div>

                  <div className="control-group" style={{ flex: 1 }}>
                    <span className="control-label">Style</span>
                    <div className="custom-select-wrap">
                      <select
                        className="studio-select"
                        value={settings.style}
                        onChange={e => setAppearance("style", e.target.value as CanvasSettings["style"])}
                      >
                        <option value="outline">Outline</option>
                        <option value="kinetic">Highlight</option>
                        <option value="box">Box Badge</option>
                        <option value="minimalist">Minimal</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sub-catalog-group">
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Size
                </span>
                <div className="control-group">
                  <div className="slider-header">
                    <span className="control-label">Font Size</span>
                    <span className="slider-badge">{settings.fontSize || 24}px</span>
                  </div>
                  <div className="slider-wrap">
                    <input
                      type="range"
                      className="studio-slider"
                      min="16"
                      max="100"
                      step="1"
                      value={settings.fontSize || 24}
                      onChange={e => setAppearance("fontSize", Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="sub-catalog-group">
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Position and Alignment
                </span>
                <div className="field-split">
                  <div className="control-group" style={{ flex: 1 }}>
                    <span className="control-label">Anchor</span>
                    <div className="custom-select-wrap">
                      <select
                        className="studio-select"
                        value={settings.verticalPosition <= 0.35 ? "0.2" : settings.verticalPosition >= 0.75 ? "0.88" : "0.5"}
                        onChange={e => setAppearance("verticalPosition", Number(e.target.value))}
                      >
                        <option value="0.2">Top</option>
                        <option value="0.5">Middle</option>
                        <option value="0.88">Bottom</option>
                      </select>
                    </div>
                  </div>

                  <div className="control-group" style={{ flex: 1 }}>
                    <span className="control-label">Align</span>
                    <div className="studio-segmented-pill">
                      <button
                        type="button"
                        className={"pill-btn " + (settings.alignment === "left" ? "is-active" : "")}
                        onClick={() => setAppearance("alignment", "left")}
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        className={"pill-btn " + (settings.alignment === "center" ? "is-active" : "")}
                        onClick={() => setAppearance("alignment", "center")}
                      >
                        Center
                      </button>
                      <button
                        type="button"
                        className={"pill-btn " + (settings.alignment === "right" ? "is-active" : "")}
                        onClick={() => setAppearance("alignment", "right")}
                      >
                        Right
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sub-catalog-group">
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Colors and Styling
                </span>
                <div className="palette-chip-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                  <label className="color-chip" title="Base Text Color">
                    <span className="color-preview" style={{ backgroundColor: settings.textColor }} />
                    <span className="chip-name">Text</span>
                    <input
                      type="color"
                      className="hidden-color-input"
                      value={settings.textColor.startsWith("#") ? settings.textColor : "#ffffff"}
                      onChange={e => setAppearance("textColor", e.target.value)}
                    />
                  </label>

                  <label className="color-chip" title="Spoken Word Accent">
                    <span className="color-preview" style={{ backgroundColor: settings.highlightColor }} />
                    <span className="chip-name">Accent</span>
                    <input
                      type="color"
                      className="hidden-color-input"
                      value={settings.highlightColor.startsWith("#") ? settings.highlightColor : "var(--accent-primary)"}
                      onChange={e => setAppearance("highlightColor", e.target.value)}
                    />
                  </label>

                  <label className="color-chip" title="Outline or Stroke Color">
                    <span className="color-preview" style={{ backgroundColor: settings.strokeColor || "#000000" }} />
                    <span className="chip-name">Stroke</span>
                    <input
                      type="color"
                      className="hidden-color-input"
                      value={(settings.strokeColor && settings.strokeColor.startsWith("#")) ? settings.strokeColor : "#000000"}
                      onChange={e => setAppearance("strokeColor", e.target.value)}
                    />
                  </label>

                  <label className="color-chip" title="Box Card Background">
                    <span className="color-preview" style={{ backgroundColor: settings.boxColor }} />
                    <span className="chip-name">Box</span>
                    <input
                      type="color"
                      className="hidden-color-input"
                      value={settings.boxColor.startsWith("#") ? settings.boxColor : "#000000"}
                      onChange={e => setAppearance("boxColor", e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADVANCED */}
          {activeCatalogTab === "advanced" && (
            <div className="catalog-pane" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "4px 0" }}>
              <div className="sub-catalog-group">
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Platform Safe Zones
                </span>
                <label className="studio-toggle-bar">
                  <span>Safe Area Overlays</span>
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
                  <div className="studio-segmented-pill" style={{ marginTop: "10px" }}>
                    <button
                      type="button"
                      className={"pill-btn " + (settings.safeZones?.platform === "instagram" ? "is-active" : "")}
                      onClick={() => setSettings(prev => ({ ...prev, safeZones: { platform: "instagram", show: true } }))}
                    >
                      Reels
                    </button>
                    <button
                      type="button"
                      className={"pill-btn " + (settings.safeZones?.platform === "tiktok" ? "is-active" : "")}
                      onClick={() => setSettings(prev => ({ ...prev, safeZones: { platform: "tiktok", show: true } }))}
                    >
                      TikTok
                    </button>
                    <button
                      type="button"
                      className={"pill-btn " + (settings.safeZones?.platform === "youtube" ? "is-active" : "")}
                      onClick={() => setSettings(prev => ({ ...prev, safeZones: { platform: "youtube", show: true } }))}
                    >
                      Shorts
                    </button>
                  </div>
                )}
              </div>

              <div style={{ padding: "16px 12px", border: "1px dashed rgba(255, 255, 255, 0.15)", borderRadius: "8px", textAlign: "center" }}>
                <p style={{ fontSize: "0.75rem", margin: 0, fontWeight: 600, color: "#ffffff" }}>Coming Soon</p>
                <p style={{ fontSize: "0.68rem", marginTop: "4px", color: "rgba(255, 255, 255, 0.45)", lineHeight: 1.4 }}>
                  Audio ducking curve, vocal equalizer sync, and custom export profiles.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
