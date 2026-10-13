import { CheckCircle2, Download, FileText, Film, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AspectRatio, CaptionLanguage, ExportResolutionPreset, Subtitle } from '../types';
import { EXPORT_RESOLUTION_PRESETS, getExportDimensions } from '../utils/exportCapabilities';
import {
  downloadBlob,
  downloadSubtitleFile,
  BROWSER_EXPORT_LIMITATION,
  getExportFormatAvailability,
  normalizeExportFilename,
  type ExportFormat,
  type ExportOptions,
  type RenderExport,
} from '../utils/exportPage';

export type ExportPageStatus = 'idle' | 'rendering' | 'success' | 'error';

export interface ExportPageProps {
  aspectRatio: AspectRatio;
  subtitles: Subtitle[];
  language: CaptionLanguage;
  duration?: number;
  renderExport?: RenderExport;
  /** Override browser probing when rendering is provided by a server or custom exporter. */
  formatSupport?: Partial<Record<ExportFormat, boolean>>;
  initialFilename?: string;
  onBack?: () => void;
}

const resolutions: ExportResolutionPreset[] = ['720p', '1080p', '2K', '4K'];
const frameRates = [24, 30, 60];
const aspectRatios: Array<{ value: AspectRatio; label: string }> = [
  { value: '16:9', label: '16:9 · Landscape' },
  { value: '9:16', label: '9:16 · Portrait' },
  { value: '1:1', label: '1:1 · Square' },
  { value: '4:5', label: '4:5 · Portrait' },
];

export function ExportPage({
  aspectRatio,
  subtitles,
  language,
  duration = 0,
  renderExport,
  formatSupport,
  initialFilename = 'caption-export',
  onBack,
}: ExportPageProps) {
  const [resolution, setResolution] = useState<ExportResolutionPreset>('1080p');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(aspectRatio);
  const [frameRate, setFrameRate] = useState(30);
  const [format, setFormat] = useState<ExportFormat>('webm');
  const [includeAudio, setIncludeAudio] = useState(true);
  const [filename, setFilename] = useState(initialFilename);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ExportPageStatus>('idle');
  const [error, setError] = useState('');
  const controllerRef = useRef<AbortController | null>(null);
  const filenameEditedRef = useRef(false);

  const availability = useMemo(() => getExportFormatAvailability(format, includeAudio), [format, includeAudio]);
  const formatSupported = formatSupport?.[format] ?? availability.supported;
  const dimensions = getExportDimensions(resolution, selectedAspectRatio);
  const busy = status === 'rendering';

  useEffect(() => {
    if (!filenameEditedRef.current) setFilename(initialFilename);
  }, [initialFilename]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const options: ExportOptions = {
    resolution,
    frameRate,
    format,
    includeAudio,
    filename: normalizeExportFilename(filename, format),
    aspectRatio: selectedAspectRatio,
  };

  const handleRender = async () => {
    if (!renderExport) {
      setError('No video renderer is connected. Open the editor export action to render this project.');
      setStatus('error');
      return;
    }
    if (!formatSupported) {
      setError(availability.message ?? `${format.toUpperCase()} export is not supported.`);
      setStatus('error');
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('rendering');
    setError('');
    setProgress(0);
    try {
      const blob = await renderExport(options, value => setProgress(Math.max(0, Math.min(100, value))), controller.signal);
      if (controller.signal.aborted) return;
      downloadBlob(blob, options.filename);
      setProgress(100);
      setStatus('success');
    } catch (renderError) {
      if (controller.signal.aborted) return;
      setError(renderError instanceof Error ? renderError.message : 'Video rendering failed.');
      setStatus('error');
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  const cancel = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus('idle');
    setProgress(0);
  };

  return (
    <main className="export-page" aria-labelledby="export-page-title">
      <header className="export-page-header">
        <div><span className="eyebrow accent-eyebrow">Final delivery</span><h1 id="export-page-title">Export project</h1><p>Render captions at the selected quality, then download subtitle files separately.</p></div>
        {onBack && <button className="text-button" type="button" onClick={onBack} disabled={busy}>Back to editor</button>}
      </header>
      <section className="export-resolution-section" aria-label="Video settings">
        <label>Resolution<select value={resolution} onChange={event => setResolution(event.target.value as ExportResolutionPreset)} disabled={busy}>{resolutions.map(value => <option key={value} value={value}>{EXPORT_RESOLUTION_PRESETS[value].label}</option>)}</select></label>
        <label>Aspect ratio<select value={selectedAspectRatio} onChange={event => setSelectedAspectRatio(event.target.value as AspectRatio)} disabled={busy}>{aspectRatios.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label>Frame rate<select value={frameRate} onChange={event => setFrameRate(Number(event.target.value))} disabled={busy}>{frameRates.map(value => <option key={value} value={value}>{value} fps</option>)}</select></label>
       <label>Format<select value={format} onChange={event => setFormat(event.target.value as ExportFormat)} disabled={busy}><option value="webm">WebM · browser capture</option><option value="mp4">MP4 · H.264 x264</option><option value="mkv">MKV · H.264 x264</option><option value="mov">MOV · H.264 x264</option></select></label>
        <label>Filename<input value={filename} onChange={event => { filenameEditedRef.current = true; setFilename(event.target.value); }} disabled={busy} aria-label="Export filename" /></label>
        <label className="export-audio-toggle"><input type="checkbox" checked={includeAudio} onChange={event => setIncludeAudio(event.target.checked)} disabled={busy} /> Include audio</label>
        <p className="export-summary">Output: {dimensions.width} × {dimensions.height} · {duration > 0 ? `${duration.toFixed(1)}s` : 'duration follows source'} </p>
      </section>
      {format === 'mp4' && <p className="section-help export-capability-note">{BROWSER_EXPORT_LIMITATION}</p>}
      {!formatSupported && <p className="inline-error" role="status"><XCircle size={17} /> {availability.message ?? `${format.toUpperCase()} export is unavailable.`}</p>}
      {status === 'error' && <p className="inline-error" role="alert"><XCircle size={17} /> {error}</p>}
      {status === 'success' && <p className="inline-success" role="status"><CheckCircle2 size={17} /> Video downloaded successfully.</p>}
      {busy && <div className="export-progress" aria-live="polite"><div className="progress-label"><span>Rendering {options.filename}</span><strong>{Math.round(progress)}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><button className="ghost-button" type="button" onClick={cancel}>Cancel render</button></div>}
      <div className="export-options">
        <button className="export-option primary" type="button" onClick={() => void handleRender()} disabled={busy || !formatSupported}><Film size={20} /><span><strong>{busy ? 'Rendering…' : 'Render video'}</strong><small>{format.toUpperCase()} · {EXPORT_RESOLUTION_PRESETS[resolution].label} · {includeAudio ? 'audio included' : 'silent'}</small></span><Download size={16} /></button>
        <div className="export-option-grid">
          <button className="export-option" type="button" onClick={() => downloadSubtitleFile(subtitles, language, 'srt')} disabled={busy || subtitles.length === 0}><FileText size={18} /><span><strong>Download SRT</strong><small>Subtitle interchange</small></span></button>
          <button className="export-option" type="button" onClick={() => downloadSubtitleFile(subtitles, language, 'vtt')} disabled={busy || subtitles.length === 0}><FileText size={18} /><span><strong>Download VTT</strong><small>Web captions</small></span></button>
        </div>
      </div>
    </main>
  );
}
