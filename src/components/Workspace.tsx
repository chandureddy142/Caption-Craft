import { getPlanConfig } from "../utils/planLimits";
import { extractWaveformPeaks } from "../utils/waveformExtractor";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasSettings, Subtitle, CaptionLanguage, ExportResolutionPreset, TimelineBgSegment, TimelineSongSegment } from "../types";
import {
  getSubtitleCanvasLayout,
  renderSubtitlesToCanvas } from "../utils/SubtitleRenderer";
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
  Eye,
  EyeOff,
RotateCcw,
  Plus,
  Lock,
  Unlock,
  Music,
  ArrowUp, Magnet, Volume2, VolumeX } from "lucide-react";
import { ExportModal } from "./ExportModal";
import { downloadStringAsFile, exportToSRT, exportToVTT } from "../utils/exporter";
import {
  getPreferredMimeType,
  getExportDimensions,
  getSupportedWebmMimeType,
} from "../utils/exportCapabilities";



function formatRulerTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${mins}:${secs}`;
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

export interface WorkspaceProps {
  userPlan?: string;
  initialSongUrl?: string | null;
  initialSongName?: string | null;
  onSongChange?: (data: { songUrl: string | null; songName: string | null; songBlob?: Blob | null }) => void;
  bgSegments?: TimelineBgSegment[];
  setBgSegments?: React.Dispatch<React.SetStateAction<TimelineBgSegment[]>>;
  songSegments?: TimelineSongSegment[];
  setSongSegments?: React.Dispatch<React.SetStateAction<TimelineSongSegment[]>>;
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
  userPlan = "starter",
  bgSegments: externalBgSegments,
  setBgSegments: externalSetBgSegments,
  songSegments: externalSongSegments,
  setSongSegments: externalSetSongSegments,
  captionSearchQuery = "",
  videoFile,
  audioBlob,
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
  initialSongUrl,
  initialSongName,
  onSongChange,
  onPlaybackStateChange,
}) => {
  const planConfig = getPlanConfig(userPlan);
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

  const [internalBgSegments, setInternalBgSegments] = useState<TimelineBgSegment[]>([]);
  const bgSegments = externalBgSegments ?? internalBgSegments;
  const setBgSegments = externalSetBgSegments ?? setInternalBgSegments;
  const bgSegmentsRef = useRef<TimelineBgSegment[]>(bgSegments);
  bgSegmentsRef.current = bgSegments;

  const [internalSongSegments, setInternalSongSegments] = useState<TimelineSongSegment[]>([
    { id: "song-default", start: 0, end: 0 }
  ]);
  const songSegments = externalSongSegments ?? internalSongSegments;
  const setSongSegments = externalSetSongSegments ?? setInternalSongSegments;
  
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
const [areCaptionsHidden, setAreCaptionsHidden] = useState(false);
  const [isCaptionLocked, setIsCaptionLocked] = useState(false);





















  

  const handleResetPlayhead = (e: React.MouseEvent) => {
    e.stopPropagation();
    seekToTime(0);
    if (timelineViewportRef.current) timelineViewportRef.current.scrollLeft = 0;
  };

  const handleAddCaptionAtPlayhead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!setSubtitles) return;
    const t = currentTimeRef.current || 0;
    const dur = 1.5;
    const endT = Math.min(t + dur, effectiveDuration);
    const newSub: Subtitle = {
      id: "sub_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      start: t,
      end: endT,
      text: "New Caption",
      words: [{ word: "New", start: t, end: t + 0.75 }, { word: "Caption", start: t + 0.75, end: endT }],
    };
    setSubtitles(prev => [...prev, newSub].sort((a, b) => a.start - b.start));
    selectSubtitle(newSub.id);
    setSelectedLayer("caption");
  };
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const handleFitBgLeft = () => {
    if (!selectedSegmentId) return;
    setBgSegments(prev => {
        
        const sorted = [...prev].sort((a, b) => a.start - b.start);
      const idx = sorted.findIndex(s => s.id === selectedSegmentId);
      if (idx === -1) return prev;
      const prevNeighbor = sorted[idx - 1];
      const targetStart = prevNeighbor ? prevNeighbor.end : 0;
      return sorted.map(s => s.id === selectedSegmentId ? { ...s, start: targetStart } : s);
    });
    requestAnimationFrame(() => drawFrameRef.current());
  };

  const handleFitBgFull = () => {
    if (!selectedSegmentId) return;
    const maxEnd = duration || mediaDuration || effectiveDuration;
    if (!maxEnd) return;
    setBgSegments(prev => {
        
        const sorted = [...prev].sort((a, b) => a.start - b.start);
      const idx = sorted.findIndex(s => s.id === selectedSegmentId);
      if (idx === -1) return prev;
      const prevNeighbor = sorted[idx - 1];
      const nextNeighbor = sorted[idx + 1];
      const targetStart = prevNeighbor ? prevNeighbor.end : 0;
      const targetEnd = nextNeighbor ? nextNeighbor.start : maxEnd;
      return sorted.map(s => s.id === selectedSegmentId ? { ...s, start: targetStart, end: targetEnd } : s);
    });
    requestAnimationFrame(() => drawFrameRef.current());
  };

  const handleFitBgRight = () => {
    if (!selectedSegmentId) return;
    const maxEnd = duration || mediaDuration || effectiveDuration;
    if (!maxEnd) return;
    setBgSegments(prev => {
        
        const sorted = [...prev].sort((a, b) => a.start - b.start);
      const idx = sorted.findIndex(s => s.id === selectedSegmentId);
      if (idx === -1) return prev;
      const nextNeighbor = sorted[idx + 1];
      const targetEnd = nextNeighbor ? nextNeighbor.start : maxEnd;
      return sorted.map(s => s.id === selectedSegmentId ? { ...s, end: targetEnd } : s);
    });
    requestAnimationFrame(() => drawFrameRef.current());
  };
  const bgClipboardRef = useRef<any>(null);
  const [hasCopiedBg, setHasCopiedBg] = useState(false);
  const [pendingNewBgSlot, setPendingNewBgSlot] = useState<{ start: number; duration: number } | null>(null);
  const [showBgSelectModal, setShowBgSelectModal] = useState(false);
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);
  const upgradeTimerRef = useRef<NodeJS.Timeout | number | null>(null);

  const triggerUpgradeNotice = (msg: string) => {
    if (upgradeTimerRef.current) clearTimeout(upgradeTimerRef.current as any);
    setUpgradeNotice(msg);
    upgradeTimerRef.current = setTimeout(() => {
      setUpgradeNotice(null);
      upgradeTimerRef.current = null;
    }, 3800);
  };
  const [dontShowBgSelectModalAgain, setDontShowBgSelectModalAgain] = useState(() => {
    try { return localStorage.getItem("dont_show_bg_select_modal") === "true"; } catch { return false; }
  });
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
  const [isSnappingEnabled, setIsSnappingEnabled] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(false);
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
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;
  const [duration, setDuration] = useState(0);
  const totalPlaybackDuration = (duration || mediaDuration || 0);
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
  const [localSongUrl, setLocalSongUrl] = useState<string | null>(initialSongUrl || null);
  
  

  

  const [audioPeaks, setAudioPeaks] = useState<number[]>([]);
  const [musicPeaks, setMusicPeaks] = useState<number[]>([]);

  useEffect(() => {
    const src = audioBlob || videoFile;
    if (src) {
      extractWaveformPeaks(src, 24).then((peaks: number[]) => {
        if (peaks && peaks.length > 0) setAudioPeaks(peaks);
      });
    } else {
      setAudioPeaks([]);
    }
  }, [videoFile, audioBlob]);

  useEffect(() => {
    if (localSongUrl) {
      extractWaveformPeaks(localSongUrl, 24).then((peaks: number[]) => {
        if (peaks && peaks.length > 0) setMusicPeaks(peaks);
      });
    } else {
      setMusicPeaks([]);
    }
  }, [localSongUrl]);
  const [localSongName, setLocalSongName] = useState<string | null>(initialSongName || null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  useEffect(() => {
    if (initialSongUrl) {
      setLocalSongUrl(initialSongUrl);
      setLocalSongName(initialSongName || "Custom song track");
    }
  }, [initialSongUrl, initialSongName]);
  

  const seekToTime = useCallback((targetTime: number) => {
    const clamped = Math.max(0, Math.min(effectiveDuration, targetTime));
    setCurrentTime(clamped);
    currentTimeRef.current = clamped;
    requestAnimationFrame(() => drawFrameRef.current());

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
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

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

    const evalTime = currentTimeRef.current;
    const currentSegments = bgSegmentsRef.current;
    const activeBgSeg = currentSegments.find(s => evalTime >= s.start && evalTime < s.end);

    if (activeBgSeg) {
      drawBackgroundToCanvas(ctx, {
        themeId: activeBgSeg.themeId || "midnight",
        backgroundColor: activeBgSeg.color || "#000000",
        width: canvas.width,
        height: canvas.height,
        videoElement: media,
        isVideoMedia,
        customImage: (activeBgSeg.themeId === "custom-image" && activeBgSeg.customImageUrl) ? (() => {
          if (customImageRef.current && customImageRef.current.src === activeBgSeg.customImageUrl) return customImageRef.current;
          const img = new Image();
          img.src = activeBgSeg.customImageUrl;
          customImageRef.current = img;
          return img;
        })() : customImageRef.current,
        customVideoElement: customVideoRef.current,
        overlayOpacity: settings.backgroundOverlayOpacity,
        fitMode: settings.fitMode,
      });
    } else {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Platform overlay handled directly by high-fidelity UI overlay element

    if (!areCaptionsHidden) {
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
    }

    // setCurrentTime driven by master clock loop
    if (isExporting && duration > 0) {
      setExportProgress(Math.min(100, (media.currentTime / duration) * 100));
    }

    // requestAnimationFrame handled by masterClockLoop
  }, [duration, isExporting, isVideoMedia, language, selectedSubtitleId, settings, subtitles, bgSegments, areCaptionsHidden]);

  useEffect(() => {
    if (!isPlaying) return;

    let rafId: number;

    const masterClockLoop = () => {
      if (!isPlayingRef.current) return;

      const media = mediaRef.current;
      const song = songMediaRef.current;

      // Master source of truth: audio/video hardware clock
      let t = currentTimeRef.current;
      if (media && !media.paused && Number.isFinite(media.currentTime)) {
        t = media.currentTime;
      } else if (song && !song.paused && Number.isFinite(song.currentTime)) {
        t = song.currentTime;
      }

      currentTimeRef.current = t;

      const audioLimit = (duration || mediaDuration || effectiveDuration);
      if (t >= audioLimit) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        if (media) { media.pause(); media.currentTime = audioLimit; }
        if (song) { song.pause(); }
        setCurrentTime(audioLimit);
        currentTimeRef.current = audioLimit;
        return;
      }

      // Sync background song if present
      if (song && localSongUrl && !song.paused) {
        if (Math.abs(song.currentTime - t) > 0.15) {
          song.currentTime = t;
        }
      }

      // Smooth layer scrolling under fixed 25% playhead needle
      const scroller = timelineViewportRef.current;
      if (scroller && totalTimelineDuration > 0) {
        const scrollableWidth = scroller.scrollWidth - scroller.clientWidth;
        if (scrollableWidth > 0) {
          const audioLimit = (duration || mediaDuration || effectiveDuration || 0);
        if (t <= audioLimit) {
          scroller.scrollLeft = (t / totalTimelineDuration) * scrollableWidth;
        }
        }
      }

      // Render video canvas frame
      drawFrameRef.current();

      // Update React state for UI (captions highlight, needle position)
      setCurrentTime(t);

      if (isPlayingRef.current) {
        rafId = requestAnimationFrame(masterClockLoop);
      }
    };

    rafId = requestAnimationFrame(masterClockLoop);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isPlaying, effectiveDuration, totalTimelineDuration, localSongUrl]);

  useEffect(() => {
    const container = timelineContainerRef.current || timelineViewportRef.current;
    const scroller = timelineViewportRef.current;
    if (!container || !scroller) return;

    const onWheel = (e: WheelEvent) => {
      if (isPlayingRef.current) {
        pausePlayback();
      }
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
          const targetScroll = scroller.scrollLeft + delta;
          scroller.scrollLeft = Math.max(0, targetScroll);
        }
      }
    };

        container.addEventListener("wheel", onWheel, { passive: false });
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2 && isPlayingRef.current) {
        pausePlayback();
      }
    };
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
    };
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
      selectedLayer,
      selectedSegmentId,
      hasCopiedBg,
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
      copyActiveLayer: handleCopyActiveLayer,
      pasteActiveLayer: handlePasteActiveLayer,
    });
  }, [isPlaying, currentTime, effectiveDuration, volume, songVolume, localSongUrl, selectedLayer, selectedSegmentId, hasCopiedBg, onPlaybackStateChange, seekToTime, drawFrame]);




  
  



  
  



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
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    const media = mediaRef.current;
    if (media) {
      media.pause();
      const exact = media.currentTime;
      setCurrentTime(exact);
      currentTimeRef.current = exact;
    }
    const song = songMediaRef.current;
    if (song) {
      song.pause();
    }
    drawFrameRef.current();
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
    if (!planConfig.canDownloadSubtitles) {
      triggerUpgradeNotice("SRT subtitle export is locked on " + planConfig.name + ". Upgrade to unlock.");
      return;
    }
    downloadStringAsFile(exportToSRT(subtitles, language), "captions.srt");
  };

  const handleExportVtt = () => {
    if (!planConfig.canDownloadSubtitles) {
      triggerUpgradeNotice("VTT subtitle export is locked on " + planConfig.name + ". Upgrade to unlock.");
      return;
    }
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

  const handleExportVideo = async () => {
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

    // Ensure custom image is completely decoded before starting recorder
    if (settings.backgroundTheme === "custom-image" && settings.customImageDataUrl) {
      if (!customImageRef.current || !customImageRef.current.complete || customImageRef.current.naturalWidth === 0) {
        try {
          const img = new Image();
          img.src = settings.customImageDataUrl;
          await img.decode();
          customImageRef.current = img;
        } catch (e) {
          console.warn("Could not pre-decode custom image backdrop:", e);
        }
      }
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
      // Paint opaque black base so transparent pixels never become white
      ctx.fillStyle = settings.backgroundColor || "#000000";
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);

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

// Auto-scroll unified into masterClockLoop

  
  // @ts-ignore
  const handleSplitActiveLayer = () => {
    if (selectedLayer === "background") {
      const maxCuts = planConfig?.maxBgCuts ?? 12;
      if (bgSegments.length >= maxCuts) {
        triggerUpgradeNotice("Reached " + planConfig.name + " limit of " + maxCuts + " background cuts. Upgrade to unlock more.");
        return;
      }
      const curTime = currentTime;
      const maxBound = effectiveDuration || 7;
      setBgSegments(prev => {
        if (prev.length >= maxCuts) return prev;
        const seg = (selectedSegmentId ? prev.find(s => s.id === selectedSegmentId) : null)
          || prev.find(s => curTime > s.start && curTime < (s.end || maxBound));
        if (!seg) return prev;
        const actualEnd = seg.end || maxBound;
        if (curTime <= seg.start + 0.05 || curTime >= actualEnd - 0.05) return prev;

        const newSeg1 = { ...seg, end: curTime };
        const newSeg2 = { ...seg, id: "bg-" + Date.now(), start: curTime, end: actualEnd };
        setSelectedSegmentId(newSeg2.id);
        const nextList = prev.map(s => s.id === seg.id ? newSeg1 : s).concat(newSeg2).sort((a, b) => a.start - b.start);
        requestAnimationFrame(() => drawFrameRef.current());
        return nextList;
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

  const handleCopyActiveLayer = () => {
    if (selectedLayer === "background") {
      const seg = bgSegments.find(s => s.id === selectedSegmentId);
      if (seg) {
        bgClipboardRef.current = { ...seg };
        setHasCopiedBg(true);
      }
    } else if (selectedLayer === "music") {
      const seg = songSegments.find(s => s.id === selectedSegmentId);
      if (seg) {
        bgClipboardRef.current = { ...seg, isMusic: true };
        setHasCopiedBg(true);
      }
    }
  };

  const handlePasteActiveLayer = () => {
    if (selectedLayer === "background") {
      const maxCuts = planConfig?.maxBgCuts ?? 12;
      if (bgSegments.length >= maxCuts) {
        triggerUpgradeNotice("Reached " + planConfig.name + " limit of " + maxCuts + " background cuts. Upgrade to unlock more.");
        return;
      }
    }
    if (selectedLayer === "background" && bgClipboardRef.current && !bgClipboardRef.current.isMusic) {
      const source = bgClipboardRef.current;
      const cur = currentTimeRef.current;
      const segDuration = Math.max(0.5, (source.end || effectiveDuration) - source.start);
      const newEnd = Math.min(cur + segDuration, effectiveDuration);

      const newSeg = {
        ...source,
        id: "bg-" + Date.now(),
        start: cur,
        end: newEnd,
      };

      setBgSegments(prev => [...prev, newSeg].sort((a, b) => a.start - b.start));
      setSelectedSegmentId(newSeg.id);
      bgClipboardRef.current = null;
      setHasCopiedBg(false);
      requestAnimationFrame(() => drawFrameRef.current());
    } else if (selectedLayer === "music" && bgClipboardRef.current?.isMusic) {
      const source = bgClipboardRef.current;
      const cur = currentTimeRef.current;
      const maxEnd = songDuration || effectiveDuration;
      const segDuration = Math.max(0.5, (source.end || maxEnd) - source.start);
      const newEnd = Math.min(cur + segDuration, maxEnd);

      const newSeg = {
        ...source,
        id: "song-" + Date.now(),
        start: cur,
        end: newEnd,
      };

      setSongSegments(prev => [...prev, newSeg].sort((a, b) => a.start - b.start));
      setSelectedSegmentId(newSeg.id);
      bgClipboardRef.current = null;
      setHasCopiedBg(false);
    }
  };

  const handleDeleteActiveLayer = () => {
    if (selectedLayer === "background") {
      setBgSegments(prev => prev.filter(s => s.id !== selectedSegmentId));
      setSelectedSegmentId(null);
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
                      onSongChange?.({ songUrl: null, songName: null, songBlob: null });
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

  const segmentDragRef = useRef<{
    layer: "background" | "music";
    id: string;
    mode: "move" | "start" | "end";
    pointerId: number;
    startX: number;
    originalStart: number;
    originalEnd: number;
    trackWidth: number;
  } | null>(null);

  const beginSegmentDrag = (
    event: React.PointerEvent<HTMLElement>,
    layer: "background" | "music",
    id: string,
    mode: "move" | "start" | "end",
    start: number,
    end: number
  ) => {
    event.stopPropagation();
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const trackLane = (event.currentTarget as HTMLElement).closest(".track-lane");
    const trackWidth = trackLane ? trackLane.getBoundingClientRect().width : 1;
    segmentDragRef.current = {
      layer,
      id,
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      originalStart: start,
      originalEnd: end,
      trackWidth,
    };
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch (_) {}
  };

  const handleSegmentPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = segmentDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaPixels = event.clientX - drag.startX;
    const deltaSeconds = (deltaPixels / drag.trackWidth) * totalTimelineDuration;
    const limit = (duration || mediaDuration || effectiveDuration || 10);
    const minDur = 0.5;

    if (drag.layer === "background") {
      setBgSegments(prev => {
        
        const sorted = [...prev].sort((a, b) => a.start - b.start);
        const idx = sorted.findIndex(s => s.id === drag.id);
        if (idx === -1) return prev;

        const seg = sorted[idx];
        const prevNeighbor = sorted[idx - 1];
        const nextNeighbor = sorted[idx + 1];

        const minBound = prevNeighbor ? prevNeighbor.end : 0;
        const maxBound = nextNeighbor ? nextNeighbor.start : limit;
        const dur = drag.originalEnd - drag.originalStart;

        if (drag.mode === "move") {
          const clampedStart = Math.max(minBound, Math.min(maxBound - dur, drag.originalStart + deltaSeconds));
          const updated = { ...seg, start: clampedStart, end: clampedStart + dur };
          return sorted.map(s => s.id === drag.id ? updated : s);
        } else if (drag.mode === "start") {
          const clampedStart = Math.max(minBound, Math.min(seg.end - minDur, drag.originalStart + deltaSeconds));
          const updated = { ...seg, start: clampedStart };
          return sorted.map(s => s.id === drag.id ? updated : s);
        } else {
          const clampedEnd = Math.max(seg.start + minDur, Math.min(maxBound, drag.originalEnd + deltaSeconds));
          const updated = { ...seg, end: clampedEnd };
          return sorted.map(s => s.id === drag.id ? updated : s);
        }
      });
    } else if (drag.layer === "music") {
      setSongSegments(prev => {
        const sorted = [...prev].sort((a, b) => a.start - b.start);
        const idx = sorted.findIndex(s => s.id === drag.id);
        if (idx === -1) return prev;

        const seg = sorted[idx];
        const prevNeighbor = sorted[idx - 1];
        const nextNeighbor = sorted[idx + 1];

        const minBound = prevNeighbor ? prevNeighbor.end : 0;
        const maxBound = nextNeighbor ? nextNeighbor.start : limit;
        const dur = drag.originalEnd - drag.originalStart;

        if (drag.mode === "move") {
          const clampedStart = Math.max(minBound, Math.min(maxBound - dur, drag.originalStart + deltaSeconds));
          const updated = { ...seg, start: clampedStart, end: clampedStart + dur };
          return sorted.map(s => s.id === drag.id ? updated : s);
        } else if (drag.mode === "start") {
          const clampedStart = Math.max(minBound, Math.min(seg.end - minDur, drag.originalStart + deltaSeconds));
          const updated = { ...seg, start: clampedStart };
          return sorted.map(s => s.id === drag.id ? updated : s);
        } else {
          const clampedEnd = Math.max(seg.start + minDur, Math.min(maxBound, drag.originalEnd + deltaSeconds));
          const updated = { ...seg, end: clampedEnd };
          return sorted.map(s => s.id === drag.id ? updated : s);
        }
      });
    }
  };

  const endSegmentDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = segmentDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    segmentDragRef.current = null;
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

  const ensureSegmentSelected = (): boolean => {
    // Only allow modification if "+" was clicked or a segment is actively, explicitly selected
    if (pendingNewBgSlot) {
      return true;
    }
    if (selectedSegmentId && bgSegments.some(s => s.id === selectedSegmentId)) {
      return true;
    }
    // Brand new empty project with 0 segments
    if (bgSegments.length === 0) {
      return true;
    }

    if (!dontShowBgSelectModalAgain) {
      setShowBgSelectModal(true);
    }
    return false;
  };

  const handleSelectBackgroundWithConfirm = (applyAction: () => void, newThemeId?: string, newColor?: string) => {
    if (!ensureSegmentSelected()) {
      return;
    }

    applyAction();

    const targetTheme = newThemeId || "midnight";
    const targetColor = newColor || "#000000";

    setBgSegments(prev => {
      // Rule 1: "+" was explicitly clicked
      if (pendingNewBgSlot) {
        const maxCuts = planConfig?.maxBgCuts ?? 12;
        if (prev.length >= maxCuts) {
          triggerUpgradeNotice("Reached " + planConfig.name + " limit of " + maxCuts + " background cuts. Upgrade to unlock more.");
          setPendingNewBgSlot(null);
          return prev;
        }
        const newSeg = {
          id: "bg-" + Date.now(),
          start: pendingNewBgSlot.start,
          end: pendingNewBgSlot.start + pendingNewBgSlot.duration,
          themeId: targetTheme,
          color: targetColor,
        };
        setSelectedSegmentId(newSeg.id);
        setPendingNewBgSlot(null);
        return [...prev, newSeg].sort((a, b) => a.start - b.start);
      }

      // Rule 2: Fresh project with 0 segments
      if (prev.length === 0) {
        const initialDuration = Math.min(4, effectiveDuration || 4);
        const newSeg = {
          id: "bg-" + Date.now(),
          start: 0,
          end: initialDuration,
          themeId: targetTheme,
          color: targetColor,
        };
        setSelectedSegmentId(newSeg.id);
        return [newSeg];
      }

      // Rule 3: Only update the explicitly selected segment
      if (selectedSegmentId) {
        return prev.map(s => s.id === selectedSegmentId ? {
          ...s,
          themeId: targetTheme,
          color: targetColor,
          customImageUrl: undefined,
          customVideoUrl: undefined
        } : s);
      }

      return prev;
    });

    setSelectedLayer("background");
    onPlaybackStateChange?.({ selectedLayer: "background" });
    requestAnimationFrame(() => drawFrameRef.current());
  };

  const applyCustomMediaToSegments = (themeId: "custom-image" | "custom-video", mediaUrl: string) => {
    if (!ensureSegmentSelected()) {
      return;
    }

    setBgSegments(prev => {
        
        const targetTheme = themeId;

      if (pendingNewBgSlot) {
        const maxCuts = planConfig?.maxBgCuts ?? 12;
        if (prev.length >= maxCuts) {
          triggerUpgradeNotice("Reached " + planConfig.name + " limit of " + maxCuts + " background cuts. Upgrade to unlock more.");
          setPendingNewBgSlot(null);
          return prev;
        }
        const newSeg = {
          id: "bg-" + Date.now(),
          start: pendingNewBgSlot.start,
          end: pendingNewBgSlot.start + pendingNewBgSlot.duration,
          themeId: targetTheme,
          customImageUrl: themeId === "custom-image" ? mediaUrl : undefined,
          customVideoUrl: themeId === "custom-video" ? mediaUrl : undefined,
        };
        setSelectedSegmentId(newSeg.id);
        setPendingNewBgSlot(null);
        return [...prev, newSeg].sort((a, b) => a.start - b.start);
      }

      if (prev.length === 0) {
        const initialDuration = Math.min(4, effectiveDuration || 4);
        const newSeg = {
          id: "bg-" + Date.now(),
          start: 0,
          end: initialDuration,
          themeId: targetTheme,
          customImageUrl: themeId === "custom-image" ? mediaUrl : undefined,
          customVideoUrl: themeId === "custom-video" ? mediaUrl : undefined,
        };
        setSelectedSegmentId(newSeg.id);
        return [newSeg];
      }

      if (selectedSegmentId) {
        return prev.map(s => s.id === selectedSegmentId ? {
          ...s,
          themeId: targetTheme,
          customImageUrl: themeId === "custom-image" ? mediaUrl : undefined,
          customVideoUrl: themeId === "custom-video" ? mediaUrl : undefined,
        } : s);
      }

      return prev;
    });

    setSelectedLayer("background");
    onPlaybackStateChange?.({ selectedLayer: "background" });
    requestAnimationFrame(() => drawFrameRef.current());
  };

  const handleMediaUpload = (file: File) => {
    if (!ensureSegmentSelected()) {
      return;
    }
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
      applyCustomMediaToSegments("custom-video", url);
    } else if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const url = reader.result as string;
          setSettings(prev => ({
            ...prev,
            backgroundTheme: "custom-image",
            customImageDataUrl: url,
            customVideoUrl: undefined,
          }));
          applyCustomMediaToSegments("custom-image", url);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="preview-layout">
      {/* CENTER PANEL */}
      <main className="preview-workspace">
        {upgradeNotice && (
          <div
            className="upgrade-notice-toast"
            style={{
              position: "absolute",
              top: "56px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 99999,
              background: "#1e1b4b",
              border: "1px solid #6366f1",
              color: "#e0e7ff",
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              animation: "fadeIn 0.2s ease"
            }}
          >
            <span>🔒 {upgradeNotice}</span>
            <button
              type="button"
              onClick={() => setUpgradeNotice(null)}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "2px", marginLeft: "6px" }}
            >
              ✕
            </button>
          </div>
        )}
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
            background: "#12141a",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            gap: "14px",
            overflow: "hidden",
            userSelect: "none",
            flexWrap: "nowrap"
          }}
        >
          {/* 1. LEFT ZONE */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
            {duration > 0 && (
              <span
                className="duration-pill"
                title="File duration"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "30px",
                  padding: "0 10px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d1d5db",
                  fontSize: "11px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  boxSizing: "border-box"
                }}
              >
                {formatDuration(duration)}
              </span>
            )}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "30px",
                gap: "6px",
                minWidth: 0,
                flex: "0 1 300px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                padding: "0 8px",
                boxSizing: "border-box"
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
                  whiteSpace: "nowrap",
                  padding: 0
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
                  color: "#94a3b8",
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

          {/* 2. CENTER ZONE */}
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
                justifyContent: "center",
                height: "30px",
                gap: "5px",
                padding: "0 10px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: isZoom100 ? "var(--accent-glow, var(--accent-soft))" : "rgba(255, 255, 255, 0.04)",
                color: isZoom100 ? "#93c5fd" : "#d1d5db",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxSizing: "border-box"
              }}
            >
              {isZoom100 ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span>{isZoom100 ? "Fit view" : "100%"}</span>
            </button>
          </div>

          {/* 3. RIGHT ZONE */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "30px",
                gap: "6px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                padding: "0 8px",
                boxSizing: "border-box"
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
                justifyContent: "center",
                height: "30px",
                gap: "6px",
                padding: "0 14px",
                borderRadius: "6px",
                background: (!duration || isExporting) ? "rgba(238, 99, 70, 0.25)" : "#ee6346",
                color: "#ffffff",
                border: "none",
                fontSize: "11px",
                fontWeight: 700,
                cursor: !duration || isExporting ? "not-allowed" : "pointer",
                opacity: !duration || isExporting ? 0.5 : 1,
                boxShadow: (!duration || isExporting) ? "none" : "0 2px 10px rgba(238, 99, 70, 0.35)",
                whiteSpace: "nowrap",
                boxSizing: "border-box",
                transition: "background 0.15s ease, transform 0.1s ease"
              }}
              onMouseEnter={e => {
                if (duration && !isExporting) e.currentTarget.style.background = "#f07358";
              }}
              onMouseLeave={e => {
                if (duration && !isExporting) e.currentTarget.style.background = "#ee6346";
              }}
            >
              <Share2 size={12} strokeWidth={2.5} />
              <span>Export</span>
            </button>
          </div>
        </header>

        <div className="preview-stage" style={{ background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }} ref={canvasAreaRef} tabIndex={0} onKeyDown={handleCanvasKeyDown}>
          <div className={"canvas-frame ratio-" + settings.aspectRatio.replace(":", "-") + (isZoom100 ? " canvas-actual-size" : "")}>
            <canvas
              ref={canvasRef}
              width={dims.width}
              height={dims.height}
              onClick={handleCanvasClick}
              onDoubleClick={handleCanvasDoubleClick}
              aria-label="Caption preview. Click a visible caption to edit it."
              className={editingSubtitleId ? "editing" : ""}
              style={{ width: "100%", height: "100%", imageRendering: "-webkit-optimize-contrast", transform: "translateZ(0)", backfaceVisibility: "hidden", display: "block" }}
            />
          {settings.safeZones?.show && planConfig.canUseSafeZones && (() => {
            const isLandscape = settings.aspectRatio === "16:9";
            const platform = settings.safeZones.platform;

            // Only show 16:9 overlay when video is 16:9
            if (isLandscape) {
              if (platform !== "youtube-long" && platform !== "tiktok") return null;
              return (
                <div
                  className="platform-safezone-overlay-layer"
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 15,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  
                    transform: "translateZ(0)",
                    imageRendering: "-webkit-optimize-contrast",
                  }}
                >
                  <img
                    src="/overlays/youtube_long.svg"
                    alt="YouTube 16:9 safe zone"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "fill",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  />
                </div>
              );
            }

            // Only show 9:16 vertical overlays (Reels / YT Shorts) when ratio is 9:16
            if (settings.aspectRatio === "9:16") {
              const src = (platform === "youtube-shorts" || platform === "youtube")
                ? "/overlays/youtube_shorts.png"
                : "/overlays/instagram_reels.png";

              return (
                <div
                  className="platform-safezone-overlay-layer"
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 15,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={src}
                    alt="Platform safe zone"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "fill",
                      mixBlendMode: "screen",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                    onError={(e) => {
                      const t = e.currentTarget;
                      if (t.src.endsWith(".png")) t.src = t.src.replace(".png", ".jpg");
                    }}
                  />
                </div>
              );
            }

            return null;
          })()}
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

        {/* BOTTOM TIMELINE PANEL */}
        <section
          className="player-panel" style={{ background: "#12141a", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}
          onClick={e => {
            const target = e.target as HTMLElement;
            if (!target.closest(".track-lane-clip") && !target.closest(".caption-segment-pill") && !target.closest(".track-name-tag") && !target.closest(".track-add-song-slot")) {
              setSelectedLayer(null);
              selectSubtitle(null);
              setSelectedSegmentId(null);
            }
          }}
        >
          <div className="timeline-editor" aria-label="Timeline" ref={timelineContainerRef} style={{ display: "flex", width: "100%", overflow: "hidden", position: "relative", alignItems: "flex-end" }}>
            {/* FIXED LEFT LABELS */}
            <div
              className="timeline-fixed-headers"
              style={{
                width: "180px",
                minWidth: "180px",
                flexShrink: 0,
                zIndex: 30,
                background: "#12141a",
                borderRight: "1px solid rgba(255, 255, 255, 0.08)",
                borderTop: "1.5px solid rgba(148, 163, 184, 0.35)",
                display: "flex",
                flexDirection: "column",
                userSelect: "none",
                padding: "0",
                margin: "0",
                boxSizing: "border-box"
              }}>
              {/* TOP HEADER CONTROLS (Fills the empty space above AUDIO) */}
              <div
                style={{
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 8px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  background: "rgba(255, 255, 255, 0.02)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    type="button"
                    title={isSnappingEnabled ? "Magnetic Snapping ON" : "Magnetic Snapping OFF"}
                    onClick={() => setIsSnappingEnabled(prev => !prev)}
                    style={{
                      background: isSnappingEnabled ? "rgba(238, 99, 70, 0.2)" : "transparent",
                      border: "none",
                      borderRadius: "4px",
                      color: isSnappingEnabled ? "#ee6346" : "#64748b",
                      cursor: "pointer",
                      padding: "3px 5px",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    <Magnet size={13} />
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <button
                    type="button"
                    title="Zoom Out"
                    onClick={() => setTimelineZoom(z => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      color: "#94a3b8",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: 700,
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0
                    }}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    title="Fit Timeline"
                    onClick={() => setTimelineZoom(1)}
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      color: "#cbd5e1",
                      cursor: "pointer",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 5px",
                      height: "20px"
                    }}
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    title="Zoom In"
                    onClick={() => setTimelineZoom(z => Math.min(5, Math.round((z + 0.25) * 100) / 100))}
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "4px",
                      color: "#94a3b8",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: 700,
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", padding: "0", margin: "0" }}>
                {/* 1. AUDIO ROW */}
                <div
                  className={"track-name-tag " + (selectedLayer === "audio" ? "is-selected" : "")}
                  style={{
                    height: "36px", minHeight: "36px", maxHeight: "36px",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 10px 0 14px",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    color: "#38bdf8",
                    background: selectedLayer === "audio" ? "rgba(56, 189, 248, 0.15)" : "transparent",
                    border: "1px solid transparent",
                    borderLeft: selectedLayer === "audio" ? "3px solid #38bdf8" : "3px solid transparent",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedLayer("audio");
                    selectSubtitle(null);
                  }}
                >
                  <span>AUDIO</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      title={isAudioMuted ? "Unmute Voiceover Audio" : "Mute Voiceover Audio"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAudioMuted(prev => {
                          const next = !prev;
                          if (mediaRef.current) mediaRef.current.muted = next;
                          return next;
                        });
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: isAudioMuted ? "#ef4444" : "#64748b",
                        cursor: "pointer",
                        padding: "2px",
                        display: "inline-flex",
                        alignItems: "center"
                      }}
                    >
                      {isAudioMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>
                    <button
                      type="button"
                      className="timeline-header-icon-btn"
                      title="Reset audio playhead"
                      onClick={handleResetPlayhead}
                      style={{ background: "transparent", border: "none", color: "#38bdf8", cursor: "pointer", padding: "2px", display: "inline-flex", alignItems: "center" }}
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </div>

                {/* 2. BACKGROUND ROW */}
                <div
                  className={"track-name-tag " + (selectedLayer === "background" ? "is-selected" : "")}
                  style={{
                    height: "36px", minHeight: "36px", maxHeight: "36px",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 10px 0 14px",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    color: "#c084fc",
                    background: selectedLayer === "background" ? "rgba(192, 132, 252, 0.15)" : "transparent",
                    border: "1px solid transparent",
                    borderLeft: selectedLayer === "background" ? "3px solid #c084fc" : "3px solid transparent",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedLayer("background");
                    selectSubtitle(null);
                  }}
                >
                  <span>BACKGROUND</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }} onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      className="timeline-header-icon-btn"
                      title="Align segment start to playhead"
                      onClick={handleFitBgLeft}
                      style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "3px", color: "#94a3b8", cursor: "pointer", padding: "2px 4px", fontSize: "10px" }}
                    >
                      |←
                    </button>
                    <button
                      type="button"
                      className="timeline-header-icon-btn"
                      title="Stretch segment to full duration"
                      onClick={handleFitBgFull}
                      style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "3px", color: "#94a3b8", cursor: "pointer", padding: "2px 4px", fontSize: "10px" }}
                    >
                      ↔
                    </button>
                    <button
                      type="button"
                      className="timeline-header-icon-btn"
                      title="Align segment end to playhead"
                      onClick={handleFitBgRight}
                      style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "3px", color: "#94a3b8", cursor: "pointer", padding: "2px 4px", fontSize: "10px" }}
                    >
                      →|
                    </button>
                  </div>
                </div>

                {/* 3. CAPTION ROW */}
                <div
                  className={"track-name-tag " + (selectedLayer === "caption" ? "is-selected" : "")}
                  style={{
                    height: "36px", minHeight: "36px", maxHeight: "36px",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 10px 0 14px",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    color: "#60a5fa",
                    background: selectedLayer === "caption" ? "rgba(96, 165, 250, 0.15)" : "transparent",
                    border: "1px solid transparent",
                    borderLeft: selectedLayer === "caption" ? "3px solid #60a5fa" : "3px solid transparent",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedLayer("caption");
                  }}
                >
                  <span>CAPTION</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }} onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      className="timeline-header-icon-btn"
                      title="Add caption at playhead"
                      onClick={handleAddCaptionAtPlayhead}
                      style={{ background: "transparent", border: "none", color: "#60a5fa", cursor: "pointer", padding: "2px", display: "inline-flex", alignItems: "center" }}
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      type="button"
                      className="timeline-header-icon-btn"
                      title={isCaptionLocked ? "Unlock captions track" : "Lock captions track"}
                      onClick={() => setIsCaptionLocked(prev => !prev)}
                      style={{ background: "transparent", border: "none", color: isCaptionLocked ? "#ee6346" : "#64748b", cursor: "pointer", padding: "2px", display: "inline-flex", alignItems: "center" }}
                    >
                      {isCaptionLocked ? <Lock size={13} /> : <Unlock size={13} />}
                    </button>
                    <button
                      type="button"
                      className="timeline-header-icon-btn"
                      title={areCaptionsHidden ? "Show captions on video" : "Hide captions on video"}
                      onClick={() => setAreCaptionsHidden(prev => !prev)}
                      style={{ background: "transparent", border: "none", color: areCaptionsHidden ? "#ef4444" : "#64748b", cursor: "pointer", padding: "2px", display: "inline-flex", alignItems: "center" }}
                    >
                      {areCaptionsHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                {/* 4. MUSIC ROW */}
                <div
                  className={"track-name-tag " + (selectedLayer === "music" ? "is-selected" : "")}
                  style={{
                    height: "36px", minHeight: "36px", maxHeight: "36px",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 10px 0 14px",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    color: "#34d399",
                    background: selectedLayer === "music" ? "rgba(52, 211, 153, 0.15)" : "transparent",
                    border: "1px solid transparent",
                    borderLeft: selectedLayer === "music" ? "3px solid #34d399" : "3px solid transparent",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedLayer("music");
                    selectSubtitle(null);
                  }}
                >
                  <span>MUSIC</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      title={isMusicMuted ? "Unmute Music" : "Mute Music"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMusicMuted(prev => {
                          const next = !prev;
                          if (songMediaRef.current) songMediaRef.current.muted = next;
                          return next;
                        });
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: isMusicMuted ? "#ef4444" : "#64748b",
                        cursor: "pointer",
                        padding: "2px",
                        display: "inline-flex",
                        alignItems: "center"
                      }}
                    >
                      {isMusicMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>

                    <label
                      className="timeline-header-icon-btn"
                      title={localSongUrl ? "Replace song file" : "Upload song file"}
                      style={{
                        cursor: "pointer",
                        position: "relative",
                        color: "#34d399",
                        margin: 0,
                        display: "inline-flex",
                        alignItems: "center"
                      }}
                    >
                      <Music size={13} />
                      <div style={{
                        position: "absolute",
                        right: "-2px",
                        bottom: "-2px",
                        background: "#12141a",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1px"
                      }}>
                        <ArrowUp size={8} strokeWidth={3} color="#34d399" />
                      </div>
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
                            onSongChange?.({ songUrl: url, songName: file.name, songBlob: file });
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      className="timeline-header-icon-btn"
                      disabled={!localSongUrl}
                      title={localSongUrl ? "Delete song from project" : "No song added to delete"}
                      onClick={e => {
                        e.stopPropagation();
                        if (!localSongUrl) return;
                        if (localSongUrl.startsWith("blob:")) URL.revokeObjectURL(localSongUrl);
                        setLocalSongUrl(null);
                        setLocalSongName(null);
                        setSongDuration(0);
                        setSongSegments([{ id: "song-default", start: 0, end: 0 }]);
                        onSongChange?.({ songUrl: null, songName: null, songBlob: null });
                        setSelectedSegmentId(null);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: localSongUrl ? "#f87171" : "#475569",
                        cursor: localSongUrl ? "pointer" : "default",
                        padding: "2px",
                        display: "inline-flex",
                        alignItems: "center"
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* HORIZONTALLY SCROLLABLE TRACK LANES */}
            <div style={{ flex: 1, minWidth: 0, position: "relative", overflow: "hidden", display: "flex" }}>
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
                    const audioLimit = (duration || mediaDuration || effectiveDuration || 0);
                    const rawTime = (scroller.scrollLeft / scrollableWidth) * totalTimelineDuration;
                    
                    if (audioLimit > 0 && rawTime > audioLimit) {
                      // Clamp scroller back to the exact audio end point so it cannot scroll past
                      const clampedScroll = (audioLimit / totalTimelineDuration) * scrollableWidth;
                      scroller.scrollLeft = clampedScroll;
                      setCurrentTime(audioLimit);
                      currentTimeRef.current = audioLimit;
                      if (mediaRef.current) mediaRef.current.currentTime = audioLimit;
                      if (songMediaRef.current && localSongUrl) songMediaRef.current.currentTime = audioLimit;
                    } else {
                      const newTime = Math.max(0, rawTime);
                      setCurrentTime(newTime);
                      currentTimeRef.current = newTime;
                      if (mediaRef.current && newTime <= (mediaRef.current.duration || 0)) {
                        mediaRef.current.currentTime = newTime;
                      }
                      if (songMediaRef.current && localSongUrl && newTime <= (songMediaRef.current.duration || 0)) {
                        songMediaRef.current.currentTime = newTime;
                      }
                    }
                    drawFrame();
                  }
                }}
              >
                <div
                  className="timeline-virtual-canvas"
                  style={{
                    width: Math.max(100, (totalTimelineDuration / 20) * 100 * timelineZoom) + "%",
                    position: "relative",
                    minWidth: "100%",
                    paddingLeft: "25%",
                    paddingRight: "75%",
                    boxSizing: "content-box"
                  }}
                >
                  <div
                    className="timeline-ruler"
                    aria-hidden="true"
                    onClick={handleTimelineClick}
                    style={{
                      height: "38px",
                      position: "relative",
                      borderTop: "1.5px solid rgba(148, 163, 184, 0.35)",
                      borderBottom: "none",
                      background: "transparent",
                      cursor: "pointer",
                      overflow: "visible"
                    }}
                  >
                    {(() => {
                      // Adaptive millisecond sub-step based on zoom level:
                      // Zoom >= 4  -> 50ms (0.05s)
                      // Zoom >= 2.5 -> 100ms (0.1s)
                      // Zoom >= 1.5 -> 200ms (0.2s)
                      // Base        -> 250ms (0.25s)
                      const subStep = timelineZoom >= 4
                        ? 0.05
                        : timelineZoom >= 2.5
                        ? 0.1
                        : timelineZoom >= 1.5
                        ? 0.2
                        : 0.25;

                      const ticks = [];
                      const count = Math.floor(totalTimelineDuration / subStep);

                      for (let i = 0; i <= count; i++) {
                        const t = Math.round(i * subStep * 1000) / 1000;
                        const isMajor = Math.abs(t % 1) < 0.001 || Math.abs((t % 1) - 1) < 0.001;
                        const isHalf = !isMajor && Math.abs((t % 0.5)) < 0.001;

                        ticks.push(
                          <div
                            key={t}
                            style={{
                              position: "absolute",
                              left: ((t / totalTimelineDuration) * 100) + "%",
                              top: "0px",
                              transform: "translateX(-50%)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              pointerEvents: "none",
                              zIndex: isMajor ? 5 : 2
                            }}
                          >
                            {/* VERTICAL TICK MARKS */}
                            <div
                              style={{
                                width: isMajor ? "1.5px" : "1px",
                                height: isMajor ? "14px" : isHalf ? "9px" : "6px",
                                backgroundColor: isMajor
                                  ? "#64748b"
                                  : isHalf
                                  ? "#475569"
                                  : "#334155",
                                margin: 0,
                                padding: 0
                              }}
                            />
                            {/* TIMESTAMP DIRECTLY BELOW THE 14PX TICK */}
                            {isMajor && (
                              <div
                                style={{
                                  marginTop: "2px",
                                  fontSize: "10px",
                                  fontWeight: 500,
                                  color: "#64748b",
                                  whiteSpace: "nowrap",
                                  userSelect: "none",
                                  lineHeight: 1,
                                  letterSpacing: "0.03em",
                                  textAlign: "center"
                                }}
                              >
                                {formatRulerTime(t)}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return ticks;
                    })()}
                  </div>

                  <div className={"timeline-tracks-stack " + (selectedLayer ? "has-layer-selected" : "all-layers-active")} style={{ width: "100%", minWidth: "100%", display: "flex", flexDirection: "column", gap: "6px", paddingTop: "0px", paddingBottom: "0px" }}>
                    {/* TRACK 1: AUDIO */}
                    <div
                      className={"timeline-unified-row row-audio " + (selectedLayer === "audio" ? "is-selected" : selectedLayer ? "is-dimmed" : "is-active")}
                      style={{ height: "34px", display: "block", background: "#181b24", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "4px", overflow: "hidden" }}
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
                            background: "linear-gradient(90deg, rgba(14, 116, 144, 0.4), rgba(30, 64, 175, 0.4))",
                            border: "1px solid #0284c7",
                            width: Math.min(100, (((duration || mediaDuration || 0)) / totalTimelineDuration) * 100) + "%",
                            height: "100%",
                            position: "relative",
                            overflow: "hidden",
                            borderRadius: "4px"
                          }}
                        >
                          
<div
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              gap: "1.5px",
                              padding: "0 6px",
                              pointerEvents: "none",
                              overflow: "hidden",
                              opacity: 0.75
                            }}
                          >
                            {audioPeaks.length > 0 ? (
                              audioPeaks.map((peak, idx) => {
                                const barH = Math.max(3, peak * 26);
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      flex: "1 1 2px",
                                      minWidth: "1.5px",
                                      maxWidth: "3.5px",
                                      height: barH + "px",
                                      background: "#38bdf8",
                                      borderRadius: "1px",
                                      transition: "height 0.1s ease"
                                    }}
                                  />
                                );
                              })
                            ) : (
                              <div style={{ width: "100%", height: "2px", background: "rgba(56, 189, 248, 0.3)" }} />
                            )}
                          </div>

                          <span className="clip-label-text" style={{ position: "relative", zIndex: 2, paddingLeft: "10px", fontWeight: 600 }}>
                            {videoFile?.name || "Uploaded audio track"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* TRACK 2: BACKGROUND */}
                    <div
                      className={"timeline-unified-row row-bg " + (selectedLayer === "background" ? "is-selected" : selectedLayer ? "is-dimmed" : "is-active")}
                      style={{ height: "34px", display: "block", background: "#181b24", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "4px", position: "relative" }}
                      onClick={e => {
                    e.stopPropagation();
                    setSelectedLayer("background");
                    selectSubtitle(null);
                    // Do NOT auto-select any segment here! Wait for user click on a specific clip
                    setSelectedSegmentId(null);
                    onPlaybackStateChange?.({ selectedLayer: "background" });
                  }}
                    >
                      <div className="track-lane" onClick={handleTimelineClick} style={{ height: "100%", width: "100%", position: "relative" }}>
                        {bgSegments.length === 0 ? (
                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              top: 0,
                              bottom: 0,
                              display: "flex",
                              alignItems: "center",
                              paddingLeft: "14px",
                              cursor: "pointer",
                              zIndex: 10,
                              fontSize: "11px",
                              color: "var(--accent-primary, #60a5fa)",
                              fontWeight: 600,
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedLayer("background");
                              setActiveCatalogTab("backgrounds");
                              onPlaybackStateChange?.({ selectedLayer: "background" });
                            }}
                          >
                            + Select background for timeline
                          </div>
                        ) : (
                          <>
                            {bgSegments.map((seg, idx) => {
                              const start = seg.start;
                              const end = seg.end || effectiveDuration;
                              const leftPct = (start / totalTimelineDuration) * 100;
                              const widthPct = Math.max(0.5, ((end - start) / totalTimelineDuration) * 100);
                              const isSegSelected = selectedSegmentId === seg.id && selectedLayer === "background";
                              return (
                                <div
                                  key={seg.id}
                                  className={"track-lane-clip clip-bg-fill " + (isSegSelected ? "is-segment-active" : "is-segment-dimmed")}
                                  style={{
                                    background: isSegSelected ? "var(--accent-soft, #312e81)" : "#1e222d",
                                    border: isSegSelected ? "2px solid var(--accent-primary, #60a5fa)" : "1px solid rgba(255, 255, 255, 0.12)",
                                    boxShadow: isSegSelected ? "0 0 10px rgba(96, 165, 250, 0.45)" : "none",
                                    filter: (selectedSegmentId && !isSegSelected) ? "grayscale(85%) opacity(0.35)" : "none",
                                    transition: segmentDragRef.current ? "none" : "border 0.15s ease, box-shadow 0.15s ease",
                                    left: leftPct + "%",
                                    width: widthPct + "%",
                                    height: "100%",
                                    position: "absolute",
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "grab",
                                    userSelect: "none",
                                  }}
                                  onPointerDown={e => beginSegmentDrag(e, "background", seg.id, "move", start, end)}
                                  onPointerMove={handleSegmentPointerMove}
                                  onPointerUp={endSegmentDrag}
                                  onClick={ev => {
                                    ev.stopPropagation();
                                    setSelectedLayer("background");
                                    setSelectedSegmentId(seg.id);
                                    selectSubtitle(null);
                                    onPlaybackStateChange?.({ selectedLayer: "background" });
                                    seekToTime(seg.start + 0.05);
                                  }}
                                >
                                  <button
                                      type="button"
                                      className="caption-trim-handle start"
                                      title="Drag to trim segment start"
                                      style={{
                                        width: "12px",
                                        height: "100%",
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        cursor: "col-resize",
                                        background: isSegSelected ? "#3b82f6" : "rgba(255, 255, 255, 0.35)",
                                        border: "none",
                                        borderTopLeftRadius: "4px",
                                        borderBottomLeftRadius: "4px",
                                        zIndex: 30,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        opacity: isSegSelected ? 1 : 0.6,
                                        pointerEvents: "auto",
                                        padding: 0,
                                      }}
                                      onPointerDown={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        beginSegmentDrag(e, "background", seg.id, "start", start, end);
                                      }}
                                    >
                                      <div style={{ width: "2px", height: "14px", background: "#ffffff", borderRadius: "1px", pointerEvents: "none" }} />
                                    </button>
                                  <span className="clip-label-text" style={{ padding: "0 12px", fontSize: "11px", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {seg.themeId === "custom-image" ? "Photo backdrop" : seg.themeId === "custom-video" ? "Video backdrop" : (seg.themeId ? "Theme: " + seg.themeId.toUpperCase() : "MIDNIGHT")}
                                    {bgSegments.length > 1 ? " (" + (idx + 1) + ")" : ""}
                                  </span>
                                  <button
                                      type="button"
                                      className="caption-trim-handle end"
                                      title="Drag to trim segment end"
                                      style={{
                                        width: "12px",
                                        height: "100%",
                                        position: "absolute",
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                        cursor: "col-resize",
                                        background: isSegSelected ? "#3b82f6" : "rgba(255, 255, 255, 0.35)",
                                        border: "none",
                                        borderTopRightRadius: "4px",
                                        borderBottomRightRadius: "4px",
                                        zIndex: 30,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        opacity: isSegSelected ? 1 : 0.6,
                                        pointerEvents: "auto",
                                        padding: 0,
                                      }}
                                      onPointerDown={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        beginSegmentDrag(e, "background", seg.id, "end", start, end);
                                      }}
                                    >
                                      <div style={{ width: "2px", height: "14px", background: "#ffffff", borderRadius: "1px", pointerEvents: "none" }} />
                                    </button>
                                </div>
                              );
                            })}
                            {(() => {
                              const lastSeg = bgSegments[bgSegments.length - 1];
                              const lastEnd = lastSeg ? (lastSeg.end || effectiveDuration) : 0;
                              const addLeftPct = (lastEnd / totalTimelineDuration) * 100;
                              if (lastEnd >= effectiveDuration) return null;
                              return (
                                <button
                                  type="button"
                                  title="Add another 4s background segment"
                                    onClick={e => {
                                      e.stopPropagation();
                                      const maxCuts = planConfig?.maxBgCuts ?? 12;
                                      if (bgSegments.length >= maxCuts) {
                                        triggerUpgradeNotice("Reached " + planConfig.name + " limit of " + maxCuts + " background cuts. Upgrade to unlock more.");
                                        return;
                                      }
                                      const newStart = lastEnd;
                                      const segDuration = Math.min(4, Math.max(1, effectiveDuration - newStart));
                                      setPendingNewBgSlot({ start: newStart, duration: segDuration });
                                    setSelectedLayer("background");
                                    setSelectedSegmentId(null);
                                    setActiveCatalogTab("backgrounds");
                                    onPlaybackStateChange?.({ selectedLayer: "background" });
                                  }}
                                  style={{
                                    position: "absolute",
                                    left: addLeftPct + "%",
                                    top: "4px",
                                    height: "26px",
                                    padding: "0 8px",
                                    borderRadius: "4px",
                                    background: "#232734",
                                    border: "1px dashed rgba(255, 255, 255, 0.4)",
                                    color: "#ffffff",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    zIndex: 20
                                  }}
                                >
                                  +
                                </button>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* TRACK 3: CAPTION */}
                    <div
                      className={"timeline-unified-row row-caption track-row-captions " + (selectedLayer === "caption" ? "is-selected" : selectedLayer ? "is-dimmed" : "is-active")}
                      style={{ height: "40px", display: "block", background: "#181b24", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "4px" }}
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
                              className={"caption-segment-pill " + (isSelected ? "is-selected" : selectedSubtitleId ? "is-caption-dimmed" : "")}
                              style={{
                                left: startPercent + "%",
                                width: widthPercent + "%",
                                filter: captionSearchQuery && captionSearchQuery.trim()
                                  ? (isSearchHit
                                      ? "brightness(1.3) contrast(1.1) drop-shadow(0 0 8px rgba(168, 85, 247, 0.95))"
                                      : "grayscale(100%) opacity(0.2)")
                                  : undefined,
                                transform: captionSearchQuery && captionSearchQuery.trim() && isSearchHit ? "scale(1.02)" : undefined,
                                transition: segmentDragRef.current ? "none" : "border 0.15s ease, box-shadow 0.15s ease",
                              }}
                              onPointerDown={event => {
                                if (isCaptionLocked) return;
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
                              ></button>
                              
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
                              ></button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* TRACK 4: MUSIC */}
                    <div
                      className={"timeline-unified-row row-music " + (selectedLayer === "music" ? "is-selected" : selectedLayer ? "is-dimmed" : "is-active")}
                      style={{ height: "34px", display: "block", background: "#181b24", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "4px" }}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedLayer("music");
                        selectSubtitle(null);
                      }}
                    >
                      <div className="track-lane" onClick={handleTimelineClick} style={{ height: "100%", width: "100%", position: "relative" }}>
                        {localSongUrl ? (
                          songSegments.map((seg, idx) => {
                            const audioLimit = (duration || mediaDuration || effectiveDuration || 0);
                            const start = seg.start || 0;
                            const actualEnd = seg.end || songDuration || 7;
                            const segDur = Math.max(0.1, actualEnd - start);

                            const leftPct = (start / totalTimelineDuration) * 100;
                            const totalWidthPct = (segDur / totalTimelineDuration) * 100;
                            const activePctOfSegment = Math.min(100, Math.max(0, ((audioLimit - start) / segDur) * 100));

                            const isSegSelected = selectedSegmentId === seg.id;
                            const hasOverflow = actualEnd > audioLimit && audioLimit > 0;

                            return (
                              <div
                                key={seg.id}
                                className={"track-lane-clip " + (isSegSelected ? "is-segment-active" : "")}
                                style={{
                                  left: leftPct + "%",
                                  width: totalWidthPct + "%",
                                  height: "100%",
                                  position: "absolute",
                                  borderRadius: "4px",
                                  overflow: "hidden",
                                  cursor: "pointer",
                                  border: isSegSelected ? "1.5px solid #34d399" : "1px solid rgba(52, 211, 153, 0.4)"
                                }}
                                onClick={ev => {
                                  ev.stopPropagation();
                                  setSelectedLayer("music");
                                  setSelectedSegmentId(seg.id);
                                }}
                              >
                                {/* ACTIVE PLAYABLE PORTION (GREEN WITH WAVEFORM) */}
                                <div
                                  style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: activePctOfSegment + "%",
                                    background: "linear-gradient(90deg, rgba(6, 95, 70, 0.75), rgba(4, 120, 87, 0.75))",
                                    borderRight: hasOverflow ? "2px solid #ef4444" : "none",
                                    display: "flex",
                                    alignItems: "center",
                                    overflow: "hidden",
                                    zIndex: 2
                                  }}
                                >
                                  <div
                                    style={{
                                      position: "absolute",
                                      inset: 0,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "1.5px",
                                      padding: "0 6px",
                                      pointerEvents: "none",
                                      overflow: "hidden",
                                      opacity: 0.8
                                    }}
                                  >
                                    {musicPeaks.length > 0 ? (
                                      musicPeaks.map((peak, idx) => {
                                        const barH = Math.max(3, peak * 26);
                                        return (
                                          <div
                                            key={idx}
                                            style={{
                                              flex: "1 1 2px",
                                              minWidth: "1.5px",
                                              maxWidth: "3.5px",
                                              height: barH + "px",
                                              background: "#34d399",
                                              borderRadius: "1px",
                                              transition: "height 0.1s ease"
                                            }}
                                          />
                                        );
                                      })
                                    ) : (
                                      <div style={{ width: "100%", height: "2px", background: "rgba(52, 211, 153, 0.3)" }} />
                                    )}
                                  </div>

                                  <span className="clip-label-text" style={{ position: "relative", zIndex: 3, paddingLeft: "10px", color: "#a7f3d0", fontWeight: 700, whiteSpace: "nowrap" }}>
                                    {localSongName || "Custom song track"}
                                    {songSegments.length > 1 ? " (" + (idx + 1) + ")" : ""}
                                  </span>
                                </div>

                                {/* EXCLUDED TAIL PORTION (MONOCHROME HATCHING PAST AUDIO LIMIT) */}
                                {hasOverflow && (
                                  <div
                                    title="Excluded from export (exceeds audio length)"
                                    style={{
                                      position: "absolute",
                                      left: activePctOfSegment + "%",
                                      right: 0,
                                      top: 0,
                                      bottom: 0,
                                      background: "repeating-linear-gradient(45deg, #181b22, #181b22 6px, #101217 6px, #101217 12px)",
                                      display: "flex",
                                      alignItems: "center",
                                      paddingLeft: "8px",
                                      boxSizing: "border-box",
                                      zIndex: 1,
                                      cursor: "not-allowed"
                                    }}
                                  >
                                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap", userSelect: "none" }}>
                                      (trimmed on export)
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <label
                            className="track-add-song-slot"
                            onClick={e => {
                              e.stopPropagation();
                              if (!planConfig.canUploadMusic) {
                                e.preventDefault();
                                triggerUpgradeNotice("Custom audio tracks are locked on " + planConfig.name + ". Upgrade to unlock.");
                              }
                            }}
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
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ textAlign: "left" }}>+ Select song from local device</span>
                              {userPlan === "starter" && (
                                <span style={{ fontSize: "9px", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "1px 5px", borderRadius: "4px", fontWeight: 700 }}>
                                  PRO
                                </span>
                              )}
                            </div>
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
                                  onSongChange?.({ songUrl: url, songName: file.name, songBlob: file });
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

        {/* NOTIFICATION MODAL: SELECT BACKGROUND SEGMENT */}
        {showBgSelectModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowBgSelectModal(false)}
          >
            <div
              style={{
                width: "360px",
                background: "#181b24",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                color: "#ffffff",
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
                  Select Background Segment
                </span>
                <button
                  type="button"
                  style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "4px", display: "flex" }}
                  onClick={() => setShowBgSelectModal(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <p style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
                Please select any background segment on the timeline to modify its style, or click <strong>"+"</strong> on the timeline to add a new segment.
              </p>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={dontShowBgSelectModalAgain}
                  onChange={e => {
                    const checked = e.target.checked;
                    setDontShowBgSelectModalAgain(checked);
                    try { localStorage.setItem("dont_show_bg_select_modal", checked ? "true" : "false"); } catch {}
                  }}
                  style={{ width: "14px", height: "14px", accentColor: "var(--accent-primary, #60a5fa)", cursor: "pointer" }}
                />
                <span style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>Don't show me again</span>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setShowBgSelectModal(false)}
                  style={{
                    padding: "7px 20px",
                    borderRadius: "6px",
                    background: "var(--accent-primary, #60a5fa)",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* RIGHT PANEL: STUDIO CATALOG & INSPECTOR */}
      <aside className="style-sidebar" style={{ background: "#12141a", borderLeft: "1px solid rgba(255, 255, 255, 0.08)", color: "#ffffff" }}>
        <div className="style-sidebar-scroll">

          {/* MAIN HEADING & 4 TOP TABS */}
          <div className="catalog-header">
            <span className="catalog-title" style={{ color: "#ffffff", fontWeight: 700 }}>Style & Appearance</span>
            <div className="catalog-tabs" role="tablist" aria-label="Style panels" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
              <button
                type="button"
                role="tab"
                aria-selected={activeCatalogTab === "backgrounds"}
                className={"catalog-tab-btn " + (activeCatalogTab === "backgrounds" ? "is-active" : "")} style={{ background: activeCatalogTab === "backgrounds" ? "var(--accent-primary)" : "#181b24", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.08)", fontWeight: 600 }}
                onClick={() => setActiveCatalogTab("backgrounds")}
              >
                <ImageIcon size={13} />
                <span>Backgrounds</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCatalogTab === "templates"}
                className={"catalog-tab-btn " + (activeCatalogTab === "templates" ? "is-active" : "")} style={{ background: activeCatalogTab === "templates" ? "var(--accent-primary)" : "#181b24", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.08)", fontWeight: 600 }}
                onClick={() => setActiveCatalogTab("templates")}
              >
                <LayoutTemplate size={13} />
                <span>Templates</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCatalogTab === "typography"}
                className={"catalog-tab-btn " + (activeCatalogTab === "typography" ? "is-active" : "")} style={{ background: activeCatalogTab === "typography" ? "var(--accent-primary)" : "#181b24", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.08)", fontWeight: 600 }}
                onClick={() => setActiveCatalogTab("typography")}
              >
                <span>Typography</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCatalogTab === "advanced"}
                className={"catalog-tab-btn " + (activeCatalogTab === "advanced" ? "is-active" : "")} style={{ background: activeCatalogTab === "advanced" ? "var(--accent-primary)" : "#181b24", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.08)", fontWeight: 600 }}
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
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
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
                      className={"solid-color-btn " + (((bgSegments.find(s => s.id === selectedSegmentId)?.color || settings.backgroundColor) === item.color && (bgSegments.find(s => s.id === selectedSegmentId)?.themeId || settings.backgroundTheme || "midnight") === "midnight") ? "is-active" : "")}
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
                      onClick={() => handleSelectBackgroundWithConfirm(() => setSettings(prev => ({ ...prev, backgroundTheme: "midnight", backgroundColor: item.color, customImageDataUrl: undefined, customVideoUrl: undefined })), "midnight", item.color)}
                      title={item.label}
                    >
                      {((bgSegments.find(s => s.id === selectedSegmentId)?.color || settings.backgroundColor) === item.color && (bgSegments.find(s => s.id === selectedSegmentId)?.themeId || settings.backgroundTheme || "midnight") === "midnight") && (
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
                      onChange={e => { const val = e.target.value; handleSelectBackgroundWithConfirm(() => setSettings(prev => ({ ...prev, backgroundTheme: "midnight", backgroundColor: val, customImageDataUrl: undefined, customVideoUrl: undefined })), "midnight", val); }}
                    />
                  </label>
                </div>
              </div>

              {/* 2. 10 Gradients in horizontal row */}
              <div className="sub-catalog-group">
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
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
                    const activeSeg = bgSegments.find(s => s.id === selectedSegmentId);
                    const isSelected = selectedSegmentId ? (activeSeg?.themeId === g.id) : false;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleSelectBackgroundWithConfirm(() => setSettings(prev => ({ ...prev, backgroundTheme: g.id as any, customImageDataUrl: undefined, customVideoUrl: undefined })), g.id, undefined)}
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
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
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
                    const activeSeg = bgSegments.find(s => s.id === selectedSegmentId);
                    const isSelected = selectedSegmentId ? (activeSeg?.themeId === p.id) : false;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectBackgroundWithConfirm(() => setSettings(prev => ({ ...prev, backgroundTheme: p.id as any, customImageDataUrl: undefined, customVideoUrl: undefined })), p.id, undefined)}
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
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Upload Background
                </span>
                <label
                  className="upload-dropzone"
                  onClick={e => {
                    if (!planConfig.canUploadBgMedia) {
                      e.preventDefault();
                      e.stopPropagation();
                      triggerUpgradeNotice("Custom background media is locked on " + planConfig.name + ". Upgrade to unlock.");
                      return;
                    }
                    if (!ensureSegmentSelected()) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "18px 12px",
                    border: "1.5px dashed rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    background: "#181b24",
                    color: "#ffffff",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  <FolderUp size={18} color="var(--accent-primary)" />
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "#ffffff" }}>Choose Photo or Video</span>
                    {userPlan === "starter" && (
                      <span style={{ fontSize: "9px", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "1px 5px", borderRadius: "4px", fontWeight: 700 }}>
                        PRO
                      </span>
                    )}
                  </div>
                  <small style={{ fontSize: "0.65rem", color: "#64748b" }}>All image and video formats supported</small>
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

                {(() => {
                  const cur = currentTimeRef.current;
                  const activeSeg = bgSegments.find(s => s.id === selectedSegmentId) || bgSegments.find(s => cur >= s.start && cur < s.end);
                  return Boolean(activeSeg?.themeId === "custom-image" || activeSeg?.themeId === "custom-video" || activeSeg?.customImageUrl || activeSeg?.customVideoUrl);
                })() && (
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
                      <span style={{ fontSize: "0.72rem", color: "#cbd5e1", fontWeight: 500 }}>Active custom media</span>
                      <button
                        type="button"
                        style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                        onClick={() => {
                          setSettings(prev => ({ ...prev, customImageDataUrl: undefined, customVideoUrl: undefined }));
                          if (selectedSegmentId) {
                            setBgSegments(prev => prev.map(s => s.id === selectedSegmentId ? { ...s, themeId: "midnight", color: "#000000", customImageUrl: undefined, customVideoUrl: undefined } : s));
                          }
                        }}
                        title="Remove custom backdrop"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.6)" }}>Fit Mode</span>
                      <div style={{ display: "flex", gap: "4px", background: "#181b24", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "2px", borderRadius: "6px" }}>
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
                                borderRadius: "4px", cursor: "pointer", color: "#ffffff", background: isActive ? "#2d3345" : "transparent", border: isActive ? "1px solid #4a5568" : "none"
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
                        color: "#64748b",
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
                              background: isSelected ? "var(--accent-glow, rgba(59, 130, 246, 0.16))" : "#14171c",
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
                                    color: "#ffffff",
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
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Font and Weight
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div className="custom-select-wrap">
                    <select className="studio-select" value={settings.fontFamily} onChange={e => setAppearance("fontFamily", e.target.value)} style={{ background: "#1c202a", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "6px", fontFamily: settings.fontFamily }}>
                      <optgroup label="serif">
                        <option key="Times New Roman" value={"Times New Roman, Times, serif"} style={{ fontFamily: "Times New Roman, Times, serif" }}>Times New Roman</option>
                        <option key="Georgia" value={"Georgia, serif"} style={{ fontFamily: "Georgia, serif" }}>Georgia</option>
                        <option key="Garamond" value={"Garamond, serif"} style={{ fontFamily: "Garamond, serif" }}>Garamond</option>
                        <option key="Palatino" value={"Palatino, serif"} style={{ fontFamily: "Palatino, serif" }}>Palatino</option>
                        <option key="Baskerville" value={"Baskerville, serif"} style={{ fontFamily: "Baskerville, serif" }}>Baskerville</option>
                        <option key="Cambria" value={"Cambria, Georgia, serif"} style={{ fontFamily: "Cambria, Georgia, serif" }}>Cambria</option>
                      </optgroup>
                      <optgroup label="sans-serif">
                        <option key="Arial" value={"Arial, Helvetica, sans-serif"} style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>Arial</option>
                        <option key="Helvetica" value={"Helvetica, Arial, sans-serif"} style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>Helvetica</option>
                        <option key="Verdana" value={"Verdana, Geneva, sans-serif"} style={{ fontFamily: "Verdana, Geneva, sans-serif" }}>Verdana</option>
                        <option key="Trebuchet MS" value={"Trebuchet MS, sans-serif"} style={{ fontFamily: "Trebuchet MS, sans-serif" }}>Trebuchet MS</option>
                        <option key="Segoe UI" value={"Segoe UI, Roboto, sans-serif"} style={{ fontFamily: "Segoe UI, Roboto, sans-serif" }}>Segoe UI</option>
                        <option key="Tahoma" value={"Tahoma, Verdana, sans-serif"} style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>Tahoma</option>
                      </optgroup>
                      <optgroup label="monospace">
                        <option key="Courier New" value={"Courier New, Courier, monospace"} style={{ fontFamily: "Courier New, Courier, monospace" }}>Courier New</option>
                        <option key="Consolas" value={"Consolas, monospace"} style={{ fontFamily: "Consolas, monospace" }}>Consolas</option>
                        <option key="Monaco" value={"Monaco, monospace"} style={{ fontFamily: "Monaco, monospace" }}>Monaco</option>
                        <option key="Lucida Console" value={"Lucida Console, monospace"} style={{ fontFamily: "Lucida Console, monospace" }}>Lucida Console</option>
                        <option key="Source Code Pro" value={"Source Code Pro, monospace"} style={{ fontFamily: "Source Code Pro, monospace" }}>Source Code Pro</option>
                        <option key="Generic Monospace" value={"monospace"} style={{ fontFamily: "monospace" }}>Generic Monospace</option>
                      </optgroup>
                      <optgroup label="cursive">
                        <option key="Comic Sans MS" value={"Comic Sans MS, cursive, sans-serif"} style={{ fontFamily: "Comic Sans MS, cursive, sans-serif" }}>Comic Sans MS</option>
                        <option key="Brush Script MT" value={"Brush Script MT, cursive"} style={{ fontFamily: "Brush Script MT, cursive" }}>Brush Script MT</option>
                        <option key="Lucida Handwriting" value={"Lucida Handwriting, cursive"} style={{ fontFamily: "Lucida Handwriting, cursive" }}>Lucida Handwriting</option>
                        <option key="Apple Chancery" value={"Apple Chancery, cursive"} style={{ fontFamily: "Apple Chancery, cursive" }}>Apple Chancery</option>
                        <option key="Bradley Hand" value={"Bradley Hand, cursive"} style={{ fontFamily: "Bradley Hand, cursive" }}>Bradley Hand</option>
                        <option key="Generic Cursive" value={"cursive"} style={{ fontFamily: "cursive" }}>Generic Cursive</option>
                      </optgroup>
                      <optgroup label="fantasy">
                        <option key="Impact" value={"Impact, fantasy"} style={{ fontFamily: "Impact, fantasy" }}>Impact</option>
                        <option key="Papyrus" value={"Papyrus, fantasy"} style={{ fontFamily: "Papyrus, fantasy" }}>Papyrus</option>
                        <option key="Copperplate" value={"Copperplate, fantasy"} style={{ fontFamily: "Copperplate, fantasy" }}>Copperplate</option>
                        <option key="Harrington" value={"Harrington, fantasy"} style={{ fontFamily: "Harrington, fantasy" }}>Harrington</option>
                        <option key="Luminari" value={"Luminari, fantasy"} style={{ fontFamily: "Luminari, fantasy" }}>Luminari</option>
                        <option key="Generic Fantasy" value={"fantasy"} style={{ fontFamily: "fantasy" }}>Generic Fantasy</option>
                      </optgroup>
                      <optgroup label="system-ui">
                        <option key="System Default" value={"system-ui, -apple-system, sans-serif"} style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>System Default</option>
                        <option key="Segoe UI System" value={"Segoe UI, sans-serif"} style={{ fontFamily: "Segoe UI, sans-serif" }}>Segoe UI</option>
                        <option key="Roboto" value={"Roboto, sans-serif"} style={{ fontFamily: "Roboto, sans-serif" }}>Roboto</option>
                        <option key="Cantarell" value={"Cantarell, sans-serif"} style={{ fontFamily: "Cantarell, sans-serif" }}>Cantarell</option>
                        <option key="San Francisco" value={"-apple-system, BlinkMacSystemFont, sans-serif"} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>San Francisco</option>
                        <option key="Ubuntu" value={"Ubuntu, sans-serif"} style={{ fontFamily: "Ubuntu, sans-serif" }}>Ubuntu</option>
                      </optgroup>
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px", background: "#181b24", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "2px", borderRadius: "6px" }}>
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
                            borderRadius: "4px", cursor: "pointer", color: "#ffffff", background: isActive ? "#2d3345" : "transparent", border: isActive ? "1px solid #4a5568" : "none"
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
                    <div className="studio-segmented-pill" style={{ background: "#141720", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "2px", borderRadius: "6px" }}>
                      <button
                        type="button"
                        style={{ background: settings.textTransform === "uppercase"  ? "#2d3345" : "transparent", color: "#ffffff", border: settings.textTransform === "uppercase"  ? "1px solid #4a5568" : "none", borderRadius: "4px", padding: "4px 10px", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}
                        onClick={() => setAppearance("textTransform", "uppercase")}
                      >
                        ALL CAPS
                      </button>
                      <button
                        type="button"
                        style={{ background: settings.textTransform !== "uppercase"  ? "#2d3345" : "transparent", color: "#ffffff", border: settings.textTransform !== "uppercase"  ? "1px solid #4a5568" : "none", borderRadius: "4px", padding: "4px 10px", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}
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
                        className="studio-select" style={{ background: "#1c202a", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "6px" }}
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
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Size
                </span>
                <div className="control-group">
                  <div className="slider-header">
                    <span className="control-label">Font Size</span>
                    <span className="slider-badge" style={{ background: "#232734", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.12)", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>{settings.fontSize || 24}px</span>
                  </div>
                  <div className="slider-wrap">
                    <input
                      type="range"
                      className="studio-slider" style={{ accentColor: "#cbd5e1" }}
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
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Position and Alignment
                </span>
                <div className="field-split">
                  <div className="control-group" style={{ flex: 1 }}>
                    <span className="control-label">Anchor</span>
                    <div className="custom-select-wrap">
                      <select
                        className="studio-select" style={{ background: "#1c202a", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "6px" }}
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
                    <div className="studio-segmented-pill" style={{ background: "#141720", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "2px", borderRadius: "6px" }}>
                      <button
                        type="button"
                        style={{ background: settings.alignment === "left"  ? "#2d3345" : "transparent", color: "#ffffff", border: settings.alignment === "left"  ? "1px solid #4a5568" : "none", borderRadius: "4px", padding: "4px 10px", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}
                        onClick={() => setAppearance("alignment", "left")}
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        style={{ background: settings.alignment === "center"  ? "#2d3345" : "transparent", color: "#ffffff", border: settings.alignment === "center"  ? "1px solid #4a5568" : "none", borderRadius: "4px", padding: "4px 10px", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}
                        onClick={() => setAppearance("alignment", "center")}
                      >
                        Center
                      </button>
                      <button
                        type="button"
                        style={{ background: settings.alignment === "right"  ? "#2d3345" : "transparent", color: "#ffffff", border: settings.alignment === "right"  ? "1px solid #4a5568" : "none", borderRadius: "4px", padding: "4px 10px", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer" }}
                        onClick={() => setAppearance("alignment", "right")}
                      >
                        Right
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sub-catalog-group">
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
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
                <span className="sub-group-title" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Platform Safe Zones
                </span>
                <label
                  className="studio-toggle-bar"
                  onClick={e => {
                    if (!planConfig.canUseSafeZones) {
                      e.preventDefault();
                      triggerUpgradeNotice("Safe Area Overlays are locked on " + planConfig.name + ". Upgrade to unlock.");
                    }
                  }}
                  style={{ cursor: userPlan === "starter" ? "not-allowed" : "pointer" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Safe Area Overlays
                    {userPlan === "starter" && (
                      <span style={{ fontSize: "10px", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, marginLeft: "6px" }}>
                        PRO
                      </span>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    className="studio-checkbox"
                    disabled={userPlan === "starter"}
                    checked={userPlan === "starter" ? false : Boolean(settings.safeZones?.show)}
                    onChange={event => {
                      if (userPlan === "starter") return;
                      setSettings(previous => ({
                        ...previous,
                        safeZones: { ...(previous.safeZones ?? { platform: "instagram" }), show: event.target.checked },
                      }));
                    }}
                  />
                </label>

                {settings.safeZones?.show && userPlan !== "starter" && (
                  <div
                    className="studio-segmented-pill"
                    style={{
                      background: "#141720",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      padding: "2px",
                      borderRadius: "6px",
                      marginTop: "10px",
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "2px",
                    }}
                  >
                    <button
                      type="button"
                      className={"pill-btn " + (settings.safeZones?.platform === "instagram" && settings.aspectRatio === "9:16" ? "is-active" : "")}
                      style={{
                        padding: "5px 6px",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        background: settings.safeZones?.platform === "instagram" && settings.aspectRatio === "9:16" ? "#ee6346" : "transparent",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        aspectRatio: "9:16",
                        safeZones: { platform: "instagram", show: true }
                      }))}
                    >
                      Reels
                    </button>
                    <button
                      type="button"
                      className={"pill-btn " + ((settings.safeZones?.platform === "youtube-shorts" || settings.safeZones?.platform === "youtube") && settings.aspectRatio === "9:16" ? "is-active" : "")}
                      style={{
                        padding: "5px 6px",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        background: (settings.safeZones?.platform === "youtube-shorts" || settings.safeZones?.platform === "youtube") && settings.aspectRatio === "9:16" ? "#ee6346" : "transparent",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        aspectRatio: "9:16",
                        safeZones: { platform: "youtube-shorts", show: true }
                      }))}
                    >
                      YT Shorts
                    </button>
                    <button
                      type="button"
                      className={"pill-btn " + (settings.safeZones?.platform === "youtube-long" && settings.aspectRatio === "16:9" ? "is-active" : "")}
                      style={{
                        padding: "5px 6px",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        background: settings.safeZones?.platform === "youtube-long" && settings.aspectRatio === "16:9" ? "#ee6346" : "transparent",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        aspectRatio: "16:9",
                        safeZones: { platform: "youtube-long", show: true }
                      }))}
                    >
                      YouTube (16:9)
                    </button>
                  </div>
                )}
              </div>

              <div style={{ padding: "16px 12px", border: "1px dashed rgba(255, 255, 255, 0.15)", borderRadius: "8px", textAlign: "center" }}>
                <p style={{ fontSize: "0.75rem", margin: 0, fontWeight: 600, color: "#ffffff" }}>Coming Soon</p>
                <p style={{ fontSize: "0.68rem", marginTop: "4px", color: "#64748b", lineHeight: 1.4 }}>
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
export default Workspace;
