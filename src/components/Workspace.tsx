import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasSettings, Subtitle, CaptionLanguage, ExportResolutionPreset } from '../types';
import { getSubtitleCanvasLayout, renderSubtitlesToCanvas } from '../utils/SubtitleRenderer';
import { generateHookSuggestions, getPlatformSafeZone, isSafeZoneWarning } from '../utils/creatorTools';
import { getCaptionText } from '../utils/transliterate';
import {
  CAPTION_TEMPLATES,
  applyTemplateToSettings,
  type CaptionTemplateDefinition,
} from '../utils/captionTemplates';
import {
  BACKGROUND_THEMES,
  drawBackgroundToCanvas,
} from '../utils/backgroundThemes';
import {
  Check,
  Copy,
  Download,
  FileImage,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  Pause,
  Play,
  RotateCcw,
  Scissors,
  Sliders,
  Trash2,
  Upload,
  Undo2,
  Redo2,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ExportModal } from './ExportModal';
import { downloadStringAsFile, exportToSRT, exportToVTT } from '../utils/exporter';
import {
  getPreferredMimeType,
  getExportDimensions,
  getSupportedWebmMimeType,
} from '../utils/exportCapabilities';

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

const MIN_CAPTION_DURATION = 0.05;
type TimelineDragMode = 'move' | 'start' | 'end';
type TimelineTiming = Pick<Subtitle, 'start' | 'end'>;

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
  if (typeof capturableMedia.captureStream === 'function') {
    return capturableMedia.captureStream();
  }
  if (typeof capturableMedia.mozCaptureStream === 'function') {
    return capturableMedia.mozCaptureStream();
  }
  return null;
}

function stopStreamTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
}

interface WorkspaceProps {
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

type StyleTab = 'templates' | 'backgrounds' | 'advanced';

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
  onBackToUpload,
  onOpenExport,
  projectTitle,
  onProjectTitleChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRef = useRef<HTMLVideoElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const customImageRef = useRef<HTMLImageElement | null>(null);
  const customVideoRef = useRef<HTMLVideoElement | null>(null);

