import React, { useMemo } from 'react';
import type { CaptionLanguage, SourceLanguage, Subtitle } from '../types';
import { AlertCircle, Download, FileText, RefreshCw, Upload, X } from 'lucide-react';
import { exportToSRT, exportToVTT, downloadStringAsFile } from '../utils/exporter';

interface SidebarProps {
  onFileUpload: (file: File) => void;
  isTranscribing: boolean;
  transcriptionStatus: string;
  transcriptionProgress: number;
  transcriptionProcessedDuration?: number;
  transcriptionTotalDuration?: number;
  transcriptionError?: string;
  modelStatus?: 'idle' | 'loading' | 'ready' | 'error';
  modelProgress?: number;
  onGenerateCaptions?: () => void;
  onRetryTranscription?: () => void;
  onCancelTranscription?: () => void;
  subtitles: Subtitle[];
  setSubtitles: React.Dispatch<React.SetStateAction<Subtitle[]>>;
  sourceLanguage: SourceLanguage;
  setSourceLanguage: (language: SourceLanguage) => void;
  language: CaptionLanguage;
  setLanguage: (lang: CaptionLanguage) => void;
  onBackToUpload: () => void;
  onJumpToTime: (time: number) => void;
  mediaDuration?: number;
  mediaFile?: File | null;
  onReplaceMedia?: () => void;
  selectedSubtitleId?: string | null;
  onSelectSubtitle?: (id: string | null) => void;
  whisperModel?: 'tiny' | 'base';
  onSelectWhisperModel?: (model: 'tiny' | 'base') => void;
  /** Active transcription backend. */
  transcriptionBackend?: 'gemini' | 'local';
  /** Switch between CaptionCraft AI and local Whisper. */
  onSelectBackend?: (backend: 'gemini' | 'local') => void;
  /** True when VITE_GEMINI_API_KEY is absent/placeholder. */
  geminiKeyMissing?: boolean;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onFileUpload,
  isTranscribing,
  transcriptionStatus,
  transcriptionProgress,
  transcriptionProcessedDuration = 0,
  transcriptionTotalDuration = 0,
  transcriptionError = '',
  modelStatus = 'idle',
  modelProgress = 0,
  onGenerateCaptions,
  onRetryTranscription,
  onCancelTranscription,
  subtitles,
  sourceLanguage,
  setSourceLanguage,
  language,
  setLanguage,
  onBackToUpload,
  mediaDuration = 0,
  mediaFile = null,
  onReplaceMedia,
  selectedSubtitleId = null,
  whisperModel = 'tiny',
  onSelectWhisperModel,
  transcriptionBackend = 'gemini',
  onSelectBackend,
  geminiKeyMissing = false,
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onFileUpload(file);
  };

  const coverage = useMemo(() => {
    const sorted = [...subtitles].sort((left, right) => left.start - right.start);
    const duration = mediaDuration || (sorted.length ? Math.max(sorted[sorted.length - 1].end, 0.1) : 0);
    let previousEnd = 0;
    let covered = 0;
    let gaps = 0;
    sorted.forEach(subtitle => {
      if (subtitle.start > previousEnd + 0.01) gaps += 1;
      const end = Math.min(duration || subtitle.end, subtitle.end);
      covered += Math.max(0, end - Math.max(previousEnd, subtitle.start));
      previousEnd = Math.max(previousEnd, end);
    });
    if (duration > previousEnd + 0.01) gaps += 1;
    return { sorted, duration, covered, gaps };
  }, [mediaDuration, subtitles]);

  const exportSrt = () => downloadStringAsFile(exportToSRT(subtitles, language), 'captions.srt');
  const exportVtt = () => downloadStringAsFile(exportToVTT(subtitles, language), 'captions.vtt');

  return (
    <aside className="control-sidebar">
      <div className="sidebar-brand-row">
        <div className="brand-lockup compact"><div className="brand-mark">CC</div><span className="brand-name">CaptionCraft</span></div>
        <button className="ghost-button" onClick={onBackToUpload}>← Back to Upload</button>
      </div>

      <div className="media-summary">
        <div className="media-summary-icon"><FileText size={17} /></div>
        <div className="media-summary-copy"><strong>{mediaFile?.name || 'Untitled project'}</strong><span>{mediaFile ? `${formatBytes(mediaFile.size)} · ${formatDuration(mediaDuration)}` : 'No media selected'}</span></div>
        <label className="icon-button" title="Replace media" htmlFor="editor-media-upload"><Upload size={15} /></label>
        {onReplaceMedia && <button className="icon-button danger" onClick={onReplaceMedia} title="Remove media"><X size={15} /></button>}
        <input id="editor-media-upload" className="visually-hidden" type="file" accept="audio/*,video/*,.mkv,.ogg" onChange={handleFileChange} />
      </div>

      <section className="sidebar-section">
        <div className="section-heading"><div><span className="section-kicker">01</span><h2>Source language</h2></div></div>
        <div className="language-pills source-language-pills" role="group" aria-label="Source language">
          <button className={sourceLanguage === 'en' ? 'active' : ''} onClick={() => setSourceLanguage('en')} disabled={isTranscribing}>English</button>
          <button className={sourceLanguage === 'te' ? 'active' : ''} onClick={() => setSourceLanguage('te')} disabled={isTranscribing}>తెలుగు</button>
        </div>
        <p className="section-help">Whisper receives the selected source language. No translation is performed.</p>
      </section>

      <section className="sidebar-section">
        <div className="section-heading"><div><span className="section-kicker">02</span><h2>Output format</h2></div></div>
        <div className="language-pills output-language-pills" role="group" aria-label="Caption output format">
          {sourceLanguage === 'te' ? <>
            <button type="button" className={language === 'te' ? 'active' : ''} onClick={() => setLanguage('te')} disabled={isTranscribing} title="Display recognized speech in Telugu script">తెలుగు</button>
            <button type="button" className={language === 'tenglish' ? 'active' : ''} onClick={() => setLanguage('tenglish')} disabled={isTranscribing} title="Display natural Roman-script transliteration (Tenglish)">Tenglish</button>
          </> : (
            <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')} disabled={isTranscribing} title="Display English speech in English">English</button>
          )}
        </div>
        <p className="section-help">
          {language === 'tenglish'
            ? 'Tenglish displays natural Roman-script transliteration without translation.'
            : language === 'te'
              ? 'Telugu displays recognized speech in Telugu script.'
              : 'English displays recognized English speech.'}
        </p>
      </section>

      <section className="sidebar-section generate-section">
        <div className="section-heading"><div><span className="section-kicker">03</span><h2>Generate captions</h2></div><span className={`live-status ${isTranscribing ? 'working' : 'ready'}`}><i />{isTranscribing ? 'Working' : 'Ready'}</span></div>

        {/* Backend switcher */}
        <div className="language-pills backend-pills" role="group" aria-label="Transcription backend">
          <button
            type="button"
            className={transcriptionBackend === 'gemini' ? 'active' : ''}
            onClick={() => onSelectBackend?.('gemini')}
            disabled={isTranscribing}
            title="Use CaptionCraft AI for cloud-based transcription (faster, more accurate, supports Telugu)"
          >
            ⚡ CaptionCraft AI
          </button>
          <button
            type="button"
            className={transcriptionBackend === 'local' ? 'active' : ''}
            onClick={() => onSelectBackend?.('local')}
            disabled={isTranscribing}
            title="Run Whisper locally in this browser — no cloud required"
          >
            🖥 Local Whisper
          </button>
        </div>

        {/* CaptionCraft AI backend info / key warning */}
        {transcriptionBackend === 'gemini' && (
          <>
            {geminiKeyMissing ? (
              <div className="inline-error compact-error gemini-key-warning">
                <AlertCircle size={13} />
                <span>
                  <strong>API key missing.</strong> Set <code>VITE_GEMINI_API_KEY</code> in your{' '}
                  <code>.env</code> file and restart the dev server.
                </span>
              </div>
            ) : (
              <p className="section-help" style={{ marginBottom: '9px' }}>
                Powered by <strong>CaptionCraft AI</strong> · Telugu, Tenglish &amp; English · precise timestamps.
              </p>
            )}
          </>
        )}

        {/* Local Whisper model size choice */}
        {transcriptionBackend === 'local' && (
          <>
            <div className="language-pills model-choice-pills" role="group" aria-label="Whisper model accuracy">
              <button
                type="button"
                className={whisperModel === 'tiny' ? 'active' : ''}
                onClick={() => onSelectWhisperModel?.('tiny')}
                disabled={isTranscribing}
                title="Fast Whisper Tiny (~40 MB download, quickest inference)"
              >
                Fast (Tiny)
              </button>
              <button
                type="button"
                className={whisperModel === 'base' ? 'active' : ''}
                onClick={() => onSelectWhisperModel?.('base')}
                disabled={isTranscribing}
                title="Balanced Whisper Base (~75 MB download, better Telugu & multilingual accuracy)"
              >
                Balanced (Base)
              </button>
            </div>
            <p className="section-help" style={{ marginBottom: '9px' }}>
              {whisperModel === 'base'
                ? 'Balanced: ~75 MB download, higher Telugu accuracy.'
                : 'Fast: ~40 MB download, quickest transcription.'}
            </p>
          </>
        )}

        <button className="primary-action" onClick={onGenerateCaptions} disabled={isTranscribing || !onGenerateCaptions || (transcriptionBackend === 'gemini' && geminiKeyMissing)}><RefreshCw size={16} className={isTranscribing || modelStatus === 'loading' ? 'spin' : ''} />{subtitles.length ? 'Regenerate captions' : 'Generate captions'}</button>
        {isTranscribing && onCancelTranscription && <button className="secondary-action cancel-transcription" onClick={onCancelTranscription}>Cancel transcription</button>}
        {/* Load model button only for local backend */}
        {transcriptionBackend === 'local' && modelStatus === 'loading' && <div className="model-download-status"><span>Downloading/loading local Whisper model</span><strong>{Math.round(modelProgress)}%</strong><div className="progress-track"><span style={{ width: `${Math.min(100, Math.max(0, modelProgress))}%` }} /></div></div>}
        {transcriptionBackend === 'local' && modelStatus === 'ready' && <p className="section-help">Local Whisper ready · audio stays in this browser during transcription.</p>}
        {(isTranscribing || transcriptionProgress > 0 || transcriptionError) && (
          <div className={`transcription-card ${transcriptionError ? 'has-error' : ''}`}>
            <div className="transcription-status-row"><span>{transcriptionError ? 'Needs attention' : transcriptionStatus || 'Preparing transcription'}</span><strong>{Math.round(transcriptionProgress)}%</strong></div>
            <div className="progress-track"><span style={{ width: `${Math.min(100, transcriptionProgress)}%` }} /></div>
            <span className="progress-detail">{transcriptionProcessedDuration.toFixed(1)}s / {transcriptionTotalDuration.toFixed(1)}s processed</span>
            {transcriptionError && <div className="inline-error compact-error"><AlertCircle size={14} /><span>{transcriptionError}</span></div>}
            {transcriptionError && onRetryTranscription && !isTranscribing && <button className="secondary-action" onClick={onRetryTranscription}>Retry failed chunk</button>}
          </div>
        )}
      </section>

       <section className="sidebar-section captions-section">
         <div className="section-heading"><div><span className="section-kicker">04</span><h2>Caption overview</h2></div><span className="count-badge">{subtitles.length}</span></div>
         {subtitles.length > 0 && <div className="coverage-card"><div className="coverage-label"><span>{coverage.covered.toFixed(1)}s covered</span><span className={coverage.gaps ? 'gap-label' : ''}>{coverage.gaps ? `${coverage.gaps} gap${coverage.gaps === 1 ? '' : 's'}` : 'No gaps'}</span></div><div className="coverage-track">{coverage.sorted.map(subtitle => <span key={subtitle.id} title={`${subtitle.start.toFixed(1)}–${subtitle.end.toFixed(1)}s`} className={subtitle.id === selectedSubtitleId ? 'active' : ''} style={{ left: `${coverage.duration ? (subtitle.start / coverage.duration) * 100 : 0}%`, width: `${coverage.duration ? Math.max(0.7, ((subtitle.end - subtitle.start) / coverage.duration) * 100) : 0}%` }} />)}</div></div>}
         <p className="section-help">Drag caption clips or their edges on the timeline to edit timing. Double-click a caption on the preview to edit its text.</p>
         {!subtitles.length && !isTranscribing && <p className="empty-state">No captions yet. Generate them or add one on the timeline.</p>}
        <div className="subtitle-downloads"><button className="ghost-button" onClick={exportSrt} disabled={!subtitles.length}><Download size={14} /> SRT</button><button className="ghost-button" onClick={exportVtt} disabled={!subtitles.length}><Download size={14} /> VTT</button></div>
      </section>

    </aside>
  );
};
