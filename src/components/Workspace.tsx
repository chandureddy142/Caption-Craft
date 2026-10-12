import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasSettings, Subtitle, CaptionLanguage } from '../types';
import { getSubtitleCanvasLayout, renderSubtitlesToCanvas } from '../utils/SubtitleRenderer';
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
  Download,
  FileImage,
  FileText,
  Image as ImageIcon,
  LayoutTemplate,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ExportModal } from './ExportModal';
import { downloadStringAsFile, exportToSRT, exportToVTT } from '../utils/exporter';
import { getSupportedWebmMimeType } from '../utils/exportCapabilities';

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRef = useRef<HTMLVideoElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const customImageRef = useRef<HTMLImageElement | null>(null);

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

  const animationRef = useRef<number | undefined>(undefined);
  const drawFrameRef = useRef<() => void>(() => undefined);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const exportCancelledRef = useRef(false);

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

  const outputDimensions: Record<CanvasSettings['aspectRatio'], { width: number; height: number }> = {
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 },
    '1:1': { width: 1080, height: 1080 },
    '4:5': { width: 1080, height: 1350 },
  };
  const canExportWebm = getSupportedWebmMimeType(true) !== null || getSupportedWebmMimeType(false) !== null;

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

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const media = mediaRef.current;
    if (!canvas || !media) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw background theme or video frames
    drawBackgroundToCanvas(ctx, {
      themeId: settings.backgroundTheme,
      width: canvas.width,
      height: canvas.height,
      videoElement: media,
      isVideoMedia,
      customImage: customImageRef.current,
      overlayOpacity: settings.backgroundOverlayOpacity,
      fitMode: settings.fitMode,
    });

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
        if (isExporting && mediaRecorderRef.current) {
          setExportProgress(100);
          mediaRecorderRef.current.stop();
        }
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
    setDraftText(getCaptionText(subtitle.text, language, subtitle.tenglishText));
    setEditingSubtitleId(subtitle.id);
  };

  const saveInlineEdit = () => {
    if (!editingSubtitleId) return;
    setSubtitles?.(prev => prev.map(subtitle => {
      if (subtitle.id !== editingSubtitleId) return subtitle;
      if (language === 'tenglish') return { ...subtitle, tenglishText: draftText };
      return { ...subtitle, text: draftText, tenglishText: language === 'te' ? undefined : subtitle.tenglishText };
    }));
    setEditingSubtitleId(null);
  };

  const cancelInlineEdit = () => {
    setEditingSubtitleId(null);
    setDraftText('');
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingSubtitleId) return;
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
    if (editingSubtitleId) return;
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
    const areaRect = canvasAreaRef.current.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    return {
      position: 'absolute',
      left: canvasRect.left - areaRect.left + layout.left * scaleX,
      top: canvasRect.top - areaRect.top + (layout.y - layout.height / 2) * scaleY,
      width: Math.max(180, layout.width * scaleX),
      minHeight: Math.max(48, layout.height * scaleY),
      zIndex: 2,
    };
  }, [currentTime, editingSubtitleId, language, settings, subtitles]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setInlineEditorStyle(calculateInlineEditorStyle());
    });
    return () => cancelAnimationFrame(frameId);
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
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      setIsExporting(false);
      setExportError('Export cancelled.');
    }
  };

  const handleExportVideo = () => {
    const canvas = canvasRef.current;
    const media = mediaRef.current;
    if (!canvas || !media) {
      setExportError('Preview is not ready for a video export.');
      return;
    }
    if (!('MediaRecorder' in window) || typeof canvas.captureStream !== 'function') {
      setExportError('This browser does not support WebM canvas recording.');
      return;
    }

    setIsExporting(true);
    setExportError('');
    setExportComplete(false);
    setExportProgress(0);
    exportCancelledRef.current = false;
    chunksRef.current = [];

    const canvasStream = canvas.captureStream(30);
    const mediaStream = getMediaCaptureStream(media);
    const audioTracks = mediaStream?.getAudioTracks() ?? [];
    const videoTracks = canvasStream.getVideoTracks();
    if (videoTracks.length === 0) {
      stopStreamTracks(canvasStream);
      setIsExporting(false);
      setExportError('This browser did not provide a video track for WebM export.');
      return;
    }
    const mimeType = getSupportedWebmMimeType(audioTracks.length > 0);
    if (!mimeType) {
      stopStreamTracks(canvasStream);
      stopStreamTracks(mediaStream);
      setIsExporting(false);
      setExportError('No supported WebM export format is available in this browser.');
      return;
    }
    const combinedStream = new MediaStream([
      ...videoTracks,
      ...(audioTracks.length > 0 ? audioTracks : []),
    ]);

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(combinedStream, { mimeType });
    } catch (error) {
      setIsExporting(false);
      setExportError(error instanceof Error ? error.message : 'Unable to start WebM export.');
      stopStreamTracks(canvasStream);
      stopStreamTracks(mediaStream);
      return;
    }

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      if (!exportCancelledRef.current) {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.webm';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        setExportComplete(true);
        setExportProgress(100);
      } else {
        setExportError('Export cancelled.');
      }
      stopStreamTracks(canvasStream);
      stopStreamTracks(mediaStream);
      mediaRecorderRef.current = null;
      setIsExporting(false);
    };

    recorder.onerror = () => {
      setIsExporting(false);
      setExportError('The browser stopped the WebM export unexpectedly.');
      stopStreamTracks(canvasStream);
      stopStreamTracks(mediaStream);
      mediaRecorderRef.current = null;
    };

    mediaRecorderRef.current = recorder;

    media.currentTime = 0;
    try {
      recorder.start();
    } catch (error) {
      setIsExporting(false);
      setExportError(error instanceof Error ? error.message : 'Unable to start WebM recording.');
      stopStreamTracks(canvasStream);
      stopStreamTracks(mediaStream);
      return;
    }
    void media.play().then(() => {
      setIsPlaying(true);
      drawFrame();
    }).catch(error => {
      exportCancelledRef.current = true;
      recorder.stop();
      setIsPlaying(false);
      setExportError(error instanceof Error ? error.message : 'Unable to play media for export.');
    });
  };

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mediaRef.current || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nextTime = Math.max(0, Math.min(duration, ((event.clientX - rect.left) / rect.width) * duration));
    mediaRef.current.currentTime = nextTime;
    drawFrame();
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

  const ratioOptions: Array<{ value: CanvasSettings['aspectRatio']; label: string; detail: string }> = [
    { value: '9:16', label: '9:16', detail: 'Reels' },
    { value: '16:9', label: '16:9', detail: 'YouTube' },
    { value: '1:1', label: '1:1', detail: 'Square' },
    { value: '4:5', label: '4:5', detail: 'Portrait' },
  ];

  const setAppearance = <K extends keyof CanvasSettings>(key: K, value: CanvasSettings[K]) => {
    setSettings(previous => ({ ...previous, [key]: value }));
  };

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

    const words = sample.split(' ');
    const firstWord = words[0];
    const restWords = words.slice(1).join(' ');

    return (
      <div
        className="template-card-preview"
        style={{
          fontFamily: ts.fontFamily || "'Inter', sans-serif",
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
            <h1>{videoFile?.name || 'Caption preview'}</h1>
            <span className="workspace-duration">
              {duration ? `${formatDuration(duration)} timeline` : 'Loading media metadata'}
            </span>
          </div>
          <div className="workspace-header-actions">
            <button className="ghost-button workspace-back" onClick={onBackToUpload}>
              <X size={15} /> Replace media
            </button>
            <button
              className="export-trigger"
              onClick={() => {
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

        <div className="ratio-toolbar">
          <span className="toolbar-label">Canvas</span>
          {ratioOptions.map(option => (
            <button
              key={option.value}
              className={`ratio-button ${settings.aspectRatio === option.value ? 'active' : ''}`}
              onClick={() => setSettings(previous => ({ ...previous, aspectRatio: option.value }))}
            >
              <strong>{option.label}</strong>
              <small>{option.detail}</small>
            </button>
          ))}
          <span className="toolbar-spacer" />
          <span className="preview-hint">Click a caption to select · double-click to edit</span>
        </div>

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
              <div
                style={{
                  ...inlineEditorStyle,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  pointerEvents: 'auto',
                }}
                onClick={event => event.stopPropagation()}
              >
                <textarea
                  autoFocus
                  value={draftText}
                  onChange={event => setDraftText(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      cancelInlineEdit();
                    } else if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      saveInlineEdit();
                    }
                  }}
                  aria-label="Edit caption text"
                />
                <div className="inline-edit-actions">
                  <button className="primary-action" onClick={saveInlineEdit}>Save</button>
                  <button className="secondary-action" onClick={cancelInlineEdit}>Cancel</button>
                </div>
              </div>
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
        </div>

        <section className="player-panel">
          <div className="timeline-header">
            <span>Timeline</span>
            <span>{subtitles.length} caption{subtitles.length === 1 ? '' : 's'}</span>
          </div>
          <div
            className="preview-timeline"
            onClick={handleTimelineClick}
            role="slider"
            aria-label="Media timeline"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
            tabIndex={0}
          >
            {subtitles.map(subtitle => (
              <span
                key={subtitle.id}
                className={`timeline-segment ${subtitle.id === selectedSubtitleId ? 'active' : ''}`}
                style={{
                  left: `${duration ? (subtitle.start / duration) * 100 : 0}%`,
                  width: `${duration ? Math.max(0.6, ((subtitle.end - subtitle.start) / duration) * 100) : 0}%`,
                }}
              />
            ))}
            <span
              className="timeline-progress"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
            <span
              className="timeline-cursor"
              style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
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
        </section>

        {exportError && <div className="workspace-error" role="alert">{exportError}</div>}
        <ExportModal
          open={isExportPanelOpen}
          aspectRatio={settings.aspectRatio}
          outputWidth={outputDimensions[settings.aspectRatio].width}
          outputHeight={outputDimensions[settings.aspectRatio].height}
          canExportWebm={canExportWebm}
          isExporting={isExporting}
          exportProgress={exportProgress}
          exportError={exportError}
          exportComplete={exportComplete}
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
        <div className="style-sidebar-heading">
          <span className="eyebrow accent-eyebrow">Design &amp; Delivery</span>
          <h2>Captions &amp; Background</h2>
          <p>Instant visual templates and synchronized background themes.</p>
        </div>

        {/* SEGMENTED TAB SWITCHER */}
        <div className="style-segmented-tabs" role="tablist" aria-label="Style panels">
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
          <button
            role="tab"
            aria-selected={activeTab === 'advanced'}
            className={`style-tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            <Sliders size={13} />
            <span>Advanced</span>
          </button>
        </div>

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
                const isDisabled = isOriginalVideo && !isVideoMedia;

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
                    title={isDisabled ? 'Original video requires an uploaded video file' : theme.description}
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
                    </div>
                    <div className="background-card-info">
                      <strong>{theme.name}</strong>
                      <small>{isDisabled ? 'Video only' : theme.description}</small>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CUSTOM IMAGE UPLOAD */}
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

        {/* TAB 3: ADVANCED STYLE SETTINGS */}
        {activeTab === 'advanced' && (
          <div className="advanced-tab-content">
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
            <button className="secondary-action style-reset" onClick={handleResetStyling}>
              <RotateCcw size={13} /> Reset styling
            </button>
          </div>
        )}

        {/* BOTTOM EXPORT SECTION */}
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