  const [activeTab, setActiveTab] = useState<StyleTab>('templates');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [localSelectedSubtitleId, setLocalSelectedSubtitleId] = useState<string | null>(null);
  const [editingSubtitleId, setEditingSubtitleId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [inlineEditorStyle, setInlineEditorStyle] = useState<React.CSSProperties | null>(null);
  const inlineEditorRef = useRef<HTMLTextAreaElement>(null);
  const editingSubtitleIdRef = useRef<string | null>(null);
  const draftTextRef = useRef('');
  /** Export quality preset — drives off-screen canvas size and MediaRecorder bitrate. */
  const [exportResolution, setExportResolution] = useState<ExportResolutionPreset>('1080p');
  /** Current media time during an active export — fed to ExportModal progress bar. */
  const [exportCurrentTime, setExportCurrentTime] = useState(0);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [timelineTimingPreview, setTimelineTimingPreview] = useState<(TimelineTiming & { id: string }) | null>(null);
  const timelineDragRef = useRef<TimelineDrag | null>(null);
  const captionTrackRef = useRef<HTMLDivElement>(null);

  const animationRef = useRef<number | undefined>(undefined);
  const drawFrameRef = useRef<() => void>(() => undefined);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const exportCancelledRef = useRef(false);
  /** Off-screen canvas used exclusively during export to avoid blurry preview scaling. */
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  /** rAF handle for the off-screen export render loop. */
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
      case '16:9': return { width: height * (16 / 9), height };
      case '9:16': return { width: height * (9 / 16), height };
      case '1:1': return { width: height, height };
      case '4:5': return { width: height * (4 / 5), height };
      default: return { width: height * (9 / 16), height };
    }
  };

  const dims = getCanvasDimensions();
  const isVideoMedia = Boolean(videoFile && (
    videoFile.type.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(videoFile.name)
  ));

  const canExportWebm =
    getPreferredMimeType(true) !== null ||
    getSupportedWebmMimeType(true) !== null ||
    getSupportedWebmMimeType(false) !== null;

  // Custom image preloader
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

  // Clean up custom background video object URLs
  useEffect(() => {
    return () => {
      if (settings.customVideoUrl && settings.customVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(settings.customVideoUrl);
      }
    };
  }, [settings.customVideoUrl]);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const media = mediaRef.current;
    if (!canvas || !media) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Synchronize custom background video playback and looping
    const customVideo = customVideoRef.current;
    if (settings.backgroundTheme === 'custom-video' && customVideo) {
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

    // 1. Draw background theme, custom image, custom video, or video frames
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

    // 2. Render safe-zone guides and hook overlays when enabled.
    if (settings.safeZones?.show) {
      const zone = getPlatformSafeZone(settings.safeZones.platform, settings.aspectRatio);
      const safeRect = { x: zone.safeArea.x * canvas.width, y: zone.safeArea.y * canvas.height, width: zone.safeArea.width * canvas.width, height: zone.safeArea.height * canvas.height };
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(safeRect.x, safeRect.y, safeRect.width, safeRect.height);
      ctx.setLineDash([]);
      zone.blocked.forEach(region => {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
        ctx.fillRect(region.x * canvas.width, region.y * canvas.height, region.width * canvas.width, region.height * canvas.height);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '12px sans-serif';
        ctx.fillText(region.label, region.x * canvas.width + 8, region.y * canvas.height + 18);
      });
      ctx.restore();
    }

    if (settings.hookOverlay?.enabled && settings.hookOverlay.text.trim()) {
      const hook = settings.hookOverlay;
      const x = (hook.xPosition ?? 0.5) * canvas.width;
      const y = (hook.yPosition ?? 0.14) * canvas.height;
      ctx.save();
      ctx.font = `700 ${hook.fontSize || 34}px ${hook.fontFamily || "'Inter', sans-serif"}`;
      const textWidth = ctx.measureText(hook.text).width;
      const boxWidth = textWidth + 24;
      const boxHeight = (hook.fontSize || 34) + 18;
      const boxX = hook.horizontalAlign === 'left' ? x : hook.horizontalAlign === 'right' ? x - boxWidth : x - boxWidth / 2;
      const boxY = y - boxHeight / 2;
      ctx.fillStyle = hook.backgroundColor || '#00000080';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeStyle = hook.outlineColor || '#000000';
      ctx.lineWidth = hook.outlineWidth ?? 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      ctx.fillStyle = hook.color || '#ffffff';
      ctx.textAlign = hook.horizontalAlign === 'left' ? 'left' : hook.horizontalAlign === 'right' ? 'right' : 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hook.text, hook.horizontalAlign === 'left' ? boxX + 12 : hook.horizontalAlign === 'right' ? boxX + boxWidth - 12 : boxX + boxWidth / 2, boxY + boxHeight / 2);
      ctx.restore();
    }

    // 2. Render live subtitles over background
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
    drawFrameRef.current = drawFrame;
  }, [drawFrame]);

  // Media loading
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
      const handleEnded = () => {
        setIsPlaying(false);
      };
      media.addEventListener('ended', handleEnded);
      return () => media.removeEventListener('ended', handleEnded);
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
      if (language === 'tenglish') return { ...subtitle, tenglishText: nextText };
      return { ...subtitle, text: nextText, tenglishText: language === 'te' ? undefined : subtitle.tenglishText };
    }));
    editingSubtitleIdRef.current = null;
    setEditingSubtitleId(null);
  };

  const cancelInlineEdit = () => {
    editingSubtitleIdRef.current = null;
    setEditingSubtitleId(null);
    draftTextRef.current = '';
    setDraftText('');
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingSubtitleId) saveInlineEdit();
    canvasAreaRef.current?.focus();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * canvas.width / rect.width;
    const y = (event.clientY - rect.top) * canvas.height / rect.height;
    const ctx = canvas.getContext('2d');
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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const layout = getSubtitleCanvasLayout(ctx, canvas.width, canvas.height, currentTime, subtitles, settings, language);
    if (!layout) return;
    if (
      x >= layout.left && x <= layout.left + layout.width &&
      y >= layout.y - layout.height / 2 && y <= layout.y + layout.height / 2
    ) startEditing(layout.subtitle);
  };

  const handleCanvasKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && editingSubtitleId) {
      event.preventDefault();
      cancelInlineEdit();
      return;
    }
    if (event.key === 'Enter' && !editingSubtitleId && selectedSubtitleId) {
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
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const layout = getSubtitleCanvasLayout(ctx, canvas.width, canvas.height, currentTime, [subtitle], settings, language);
    if (!layout) return null;
    const canvasRect = canvas.getBoundingClientRect();
    const frameRect = canvas.parentElement?.getBoundingClientRect() ?? canvasRect;
    // clientWidth/clientHeight exclude the canvas border, matching the drawable
    // coordinate space used by the renderer. This keeps the editor on the same
    // rendered caption bounds at every preview scale.
    const scaleX = canvas.clientWidth / canvas.width;
    const scaleY = canvas.clientHeight / canvas.height;
    const isTelugu = language === 'te' || /[\u0C00-\u0C7F]/.test(subtitle.text);
    const fontFamily = isTelugu
      ? "'Noto Sans Telugu', 'Inter', sans-serif"
      : `${settings.fontFamily}, 'Noto Sans Telugu', sans-serif`;
    const horizontalPadding = settings.style === 'box' || settings.textBackground ? 40 : settings.style === 'outline' ? 12 : 0;
    const verticalPadding = settings.style === 'box' || settings.textBackground ? 20 : settings.style === 'outline' ? 12 : 0;
    const renderedWidth = layout.width * scaleX;
    const editorWidth = Math.min(canvas.clientWidth * 0.8, Math.max(renderedWidth, 180));
    const renderedLeft = canvasRect.left - frameRect.left + canvas.clientLeft + layout.left * scaleX;
    const left = settings.alignment === 'left'
      ? renderedLeft
      : settings.alignment === 'right'
        ? renderedLeft + renderedWidth - editorWidth
        : renderedLeft + (renderedWidth - editorWidth) / 2;
    const sidePadding = horizontalPadding * scaleX;
    return {
      position: 'absolute',
      left,
      top: canvasRect.top - frameRect.top + canvas.clientTop + (layout.y - layout.height / 2) * scaleY,
      width: editorWidth,
      height: Math.max(1, layout.height * scaleY),
      minHeight: 0,
      paddingTop: verticalPadding * scaleY / 2,
      paddingBottom: verticalPadding * scaleY / 2,
      paddingLeft: settings.alignment === 'left' ? 0 : sidePadding / 2,
      paddingRight: settings.alignment === 'right' ? 0 : sidePadding / 2,
      color: settings.textColor,
      fontFamily,
      fontSize: `${layout.fontSize * scaleY}px`,
      lineHeight: `${layout.lineHeight * scaleY}px`,
      textAlign: settings.alignment,
      background: settings.style === 'box' || settings.textBackground ? settings.boxColor || 'rgba(0, 0, 0, 0.6)' : 'transparent',
      borderRadius: settings.style === 'box' || settings.textBackground ? '10px' : 0,
      zIndex: 2,
    };
  }, [currentTime, editingSubtitleId, language, settings, subtitles]);

  // A click on a non-editor surface (including non-focusable sidebar content)
  // commits the draft. The capture listener runs before canvas/timeline clicks,
  // so selecting another caption never leaves the previous draft open.
  useEffect(() => {
    if (!editingSubtitleId) return undefined;
    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && inlineEditorRef.current?.contains(target)) return;
      saveInlineEdit();
    };
    document.addEventListener('pointerdown', handleOutsidePointerDown, true);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
  }, [editingSubtitleId]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setInlineEditorStyle(calculateInlineEditorStyle());
    });
    const canvas = canvasRef.current;
    const resizeObserver = canvas && editingSubtitleId && typeof ResizeObserver !== 'undefined'
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
    if (!mediaRef.current || isExporting) return;
    if (mediaRef.current.paused) {
      void mediaRef.current.play().then(() => {
        setIsPlaying(true);
        drawFrame();
      }).catch(error => {
        setExportError(error instanceof Error ? error.message : 'Unable to play this media.');
      });
    } else {
      mediaRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  };

  const handleExportFrame = () => {
    if (!canvasRef.current) {
      setExportError('Preview is not ready for a PNG export.');
      return;
    }
    setExportError('');
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'frame.png';
    a.click();
  };

  const handleExportSrt = () => {
    downloadStringAsFile(exportToSRT(subtitles, language), 'captions.srt');
  };

  const handleExportVtt = () => {
    downloadStringAsFile(exportToVTT(subtitles, language), 'captions.vtt');
  };

  const cancelExport = () => {
    exportCancelledRef.current = true;
    mediaRef.current?.pause();
    if (exportAnimRef.current) {
      cancelAnimationFrame(exportAnimRef.current);
      exportAnimRef.current = undefined;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      offscreenCanvasRef.current = null;
      setIsExporting(false);
      setExportError('Export cancelled.');
    }
  };

  const handleExportVideo = () => {
    const media = mediaRef.current;
    if (!media) {
      setExportError('Preview is not ready for a video export.');
      return;
    }
    if (!('MediaRecorder' in window)) {
      setExportError('This browser does not support canvas recording.');
      return;
    }

    // -----------------------------------------------------------------------
    // 1. Resolve target dimensions from the chosen resolution preset
    // -----------------------------------------------------------------------
    const { width: targetWidth, height: targetHeight, videoBitsPerSecond } =
      getExportDimensions(exportResolution, settings.aspectRatio);

    /** Preview canvas height (locked at 600 px). Typography is scaled proportionally. */
    const BASE_PREVIEW_HEIGHT = 600;
    const scaleFactor = targetHeight / BASE_PREVIEW_HEIGHT;

    // -----------------------------------------------------------------------
    // 2. Create off-screen render canvas sized to the target resolution
    // -----------------------------------------------------------------------
    const offscreen = document.createElement('canvas');
    offscreen.width = targetWidth;
    offscreen.height = targetHeight;
    offscreenCanvasRef.current = offscreen;

    if (typeof offscreen.captureStream !== 'function') {
      setExportError('This browser does not support canvas capture streams.');
      return;
    }

    setIsExporting(true);
    setExportError('');
    setExportComplete(false);
    setExportProgress(0);
    setExportCurrentTime(0);
    exportCancelledRef.current = false;
    chunksRef.current = [];

    // -----------------------------------------------------------------------
    // 3. Stream setup
    // -----------------------------------------------------------------------
    const canvasStream = offscreen.captureStream(30);
    const mediaStream = getMediaCaptureStream(media);
    const audioTracks = mediaStream?.getAudioTracks() ?? [];
    const videoTracks = canvasStream.getVideoTracks();

    if (videoTracks.length === 0) {
      stopStreamTracks(canvasStream);
      setIsExporting(false);
      setExportError('This browser did not provide a video track for export.');
      return;
    }

    // Probe best browser-native WebM codec: VP9+Opus → VP8+Opus → generic WebM.
    const mimeType = getPreferredMimeType(audioTracks.length > 0)
      ?? getSupportedWebmMimeType(audioTracks.length > 0);
    if (!mimeType) {
      stopStreamTracks(canvasStream);
      stopStreamTracks(mediaStream);
      setIsExporting(false);
      setExportError('No supported export codec is available in this browser.');
      return;
    }

    const combinedStream = new MediaStream([
      ...videoTracks,
      // Only add audio tracks when they exist — prevents crashes on silent media
      ...(audioTracks.length > 0 ? audioTracks : []),
    ]);

    // -----------------------------------------------------------------------
    // 4. MediaRecorder with explicit high bitrate
    // -----------------------------------------------------------------------
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond,
      });
    } catch (error) {
      setIsExporting(false);
      setExportError(error instanceof Error ? error.message : 'Unable to start video export.');
      stopStreamTracks(canvasStream);
      stopStreamTracks(mediaStream);
      return;
    }

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    // -----------------------------------------------------------------------
    // 5. Determine download extension from mimeType
    // -----------------------------------------------------------------------
    const fileExt = 'webm';
    const downloadMime = 'video/webm';

    let exportEndedListener: (() => void) | null = null;
    const cleanupExport = (canvasStream: MediaStream, mediaStream: MediaStream | null) => {
      if (exportAnimRef.current) cancelAnimationFrame(exportAnimRef.current);
      exportAnimRef.current = undefined;
      if (exportEndedListener) {
        media.removeEventListener('ended', exportEndedListener);
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
        const a = document.createElement('a');
        a.href = url;
        a.download = `export-${exportResolution}.${fileExt}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        setExportComplete(true);
        setExportProgress(100);
      } else {
        setExportError('Export cancelled.');
      }
      cleanupExport(canvasStream, mediaStream);
    };

    recorder.onerror = () => {
      setExportError('The browser stopped the export unexpectedly.');
      cleanupExport(canvasStream, mediaStream);
    };

    mediaRecorderRef.current = recorder;
    media.currentTime = 0;

    // -----------------------------------------------------------------------
    // 6. Off-screen render loop — draws high-res frames to the offscreen canvas
    // -----------------------------------------------------------------------
    const scaledSettings: CanvasSettings = {
      ...settings,
      fontSize: Math.round(settings.fontSize * scaleFactor),
    };

    const renderExportFrame = () => {
      const ctx = offscreen.getContext('2d');
      if (!ctx || exportCancelledRef.current) return;

      ctx.clearRect(0, 0, offscreen.width, offscreen.height);

      // Sync custom background video
      const customVideo = customVideoRef.current;
      if (settings.backgroundTheme === 'custom-video' && customVideo && customVideo.duration > 0) {
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
        null, // no selection highlight during export
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
      if (exportCancelledRef.current || recorder.state === 'inactive') return;
      // The ended event can arrive before the next rAF. Draw the terminal
      // frame synchronously, then let MediaRecorder queue its final chunk.
      renderExportFrame();
      setExportProgress(100);
      try {
        recorder.stop();
      } catch {
        setExportError('The browser could not finish the export.');
        cleanupExport(canvasStream, mediaStream);
      }
    };
    exportEndedListener = handleExportEnded;
    media.addEventListener('ended', handleExportEnded, { once: true });

    try {
      recorder.start();
    } catch (error) {
      setIsExporting(false);
      setExportError(error instanceof Error ? error.message : 'Unable to start recording.');
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
      setExportError(error instanceof Error ? error.message : 'Unable to play media for export.');
    });
  };

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mediaRef.current || !duration) return;
    if (editingSubtitleId) saveInlineEdit();
    const rect = event.currentTarget.getBoundingClientRect();
    const nextTime = Math.max(0, Math.min(duration, ((event.clientX - rect.left) / rect.width) * duration));
    mediaRef.current.currentTime = nextTime;
    drawFrame();
  };

  const handleTimelineZoomWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.deltaY && !event.deltaX) return;
    event.preventDefault();
    const delta = event.deltaY || event.deltaX;
    setTimelineZoom(previous => clamp(previous + (delta < 0 ? 0.25 : -0.25), 1, 3));
  };

  const getDraggedTiming = (drag: TimelineDrag, clientX: number): TimelineTiming => {
    const delta = (clientX - drag.startX) / drag.pixelsPerSecond;
    const { start, end } = drag.original;
    const minimum = Math.min(MIN_CAPTION_DURATION, duration);
    if (drag.mode === 'move') {
      const length = end - start;
      const nextStart = clamp(start + delta, 0, duration - length);
      return { start: nextStart, end: nextStart + length };
    }
    if (drag.mode === 'start') return { start: clamp(start + delta, 0, end - minimum), end };
    return { start, end: clamp(end + delta, start + minimum, duration) };
  };

  const beginTimelineDrag = (event: React.PointerEvent<HTMLElement>, subtitle: Subtitle, mode: TimelineDragMode) => {
    event.stopPropagation();
    if (editingSubtitleId) saveInlineEdit();
    if (event.pointerType === 'mouse' && event.button !== 0) return;
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
      id: subtitle.id, mode, pointerId: event.pointerId, startX: event.clientX,
      pixelsPerSecond: trackWidth / duration,
      original: { start, end }, preview: { start, end },
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
        words: drag.mode === 'move' && subtitle.words
          ? subtitle.words.map(word => ({ ...word, start: word.start + offset, end: word.end + offset }))
          : subtitle.words,
      };
    }));
  };

  const nudgeCaptionEdge = (event: React.KeyboardEvent<HTMLButtonElement>, subtitle: Subtitle, edge: 'start' | 'end') => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    event.stopPropagation();
    if (!setSubtitles || !duration) return;
    const delta = event.key === 'ArrowRight' ? 0.1 : -0.1;
    const minimum = Math.min(MIN_CAPTION_DURATION, duration);
    selectSubtitle(subtitle.id);
    setSubtitles(previous => previous.map(item => {
      if (item.id !== subtitle.id) return item;
      const start = clamp(item.start, 0, duration - minimum);
      const end = clamp(item.end, start + minimum, duration);
      return edge === 'start'
        ? { ...item, start: clamp(start + delta, 0, end - minimum), end }
        : { ...item, start, end: clamp(end + delta, start + minimum, duration) };
    }));
  };

  const duplicateSelectedCaption = () => {
    if (!setSubtitles || !selectedSubtitleId || !duration) return;
    const selectedIndex = subtitles.findIndex(item => item.id === selectedSubtitleId);
    if (selectedIndex < 0) return;
    const source = subtitles[selectedIndex];
    const length = clamp(source.end - source.start, Math.min(MIN_CAPTION_DURATION, duration), duration);
    const start = clamp(source.end + 0.1, 0, duration - length);
    const end = start + length;
    const duplicate: Subtitle = {
      ...source,
      id: `${source.id}-copy-${Date.now()}`,
      start,
      end,
      words: source.words?.map(word => ({
        ...word,
        start: word.start + start - source.start,
        end: word.end + start - source.start,
      })),
    };
    setSubtitles(previous => previous.toSpliced(selectedIndex + 1, 0, duplicate));
    selectSubtitle(duplicate.id);
    if (mediaRef.current) mediaRef.current.currentTime = duplicate.start;
  };

  const deleteSelectedCaption = () => {
    if (!setSubtitles || !selectedSubtitleId) return;
    setSubtitles(previous => previous.filter(item => item.id !== selectedSubtitleId));
    selectSubtitle(null);
  };

  const splitSelectedCaption = () => {
    if (!setSubtitles || !selectedSubtitleId) return;
    const index = subtitles.findIndex(item => item.id === selectedSubtitleId);
    if (index < 0) return;
    const source = subtitles[index];
    if (source.end - source.start < 2 * MIN_CAPTION_DURATION) return;
    const splitTime = clamp(currentTime, source.start + MIN_CAPTION_DURATION, source.end - MIN_CAPTION_DURATION);
    if (splitTime <= source.start || splitTime >= source.end) return;
    const visibleText = getCaptionText(source.text, language, source.tenglishText).trim();
    const words = visibleText.split(/\s+/).filter(Boolean);
    const splitPoint = Math.max(1, Math.ceil(words.length / 2));
    const firstVisible = words.length > 1 ? words.slice(0, splitPoint).join(' ') : visibleText;
    const secondVisible = words.length > 1 ? words.slice(splitPoint).join(' ') : visibleText;
    const canonicalWords = source.text.trim().split(/\s+/).filter(Boolean);
    const canonicalPoint = Math.min(canonicalWords.length, splitPoint);
    const first: Subtitle = {
      ...source,
      end: splitTime,
      text: canonicalWords.length > 1 ? canonicalWords.slice(0, canonicalPoint).join(' ') : source.text,
      tenglishText: language === 'tenglish' ? firstVisible : source.tenglishText,
    };
    const second: Subtitle = {
      ...source,
      id: `${source.id}-split-${Date.now()}`,
      start: splitTime,
      text: canonicalWords.length > 1 ? canonicalWords.slice(canonicalPoint).join(' ') : source.text,
      tenglishText: language === 'tenglish' ? secondVisible : source.tenglishText,
    };
    setSubtitles(previous => previous.toSpliced(index, 1, first, second));
    selectSubtitle(second.id);
  };

  const addTimelineCaption = () => {
    if (!setSubtitles || !duration) return;
    const minimum = Math.min(MIN_CAPTION_DURATION, duration);
    const start = clamp(currentTime, 0, duration - minimum);
    const end = clamp(start + 2, start + minimum, duration);
    const caption: Subtitle = {
      id: `timeline-caption-${Date.now()}`,
      start,
      end,
      text: 'New caption',
    };
    setSubtitles(previous => [...previous, caption].sort((left, right) => left.start - right.start));
    selectSubtitle(caption.id);
  };

  const handleCustomImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSettings(prev => ({
          ...prev,
          backgroundTheme: 'custom-image',
          customImageDataUrl: reader.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const isVideo = Boolean(file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(file.name));
    if (!isVideo) {
      setExportError('Please upload a valid background video (MP4, MOV, WebM, MKV).');
      return;
    }
    setExportError('');
    if (settings.customVideoUrl && settings.customVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(settings.customVideoUrl);
    }
    const url = URL.createObjectURL(file);
    setSettings(prev => ({
      ...prev,
      backgroundTheme: 'custom-video',
      customVideoUrl: url,
    }));
  };

  const handleClearCustomVideo = () => {
    if (settings.customVideoUrl && settings.customVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(settings.customVideoUrl);
    }
    setSettings(prev => ({
      ...prev,
      customVideoUrl: undefined,
      backgroundTheme: isVideoMedia ? 'original-video' : 'midnight',
    }));
  };

  const ratioOptions: Array<{ value: CanvasSettings['aspectRatio']; label: string; detail: string }> = [
    { value: '9:16', label: '9:16', detail: 'Reels' },
    { value: '16:9', label: '16:9', detail: 'YouTube' },
    { value: '1:1', label: '1:1', detail: 'Square' },
    { value: '4:5', label: '4:5', detail: 'Portrait' },
  ];

  const setAppearance = <K extends keyof CanvasSettings>(key: K, value: CanvasSettings[K]) => {
    setSettings(previous => ({ ...previous, [key]: value }));
  };

  const createDefaultHookOverlay = (text = '') => ({
    id: 'generated-hook',
    text,
    enabled: Boolean(text),
    fontFamily: "'Inter', sans-serif",
    fontSize: 34,
    color: '#ffffff',
    backgroundColor: '#00000080',
    outlineColor: '#000000',
    outlineWidth: 2,
    horizontalAlign: 'center' as const,
    verticalPosition: 0.14,
    xPosition: 0.5,
    yPosition: 0.14,
  });

  const handleApplyTemplate = (templateId: CanvasSettings['selectedTemplateId']) => {
    if (!templateId) return;
    setSettings(previous => applyTemplateToSettings(previous, templateId));
  };

  const handleResetStyling = () => {
    setSettings(previous => applyTemplateToSettings(previous, 'classic-white'));
  };

  const renderTemplateSampleText = (template: CaptionTemplateDefinition) => {
    const sample = language === 'te'
      ? template.previewSample.te
      : language === 'tenglish'
        ? template.previewSample.tenglish
        : template.previewSample.en;

    const ts = template.settings;
    const isBox = ts.style === 'box' || ts.textBackground;
    const isOutline = ts.style === 'outline';
    const isKinetic = ts.style === 'kinetic';

    const boxBg = isBox ? (ts.boxColor || 'rgba(0,0,0,0.85)') : 'transparent';
    const textColor = ts.textColor || '#ffffff';
    const highlightColor = ts.highlightColor || '#8b5cf6';
    const strokeColor = ts.boxColor || '#000000';
    const isTeluguText = language === 'te' || /[\u0C00-\u0C7F]/.test(sample);
    const fontStack = isTeluguText
      ? "'Noto Sans Telugu', 'Inter', sans-serif"
      : `${ts.fontFamily || "'Inter', sans-serif"}, 'Noto Sans Telugu', sans-serif`;

    const words = sample.split(' ');
    const firstWord = words[0];
    const restWords = words.slice(1).join(' ');

    return (
      <div
        className="template-card-preview"
        style={{
          fontFamily: fontStack,
          backgroundColor: boxBg,
          padding: isBox ? '4px 8px' : '0',
          borderRadius: isBox ? '5px' : '0',
        }}
      >
        <span
          style={{
            color: isKinetic ? highlightColor : textColor,
            textShadow: isOutline ? `-1px -1px 0 ${strokeColor}, 1px -1px 0 ${strokeColor}, -1px 1px 0 ${strokeColor}, 1px 1px 0 ${strokeColor}` : '0 2px 4px rgba(0,0,0,0.6)',
          }}
        >
          {firstWord}
        </span>
        {restWords && (
          <span
            style={{
              marginLeft: '4px',
              color: textColor,
              textShadow: isOutline ? `-1px -1px 0 ${strokeColor}, 1px -1px 0 ${strokeColor}, -1px 1px 0 ${strokeColor}, 1px 1px 0 ${strokeColor}` : '0 2px 4px rgba(0,0,0,0.6)',
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
          <div className="workspace-title">
            <span className="eyebrow accent-eyebrow">Live preview</span>
            <input
              className="project-title-input"
              value={projectTitle || videoFile?.name || 'Caption preview'}
              onChange={event => onProjectTitleChange?.(event.target.value)}
              aria-label="Project title"
            />
            <span className="workspace-duration">
              {duration ? `${formatDuration(duration)} timeline` : 'Loading media metadata'}
            </span>
          </div>
          <div className="workspace-header-actions">
            <label className="ratio-select-wrap">
              <span>Canvas</span>
              <select
                className="ratio-select"
                value={settings.aspectRatio}
                onChange={event => setSettings(previous => ({ ...previous, aspectRatio: event.target.value as CanvasSettings['aspectRatio'] }))}
                aria-label="Canvas aspect ratio"
              >
                {ratioOptions.map(option => <option key={option.value} value={option.value}>{option.label} · {option.detail}</option>)}
              </select>
            </label>
            <button className="icon-button" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)" aria-label="Undo"><Undo2 size={16} /></button>
            <button className="icon-button" onClick={onRedo} disabled={!canRedo} title="Redo (Shift+Ctrl/Cmd+Z)" aria-label="Redo"><Redo2 size={16} /></button>
            <button className="ghost-button workspace-back" onClick={onBackToUpload}>
              <X size={15} /> Replace media
            </button>
            <button
              className="export-trigger"
              onClick={() => {
                if (onOpenExport) {
                  onOpenExport();
                  return;
                }
                setExportError('');
                setExportComplete(false);
                setIsExportPanelOpen(true);
              }}
              disabled={!duration || isExporting}
            >
              <Download size={16} /> Export video
            </button>
          </div>
        </header>

        <div className="preview-stage" ref={canvasAreaRef} tabIndex={0} onKeyDown={handleCanvasKeyDown}>
          <div className={`canvas-frame ratio-${settings.aspectRatio.replace(':', '-')}`}>
            <canvas
              ref={canvasRef}
              width={dims.width}
              height={dims.height}
              onClick={handleCanvasClick}
              onDoubleClick={handleCanvasDoubleClick}
              aria-label="Caption preview. Click a visible caption to edit it."
              className={editingSubtitleId ? 'editing' : ''}
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
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    cancelInlineEdit();
                  } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    saveInlineEdit();
                  }
                }}
                aria-label="Edit caption text"
              />
            )}
          </div>
          {!videoFile && <div className="preview-empty">Upload media to start previewing</div>}
          <video
            ref={mediaRef}
            className="media-source"
            onTimeUpdate={drawFrame}
            onLoadedMetadata={handleLoadedMetadata}
            onLoadedData={drawFrame}
            onError={() => setExportError('The browser could not play this media format.')}
          />
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
              onError={() => setExportError('Unable to load the background video format.')}
            />
          )}
        </div>

        <section className="player-panel">
          <div className="player-controls">
            <button
              className="play-button"
              onClick={togglePlay}
              disabled={isExporting}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <span className="timecode">{formatDuration(currentTime)}</span>
            <input
              className="seek-range"
              type="range"
              min="0"
              max={duration || 1}
              step="0.01"
              value={Math.min(currentTime, duration || 1)}
              onChange={event => {
                if (mediaRef.current) {
                  mediaRef.current.currentTime = Number(event.target.value);
                  drawFrame();
                }
              }}
              disabled={!duration}
              aria-label="Seek media"
            />
            <span className="timecode muted">{formatDuration(duration)}</span>
            <button
              className="volume-button"
              onClick={() => {
                if (mediaRef.current) {
                  mediaRef.current.muted = !mediaRef.current.muted;
                  setVolume(mediaRef.current.muted ? 0 : 1);
                }
              }}
              aria-label="Toggle mute"
            >
              {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <input
              className="volume-range"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={event => {
                const next = Number(event.target.value);
                setVolume(next);
                if (mediaRef.current) {
                  mediaRef.current.volume = next;
                  mediaRef.current.muted = next === 0;
                }
              }}
              aria-label="Volume"
            />
          </div>
          <div className="timeline-toolbar">
            <div className="timeline-toolbar-title">
              <span className="eyebrow accent-eyebrow">Edit timeline</span>
              <strong>{subtitles.length} caption{subtitles.length === 1 ? '' : 's'}</strong>
            </div>
            <div className="timeline-edit-actions" role="toolbar" aria-label="Timeline editing tools">
              <button className="timeline-tool-button" onClick={onUndo} disabled={!canUndo} title="Undo" aria-label="Undo"><Undo2 size={15} /></button>
              <button className="timeline-tool-button" onClick={onRedo} disabled={!canRedo} title="Redo" aria-label="Redo"><Redo2 size={15} /></button>
              <span className="timeline-tool-divider" />
              <button className="timeline-tool-button" onClick={duplicateSelectedCaption} disabled={!selectedSubtitleId || !setSubtitles || !duration} title="Duplicate selected caption" aria-label="Duplicate selected caption"><Copy size={15} /></button>
              <button className="timeline-tool-button" onClick={splitSelectedCaption} disabled={!selectedSubtitleId || !setSubtitles} title="Split selected caption at playhead" aria-label="Split selected caption"><Scissors size={15} /></button>
              <button className="timeline-tool-button danger" onClick={deleteSelectedCaption} disabled={!selectedSubtitleId || !setSubtitles} title="Delete selected caption" aria-label="Delete selected caption"><Trash2 size={15} /></button>
              <button className="timeline-add-button" onClick={addTimelineCaption} disabled={!setSubtitles || !duration}><span>+</span> Add caption</button>
              <span className="timeline-tool-divider" />
              <button className="timeline-tool-button" onClick={() => setTimelineZoom(previous => Math.max(1, previous - 0.25))} disabled={timelineZoom <= 1} title="Zoom out" aria-label="Zoom out timeline"><ZoomOut size={15} /></button>
              <span className="timeline-zoom-value">{Math.round(timelineZoom * 100)}%</span>
              <button className="timeline-tool-button" onClick={() => setTimelineZoom(previous => Math.min(3, previous + 0.25))} disabled={timelineZoom >= 3} title="Zoom in" aria-label="Zoom in timeline"><ZoomIn size={15} /></button>
            </div>
          </div>
          <div
            className="timeline-editor"
            style={{ '--timeline-zoom': timelineZoom } as React.CSSProperties}
            onWheel={handleTimelineZoomWheel}
            aria-label="Timeline. Scroll to zoom. Pinch on a touchpad to zoom."
          >
            <div className="timeline-ruler" style={{ width: `${timelineZoom * 100}%` }} aria-hidden="true">
              {Array.from({ length: Math.max(2, Math.ceil(duration / 5) + 1) }, (_, index) => {
                const time = Math.min(duration, index * 5);
                return <span key={time} style={{ left: `${duration ? (time / duration) * 100 : 0}%` }}>{formatDuration(time)}</span>;
              })}
            </div>
            <div
              className="timeline-track-row caption-track-row"
              style={{ width: `${timelineZoom * 100}%` }}
            >
              <span className="timeline-track-label">Captions</span>
              <div className="timeline-track-content" ref={captionTrackRef} onClick={handleTimelineClick}>
                {subtitles.map(subtitle => {
                  const timing = timelineTimingPreview?.id === subtitle.id ? timelineTimingPreview : subtitle;
                  return (
                    <div
                    key={subtitle.id}
                    className={`timeline-segment ${subtitle.id === selectedSubtitleId ? 'active' : ''}`}
                    style={{
                      left: `${duration ? (timing.start / duration) * 100 : 0}%`,
                      width: `${duration ? ((timing.end - timing.start) / duration) * 100 : 0}%`,
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Caption ${getCaptionText(subtitle.text, language, subtitle.tenglishText)}, ${timing.start.toFixed(2)} to ${timing.end.toFixed(2)} seconds. Drag to move.`}
                    onPointerDown={event => beginTimelineDrag(event, subtitle, 'move')}
                    onPointerMove={handleClipPointerMove}
                    onPointerUp={event => endTimelineDrag(event)}
                    onPointerCancel={event => endTimelineDrag(event, true)}
                    onLostPointerCapture={event => endTimelineDrag(event, true)}
                    onClick={event => event.stopPropagation()}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectSubtitle(subtitle.id);
                        if (mediaRef.current) mediaRef.current.currentTime = subtitle.start;
                      }
                    }}
                    title={`${timing.start.toFixed(2)}s – ${timing.end.toFixed(2)}s · ${getCaptionText(subtitle.text, language, subtitle.tenglishText)}`}
                  >
                    <button type="button" className="timeline-resize-handle start" aria-label={`Resize start of caption ${getCaptionText(subtitle.text, language, subtitle.tenglishText)}`} onPointerDown={event => beginTimelineDrag(event, subtitle, 'start')} onKeyDown={event => nudgeCaptionEdge(event, subtitle, 'start')} onClick={event => event.stopPropagation()} />
                    <span className="timeline-segment-text">{getCaptionText(subtitle.text, language, subtitle.tenglishText)}</span>
                    <button type="button" className="timeline-resize-handle end" aria-label={`Resize end of caption ${getCaptionText(subtitle.text, language, subtitle.tenglishText)}`} onPointerDown={event => beginTimelineDrag(event, subtitle, 'end')} onKeyDown={event => nudgeCaptionEdge(event, subtitle, 'end')} onClick={event => event.stopPropagation()} />
                    </div>
                  );
                })}
                <span className="timeline-progress" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                <span className="timeline-cursor" style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="timeline-track-row media-track-row" style={{ width: `${timelineZoom * 100}%` }}>
              <span className="timeline-track-label">Media</span>
              <div className="timeline-track-content" onClick={handleTimelineClick}>
                <div className="media-timeline-clip" style={{ width: duration ? '100%' : '0%' }}><span>{videoFile?.name || 'Source media'}</span></div>
                <span className="timeline-cursor" style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
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

      {/* RIGHT PANEL */}
      <aside className="style-sidebar">
        <div className="style-sidebar-header">
          <div className="style-sidebar-heading" style={{ marginBottom: '12px' }}>
            <span className="eyebrow accent-eyebrow">Design &amp; Delivery</span>
            <h2>Captions &amp; Background</h2>
            <p>Instant visual templates and synchronized background themes.</p>
          </div>

          {/* SEGMENTED TAB SWITCHER */}
          <div className="style-segmented-tabs" role="tablist" aria-label="Style panels" style={{ marginBottom: '10px' }}>
            <button
              role="tab"
              aria-selected={activeTab === 'templates'}
              className={`style-tab-button ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              <LayoutTemplate size={13} />
              <span>Templates</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'backgrounds'}
              className={`style-tab-button ${activeTab === 'backgrounds' ? 'active' : ''}`}
              onClick={() => setActiveTab('backgrounds')}
            >
              <ImageIcon size={13} />
              <span>Backgrounds</span>
            </button>
          </div>
        </div>

        <div className="style-panel-upper">
          <div className="style-sidebar-scroll">

          {/* TAB 1: CAPTION TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="templates-tab-content">
              <div className="section-subheading">
                <span>Ready-Made Templates</span>
                <small>Click to apply style</small>
              </div>
              <div className="template-grid" role="group" aria-label="Caption templates">
                {CAPTION_TEMPLATES.map(template => {
                  const isSelected = settings.selectedTemplateId === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      className={`template-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleApplyTemplate(template.id)}
                      title={template.description}
                    >
                      <div className="template-card-header">
                        <strong>{template.name}</strong>
                        {template.badge && <span className="template-badge">{template.badge}</span>}
                        {isSelected && <span className="template-selected-icon"><Check size={12} /></span>}
                      </div>
                      {renderTemplateSampleText(template)}
                      <span className="template-desc">{template.description}</span>
                    </button>
                  );
                })}
              </div>
              <button className="secondary-action style-reset" onClick={handleResetStyling}>
                <RotateCcw size={13} /> Reset style to Classic White
              </button>
            </div>
          )}

          {/* TAB 2: BACKGROUND THEMES */}
          {activeTab === 'backgrounds' && (
            <div className="backgrounds-tab-content">
              <div className="section-subheading">
                <span>Background Theme</span>
                <small>{isVideoMedia ? 'Original Video or Theme' : 'Visual themes for audio'}</small>
              </div>
              <div className="background-grid" role="group" aria-label="Background themes">
                {BACKGROUND_THEMES.map(theme => {
                  const isSelected = settings.backgroundTheme === theme.id;
                  const isOriginalVideo = theme.id === 'original-video';
                  const isCustomImage = theme.id === 'custom-image';
                  const isCustomVideo = theme.id === 'custom-video';
                  const isDisabled = (isOriginalVideo && !isVideoMedia) || (isCustomVideo && !settings.customVideoUrl);

                  return (
                    <button
                      key={theme.id}
                      type="button"
                      disabled={isDisabled}
                      className={`background-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                      onClick={() => {
                        if (!isDisabled) {
                          setSettings(prev => ({ ...prev, backgroundTheme: theme.id }));
                        }
                      }}
                      title={isDisabled ? (isOriginalVideo ? 'Original video requires an uploaded video file' : 'Custom video requires uploading a video below') : theme.description}
                    >
                      <div
                        className="background-card-preview"
                        style={{
                          background: isCustomImage && settings.customImageDataUrl
                            ? `url(${settings.customImageDataUrl}) center/cover no-repeat`
                            : theme.previewCss,
                        }}
                      >
                        {isSelected && <span className="background-selected-icon"><Check size={12} /></span>}
                        {isOriginalVideo && <span className="background-type-label">Video</span>}
                        {isCustomVideo && <span className="background-type-label">Video</span>}
                      </div>
                      <div className="background-card-info">
                        <strong>{theme.name}</strong>
                        <small>{isDisabled ? (isOriginalVideo ? 'Video only' : 'Upload video below') : theme.description}</small>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* CUSTOM IMAGE & VIDEO UPLOADS */}
              <div className="custom-image-uploader">
                <label htmlFor="custom-bg-input" className="secondary-action custom-upload-btn">
                  <Upload size={13} />
                  <span>Upload custom background image</span>
                </label>
                <input
                  id="custom-bg-input"
                  type="file"
                  accept="image/*"
                  className="visually-hidden"
                  onChange={handleCustomImageFileChange}
                />
                {settings.customImageDataUrl && (
                  <button
                    type="button"
                    className="ghost-button remove-custom-image"
                    onClick={() => setSettings(prev => ({ ...prev, customImageDataUrl: undefined, backgroundTheme: isVideoMedia ? 'original-video' : 'midnight' }))}
                  >
                    <X size={12} /> Clear custom image
                  </button>
                )}

                <label htmlFor="custom-video-bg-input" className="secondary-action custom-upload-btn" style={{ marginTop: '7px' }}>
                  <Upload size={13} />
                  <span>Upload custom background video</span>
                </label>
                <input
                  id="custom-video-bg-input"
                  type="file"
                  accept="video/*,.mp4,.mov,.webm,.mkv"
                  className="visually-hidden"
                  onChange={handleCustomVideoFileChange}
                />
                {settings.customVideoUrl && (
                  <button
                    type="button"
                    className="ghost-button remove-custom-image"
                    onClick={handleClearCustomVideo}
                  >
                    <X size={12} /> Clear custom video
                  </button>
                )}
              </div>

              {/* DARKENING OVERLAY & FIT MODE */}
              <div className="background-adjustments">
                <label className="adjustment-field">
                  <div className="adjustment-label">
                    <span>Caption Readability Overlay</span>
                    <strong>{Math.round((settings.backgroundOverlayOpacity ?? 0) * 100)}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.85"
                    step="0.05"
                    value={settings.backgroundOverlayOpacity ?? 0}
                    onChange={e => setAppearance('backgroundOverlayOpacity', Number(e.target.value))}
                  />
                </label>

                <label className="adjustment-field">
                  <div className="adjustment-label">
                    <span>Background Fit Mode</span>
                    <strong>{settings.fitMode === 'cover' ? 'Fill (Cover)' : 'Fit (Contain)'}</strong>
                  </div>
                  <div className="language-pills fit-mode-pills">
                    <button
                      type="button"
                      className={settings.fitMode === 'cover' ? 'active' : ''}
                      onClick={() => setAppearance('fitMode', 'cover')}
                    >
                      Cover
                    </button>
                    <button
                      type="button"
                      className={settings.fitMode === 'contain' ? 'active' : ''}
                      onClick={() => setAppearance('fitMode', 'contain')}
                    >
                      Contain
                    </button>
                  </div>
                </label>
              </div>
            </div>
          )}

          </div>{/* end .style-sidebar-scroll */}

          {/* ADVANCED STYLE SETTINGS — always visible in the lower panel */}
          <div className="advanced-panel">
            <div className="advanced-panel-header">
              <div>
                <span className="eyebrow accent-eyebrow">Advanced</span>
                <strong>Fine-tune your design</strong>
              </div>
              <Sliders size={15} />
            </div>
            <div className="advanced-panel-scroll">
              <div className="section-subheading">
                <span>Fine-Tune Typography</span>
                <small>Custom overrides</small>
              </div>
              <div className="appearance-grid">
                <label>
                  Style
                  <select
                    value={settings.style}
                    onChange={event => setAppearance('style', event.target.value as CanvasSettings['style'])}
                  >
                    <option value="outline">Bold outline</option>
                    <option value="kinetic">Word glow / highlight</option>
                    <option value="box">Box card</option>
                    <option value="minimalist">Minimal clean</option>
                  </select>
                </label>
                <label>
                  Font
                  <select
                    value={settings.fontFamily}
                    onChange={event => setAppearance('fontFamily', event.target.value)}
                  >
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="'Noto Sans Telugu', sans-serif">Noto Sans Telugu</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Courier New', monospace">Mono</option>
                  </select>
                </label>
                <label>
                  Size
                  <div className="range-field">
                    <input
                      type="range"
                      min="24"
                      max="100"
                      step="1"
                      value={settings.fontSize}
                      onChange={event => setAppearance('fontSize', Number(event.target.value))}
                    />
                    <output>{settings.fontSize}px</output>
                  </div>
                </label>
                <label>
                  Position
                  <select
                    value={settings.verticalPosition}
                    onChange={event => setAppearance('verticalPosition', Number(event.target.value))}
                  >
                    <option value="0.2">Top</option>
                    <option value="0.5">Center</option>
                    <option value="0.78">Lower third</option>
                    <option value="0.88">Cinematic bottom</option>
                  </select>
                </label>
                <label>
                  Alignment
                  <select
                    value={settings.alignment}
                    onChange={event => setAppearance('alignment', event.target.value as CanvasSettings['alignment'])}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
                <label className="color-field">
                  Text color
                  <input
                    type="color"
                    value={settings.textColor.startsWith('#') ? settings.textColor : '#ffffff'}
                    onChange={event => setAppearance('textColor', event.target.value)}
                  />
                </label>
                <label className="color-field">
                  Highlight
                  <input
                    type="color"
                    value={settings.highlightColor.startsWith('#') ? settings.highlightColor : '#8b5cf6'}
                    onChange={event => setAppearance('highlightColor', event.target.value)}
                  />
                </label>
                <label className="color-field">
                  Text background
                  <input
                    type="color"
                    value={settings.boxColor.startsWith('#') ? settings.boxColor : '#000000'}
                    onChange={event => setAppearance('boxColor', event.target.value)}
                  />
                </label>
                <label className="switch-row">
                  <input
                    type="checkbox"
                    checked={settings.textBackground}
                    onChange={event => setAppearance('textBackground', event.target.checked)}
                  />
                  <span>Enable text background box</span>
                </label>
              </div>

              <div className="section-subheading" style={{ marginTop: '16px' }}>
                <span>Hook generator</span>
                <small>3-5 project-aware options</small>
              </div>
              <div className="appearance-grid">
                <label>
                  Hook text
                  <input
                    value={settings.hookOverlay?.text ?? ''}
                    onChange={event => setSettings(previous => ({
                      ...previous,
                      hookOverlay: {
                        ...(previous.hookOverlay ?? createDefaultHookOverlay()),
                        text: event.target.value,
                        enabled: Boolean(event.target.value),
                      },
                    }))}
                    placeholder="e.g. This AI trick saves hours"
                  />
                </label>
                <label className="switch-row">
                  <input
                    type="checkbox"
                    checked={!!settings.hookOverlay?.enabled}
                    onChange={event => setSettings(previous => ({
                      ...previous,
                      hookOverlay: {
                        ...(previous.hookOverlay ?? createDefaultHookOverlay()),
                        text: previous.hookOverlay?.text ?? '',
                        enabled: event.target.checked,
                      },
                    }))}
                  />
                  <span>Show hook overlay</span>
                </label>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => {
                    const suggestions = generateHookSuggestions(subtitles, language);
                    const next = suggestions[0];
                    if (!next) return;
                    setSettings(previous => ({
                      ...previous,
                      hookOverlay: {
                        ...(previous.hookOverlay ?? createDefaultHookOverlay()),
                        text: next.title,
                        enabled: true,
                      },
                    }));
                  }}
                >
                  Generate hook ideas
                </button>
              </div>

              <div className="section-subheading" style={{ marginTop: '16px' }}>
                <span>Safe zones</span>
                <small>Instagram / YouTube / TikTok guides</small>
              </div>
              <div className="appearance-grid">
                <label>
                  Platform
                  <select
                    value={settings.safeZones?.platform ?? 'instagram'}
                    onChange={event => setSettings(previous => ({
                      ...previous,
                      safeZones: { platform: event.target.value as 'instagram' | 'youtube' | 'tiktok', show: previous.safeZones?.show ?? false },
                    }))}
                  >
                    <option value="instagram">Instagram Reels</option>
                    <option value="youtube">YouTube Shorts</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </label>
                <label className="switch-row">
                  <input
                    type="checkbox"
                    checked={!!settings.safeZones?.show}
                    onChange={event => setSettings(previous => ({
                      ...previous,
                      safeZones: { ...(previous.safeZones ?? { platform: 'instagram' }), show: event.target.checked },
                    }))}
                  />
                  <span>Show safe zones</span>
                </label>
                <div className="section-help" style={{ marginTop: '-4px' }}>
                  {settings.safeZones?.show && isSafeZoneWarning({ x: 0.14, y: 0.18, width: 0.72, height: 0.3 }, settings.safeZones.platform, settings.aspectRatio)
                    ? 'Warning: caption placement overlaps an interface region for this platform.'
                    : 'Caption and hook placement remains inside the safe area.'}
                </div>
              </div>

              <div className="section-subheading" style={{ marginTop: '16px' }}>
                <span>Background music</span>
                <small>Simple ducking control</small>
              </div>
              <div className="appearance-grid">
                <label className="switch-row">
                  <input
                    type="checkbox"
                    checked={!!settings.backgroundMusic?.enabled}
                    onChange={event => setSettings(previous => ({
                      ...previous,
                      backgroundMusic: {
                        enabled: event.target.checked,
                        volume: previous.backgroundMusic?.volume ?? 0.45,
                        muted: previous.backgroundMusic?.muted ?? false,
                        fadeIn: previous.backgroundMusic?.fadeIn ?? 0.6,
                        fadeOut: previous.backgroundMusic?.fadeOut ?? 0.7,
                        startOffset: previous.backgroundMusic?.startOffset ?? 0,
                        looping: previous.backgroundMusic?.looping ?? true,
                        duckingEnabled: previous.backgroundMusic?.duckingEnabled ?? true,
                        duckingRatio: previous.backgroundMusic?.duckingRatio ?? 0.3,
                        attack: previous.backgroundMusic?.attack ?? 0.12,
                        release: previous.backgroundMusic?.release ?? 0.18,
                      },
                    }))}
                  />
                  <span>Enable background music</span>
                </label>
                <label>
                  Music level
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.backgroundMusic?.volume ?? 0.45}
                    onChange={event => setSettings(previous => ({
                      ...previous,
                      backgroundMusic: {
                        enabled: previous.backgroundMusic?.enabled ?? false,
                        volume: Number(event.target.value),
                        muted: previous.backgroundMusic?.muted ?? false,
                        fadeIn: previous.backgroundMusic?.fadeIn ?? 0.6,
                        fadeOut: previous.backgroundMusic?.fadeOut ?? 0.7,
                        startOffset: previous.backgroundMusic?.startOffset ?? 0,
                        looping: previous.backgroundMusic?.looping ?? true,
                        duckingEnabled: previous.backgroundMusic?.duckingEnabled ?? true,
                        duckingRatio: previous.backgroundMusic?.duckingRatio ?? 0.3,
                        attack: previous.backgroundMusic?.attack ?? 0.12,
                        release: previous.backgroundMusic?.release ?? 0.18,
                      },
                    }))}
                  />
                </label>
                <label className="switch-row">
                  <input
                    type="checkbox"
                    checked={!!settings.backgroundMusic?.duckingEnabled}
                    onChange={event => setSettings(previous => ({
                      ...previous,
                      backgroundMusic: {
                        enabled: previous.backgroundMusic?.enabled ?? false,
                        volume: previous.backgroundMusic?.volume ?? 0.45,
                        muted: previous.backgroundMusic?.muted ?? false,
                        fadeIn: previous.backgroundMusic?.fadeIn ?? 0.6,
                        fadeOut: previous.backgroundMusic?.fadeOut ?? 0.7,
                        startOffset: previous.backgroundMusic?.startOffset ?? 0,
                        looping: previous.backgroundMusic?.looping ?? true,
                        duckingEnabled: event.target.checked,
                        duckingRatio: previous.backgroundMusic?.duckingRatio ?? 0.3,
                        attack: previous.backgroundMusic?.attack ?? 0.12,
                        release: previous.backgroundMusic?.release ?? 0.18,
                      },
                    }))}
                  />
                  <span>Speech-aware ducking</span>
                </label>
              </div>

              <button className="secondary-action style-reset" onClick={handleResetStyling}>
                <RotateCcw size={13} /> Reset styling
              </button>
            </div>
            </div>
          </div>

        {/* BOTTOM EXPORT SECTION — pinned footer, never scrolls */}
        <div className="style-sidebar-footer">
          <button
            className="primary-action export-action-btn"
            onClick={() => {
              setExportError('');
              setExportComplete(false);
              setIsExportPanelOpen(true);
            }}
            disabled={!duration || isExporting}
          >
            <Download size={15} /> Export Video &amp; Captions
          </button>
          <div className="quick-export-row">
            <button className="ghost-button" onClick={handleExportFrame} title="Export current preview frame as PNG">
              <FileImage size={13} /> Frame PNG
            </button>
            <button className="ghost-button" onClick={handleExportSrt} disabled={!subtitles.length} title="Export SRT subtitles">
              <FileText size={13} /> SRT
            </button>
            <button className="ghost-button" onClick={handleExportVtt} disabled={!subtitles.length} title="Export VTT captions">
              <FileText size={13} /> VTT
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
