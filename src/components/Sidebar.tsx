import React, { useMemo, useState } from 'react';
import type { CaptionLanguage, SourceLanguage, Subtitle } from '../types';
import { getCaptionText } from '../utils/transliterate';
import { AlertCircle, Check, Download, FileText, Merge, Play, Plus, RefreshCw, Scissors, Settings, Trash2, Upload, X } from 'lucide-react';
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
  onLoadModel: () => void;
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
  /** Switch between Gemini AI and local Whisper. */
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
  setSubtitles,
  sourceLanguage,
  setSourceLanguage,
  language,
  setLanguage,
  onLoadModel,
  onJumpToTime,
  mediaDuration = 0,
  mediaFile = null,
  onReplaceMedia,
  selectedSubtitleId = null,
  onSelectSubtitle,
  whisperModel = 'tiny',
  onSelectWhisperModel,
  transcriptionBackend = 'gemini',
  onSelectBackend,
  geminiKeyMissing = false,
}) => {
  const [localSelectedSubtitleId, setLocalSelectedSubtitleId] = useState<string | null>(null);
  const effectiveSelectedId = selectedSubtitleId ?? localSelectedSubtitleId;

  const selectSubtitle = (id: string | null, seek = true) => {
    setLocalSelectedSubtitleId(id);
    onSelectSubtitle?.(id);
    if (seek && id) {
      const subtitle = subtitles.find(item => item.id === id);
      if (subtitle) onJumpToTime(subtitle.start);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onFileUpload(file);
  };

  const updateCaptionText = (id: string, newText: string) => {
    setSubtitles(previous => previous.map(subtitle => {
      if (subtitle.id !== id) return subtitle;
      if (language === 'tenglish') return { ...subtitle, tenglishText: newText };
      return { ...subtitle, text: newText, tenglishText: language === 'te' ? undefined : subtitle.tenglishText };
    }));
  };

  const updateCaptionTime = (id: string, field: 'start' | 'end', value: string) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    setSubtitles(previous => previous.map(subtitle => {
      if (subtitle.id !== id) return subtitle;
      if (field === 'start') {
        const start = Math.max(0, number);
        return { ...subtitle, start, end: Math.max(subtitle.end, start + 0.05) };
      }
      return { ...subtitle, end: Math.max(subtitle.start + 0.05, number) };
    }));
  };

  const deleteCaption = (id: string) => {
    setSubtitles(previous => previous.filter(subtitle => subtitle.id !== id));
    if (effectiveSelectedId === id) selectSubtitle(null, false);
  };

  const addCaption = () => {
    const selectedIndex = effectiveSelectedId ? subtitles.findIndex(item => item.id === effectiveSelectedId) : -1;
    const previous = selectedIndex >= 0 ? subtitles[selectedIndex] : subtitles[subtitles.length - 1];
    const requestedStart = previous ? previous.end + 0.1 : 0;
    const start = mediaDuration > 0 ? Math.min(requestedStart, Math.max(0, mediaDuration - 0.05)) : requestedStart;
    const end = mediaDuration > 0 ? Math.min(mediaDuration, start + 2) : start + 2;
    const caption: Subtitle = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, start, end, text: 'New caption' };
    setSubtitles(previousSubtitles => {
      const next = [...previousSubtitles];
      next.splice(selectedIndex >= 0 ? selectedIndex + 1 : next.length, 0, caption);
      return next;
    });
    selectSubtitle(caption.id, false);
    onJumpToTime(start);
  };

  const splitCaption = (id: string) => {
    const index = subtitles.findIndex(item => item.id === id);
    if (index < 0) return;
    const source = subtitles[index];
    const midpoint = source.start + (source.end - source.start) / 2;
    const visibleWords = getCaptionText(source.text, language, source.tenglishText).trim().split(/\s+/).filter(Boolean);
    const splitPoint = Math.max(1, Math.ceil(visibleWords.length / 2));
    const canonicalWords = source.text.trim().split(/\s+/).filter(Boolean);
    const canonicalPoint = Math.min(canonicalWords.length, splitPoint);
    const firstVisible = visibleWords.length > 1 ? visibleWords.slice(0, splitPoint).join(' ') : getCaptionText(source.text, language, source.tenglishText);
    const secondVisible = visibleWords.length > 1 ? visibleWords.slice(splitPoint).join(' ') : firstVisible;
    const first: Subtitle = {
      ...source,
      end: midpoint,
      text: canonicalWords.length > 1 ? canonicalWords.slice(0, canonicalPoint).join(' ') : source.text,
      tenglishText: language === 'tenglish' ? firstVisible : undefined,
    };
    const second: Subtitle = {
      ...source,
      id: `${source.id}-split-${Date.now()}`,
      start: midpoint,
      text: canonicalWords.length > 1 ? canonicalWords.slice(canonicalPoint).join(' ') : source.text,
      tenglishText: language === 'tenglish' ? secondVisible : undefined,
    };
    setSubtitles(previous => previous.toSpliced(index, 1, first, second));
    selectSubtitle(second.id, false);
    onJumpToTime(second.start);
  };

  const mergeCaption = (id: string) => {
    const index = subtitles.findIndex(item => item.id === id);
    if (index < 0 || index === subtitles.length - 1) return;
    const first = subtitles[index];
    const second = subtitles[index + 1];
    const merged: Subtitle = {
      ...first,
      end: Math.max(first.end, second.end),
      text: `${first.text.trim()} ${second.text.trim()}`.trim(),
      tenglishText: language === 'tenglish'
        ? `${getCaptionText(first.text, language, first.tenglishText).trim()} ${getCaptionText(second.text, language, second.tenglishText).trim()}`.trim()
        : undefined,
      words: first.words || second.words ? [...(first.words ?? []), ...(second.words ?? [])] : undefined,
    };
    setSubtitles(previous => previous.toSpliced(index, 2, merged));
    selectSubtitle(merged.id, false);
    onJumpToTime(merged.start);
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
        <button className="icon-button" onClick={onLoadModel} title="Load local Whisper model"><Settings size={17} /></button>
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
          <button
            type="button"
            className={language === 'te' ? 'active' : ''}
            onClick={() => setLanguage('te')}
            disabled={isTranscribing}
            title="Display recognized speech in Telugu script"
          >
            తెలుగు
          </button>
          <button
            type="button"
            className={language === 'tenglish' ? 'active' : ''}
            onClick={() => setLanguage('tenglish')}
            disabled={isTranscribing}
            title="Display natural Roman-script transliteration (Tenglish)"
          >
            Tenglish
          </button>
          <button
            type="button"
            className={language === 'en' ? 'active' : ''}
            onClick={() => setLanguage('en')}
            disabled={isTranscribing}
            title="Display English speech in English"
          >
            English
          </button>
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
            title="Use Gemini 2.0 Flash for cloud-based transcription (faster, more accurate, supports Telugu)"
          >
            ⚡ Gemini AI
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

        {/* Gemini backend info / key warning */}
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
                Powered by <strong>Gemini 2.0 Flash</strong> · Telugu, Tenglish &amp; English · precise timestamps.
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
        <div className="section-heading"><div><span className="section-kicker">04</span><h2>Caption editing</h2></div><span className="count-badge">{subtitles.length}</span></div>
        {subtitles.length > 0 && <div className="coverage-card"><div className="coverage-label"><span>{coverage.covered.toFixed(1)}s covered</span><span className={coverage.gaps ? 'gap-label' : ''}>{coverage.gaps ? `${coverage.gaps} gap${coverage.gaps === 1 ? '' : 's'}` : 'No gaps'}</span></div><div className="coverage-track">{coverage.sorted.map(subtitle => <span key={subtitle.id} title={`${subtitle.start.toFixed(1)}–${subtitle.end.toFixed(1)}s`} className={subtitle.id === effectiveSelectedId ? 'active' : ''} style={{ left: `${coverage.duration ? (subtitle.start / coverage.duration) * 100 : 0}%`, width: `${coverage.duration ? Math.max(0.7, ((subtitle.end - subtitle.start) / coverage.duration) * 100) : 0}%` }} />)}</div></div>}
        <div className="caption-list">
          {coverage.sorted.map((subtitle, index) => {
            const previousEnd = index === 0 ? 0 : coverage.sorted[index - 1].end;
            const isSelected = subtitle.id === effectiveSelectedId;
            return <article className={`caption-card ${isSelected ? 'selected' : ''}`} key={subtitle.id} onClick={() => selectSubtitle(subtitle.id)}>
              {subtitle.start > previousEnd + 0.01 && <div className="gap-warning">Gap · {(subtitle.start - previousEnd).toFixed(1)}s uncovered</div>}
              <div className="caption-card-top"><button className="tiny-icon-button" onClick={(event) => { event.stopPropagation(); selectSubtitle(subtitle.id); }} title="Seek to caption"><Play size={12} /></button><div className="time-fields"><input aria-label="Caption start time" type="number" step="0.1" value={subtitle.start} onClick={event => event.stopPropagation()} onFocus={() => selectSubtitle(subtitle.id)} onChange={event => updateCaptionTime(subtitle.id, 'start', event.target.value)} /><span>–</span><input aria-label="Caption end time" type="number" step="0.1" value={subtitle.end} onClick={event => event.stopPropagation()} onChange={event => updateCaptionTime(subtitle.id, 'end', event.target.value)} /><small>s</small></div><div className="caption-actions"><button className="tiny-icon-button" onClick={event => { event.stopPropagation(); splitCaption(subtitle.id); }} title="Split caption"><Scissors size={13} /></button>{index < coverage.sorted.length - 1 && <button className="tiny-icon-button" onClick={event => { event.stopPropagation(); mergeCaption(subtitle.id); }} title="Merge with next"><Merge size={13} /></button>}<button className="tiny-icon-button danger" onClick={event => { event.stopPropagation(); deleteCaption(subtitle.id); }} title="Delete caption"><Trash2 size={13} /></button></div></div>
              <textarea aria-label="Caption text" value={getCaptionText(subtitle.text, language, subtitle.tenglishText)} onClick={event => event.stopPropagation()} onFocus={() => selectSubtitle(subtitle.id)} onChange={event => updateCaptionText(subtitle.id, event.target.value)} />
              {isSelected && <div className="selected-caption-label"><Check size={12} /> Selected · edit on preview with Enter</div>}
            </article>;
          })}
        </div>
        {!subtitles.length && !isTranscribing && <p className="empty-state">No captions yet. Generate them or add a manual segment.</p>}
        <button className="secondary-action add-caption-button" onClick={addCaption} disabled={isTranscribing}><Plus size={15} /> Add caption manually</button>
        <div className="subtitle-downloads"><button className="ghost-button" onClick={exportSrt} disabled={!subtitles.length}><Download size={14} /> SRT</button><button className="ghost-button" onClick={exportVtt} disabled={!subtitles.length}><Download size={14} /> VTT</button></div>
      </section>

    </aside>
  );
};
