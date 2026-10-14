import React from 'react';
import type { CaptionLanguage, SourceLanguage, Subtitle } from '../types';
import { AlertCircle, Copy, FileText, Plus, Redo2, RefreshCw, Scissors, Trash2, Undo2, Upload, X } from 'lucide-react';

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
  whisperModel?: 'tiny' | 'base';
  onSelectWhisperModel?: (model: 'tiny' | 'base') => void;
  /** Active transcription backend. */
  transcriptionBackend?: 'gemini' | 'local';
  /** Switch between CaptionCraft AI and local Whisper. */
  onSelectBackend?: (backend: 'gemini' | 'local') => void;
  /** True when VITE_GEMINI_API_KEY is absent/placeholder. */
  geminiKeyMissing?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onDuplicateSubtitle?: () => void;
  onSplitSubtitle?: () => void;
  onDeleteSubtitle?: () => void;
  onAddSubtitle?: () => void;
  hasSelectedSubtitle?: boolean;
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
  whisperModel = 'tiny',
  onSelectWhisperModel,
  transcriptionBackend: _transcriptionBackend = 'gemini',
  onSelectBackend,
  geminiKeyMissing = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onDuplicateSubtitle,
  onSplitSubtitle,
  onDeleteSubtitle,
  onAddSubtitle,
  hasSelectedSubtitle = false,
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onFileUpload(file);
  };

  
  const backendButton = sourceLanguage === 'te' ? (
    <button
      type="button"
      className="active"
      onClick={() => onSelectBackend?.('gemini')}
      disabled={isTranscribing}
      style={{ width: '100%' }}
    >
      ⚡ CaptionCraft AI
    </button>
  ) : (
    <button
      type="button"
      className="active"
      onClick={() => onSelectBackend?.('local')}
      disabled={isTranscribing}
      style={{ width: '100%' }}
    >
      🖥 On-Device
    </button>
  );

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
        <div className="section-heading"><div><h2>Source language</h2></div></div>
        <div className="language-pills source-language-pills" role="group" aria-label="Source language">
          <button className={sourceLanguage === 'en' ? 'active' : ''} onClick={() => setSourceLanguage('en')} disabled={isTranscribing}>English</button>
          <button className={sourceLanguage === 'te' ? 'active' : ''} onClick={() => setSourceLanguage('te')} disabled={isTranscribing}>తెలుగు</button>
        </div>
      </section>

      <section className="sidebar-section">
        <div className="section-heading"><div><h2>Output format</h2></div></div>
        <div className="language-pills output-language-pills" role="group" aria-label="Caption output format">
          {sourceLanguage === 'te' ? (
            <>
              <button type="button" className={language === 'te' ? 'active' : ''} onClick={() => setLanguage('te')} disabled={isTranscribing}>తెలుగు</button>
              <button type="button" className={language === 'tenglish' ? 'active' : ''} onClick={() => setLanguage('tenglish')} disabled={isTranscribing}>Tenglish</button>
            </>
          ) : (
            <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')} disabled={isTranscribing} style={{ gridColumn: '1 / -1' }}>English</button>
          )}
        </div>
      </section>

      <section className="sidebar-section generate-section">
        <div className="section-heading"><div><h2>Generate captions</h2></div><span className={`live-status ${isTranscribing ? 'working' : 'ready'}`}><i />{isTranscribing ? 'Working' : 'Ready'}</span></div>

        <div className="language-pills backend-pills" role="group" aria-label="Transcription backend" style={{ gridTemplateColumns: '1fr' }}>
          {backendButton}
        </div>

        {sourceLanguage === 'te' && geminiKeyMissing && (
          <div className="inline-error compact-error gemini-key-warning" style={{ margin: '8px 0' }}>
            <AlertCircle size={13} />
            <span>
              <strong>API key missing.</strong> Set <code>VITE_GEMINI_API_KEY</code> in your <code>.env</code> file.
            </span>
          </div>
        )}

        {sourceLanguage === 'en' && (
          <div className="language-pills model-choice-pills" role="group" aria-label="Whisper model accuracy" style={{ margin: '8px 0' }}>
            <button
              type="button"
              className={whisperModel === 'tiny' ? 'active' : ''}
              onClick={() => onSelectWhisperModel?.('tiny')}
              disabled={isTranscribing}
            >
              Standard
            </button>
            <button
              type="button"
              className={whisperModel === 'base' ? 'active' : ''}
              onClick={() => onSelectWhisperModel?.('base')}
              disabled={isTranscribing}
            >
              High Accuracy
            </button>
          </div>
        )}

        <button
          className="primary-action"
          onClick={onGenerateCaptions}
          disabled={isTranscribing || !onGenerateCaptions || (sourceLanguage === 'te' && geminiKeyMissing)}
          style={{ marginTop: '8px' }}
        >
          <RefreshCw size={16} className={isTranscribing || modelStatus === 'loading' ? 'spin' : ''} />
          {subtitles.length ? 'Regenerate captions' : 'Generate captions'}
        </button>

        {isTranscribing && onCancelTranscription && (
          <button className="secondary-action cancel-transcription" onClick={onCancelTranscription}>Cancel transcription</button>
        )}

        {sourceLanguage === 'en' && modelStatus === 'loading' && (
          <div className="model-download-status">
            <span>Initializing speech model</span>
            <strong>{Math.round(modelProgress)}%</strong>
            <div className="progress-track">
              <span style={{ width: `${Math.min(100, Math.max(0, modelProgress))}%` }} />
            </div>
          </div>
        )}

        {(isTranscribing || transcriptionProgress > 0 || transcriptionError) && (
          <div className={`transcription-card ${transcriptionError ? 'has-error' : ''}`}>
            <div className="transcription-status-row">
              <span>{transcriptionError ? 'Needs attention' : transcriptionStatus || 'Preparing transcription'}</span>
              <strong>{Math.round(transcriptionProgress)}%</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${Math.min(100, transcriptionProgress)}%` }} />
            </div>
            <span className="progress-detail">{transcriptionProcessedDuration.toFixed(1)}s / {transcriptionTotalDuration.toFixed(1)}s processed</span>
            {transcriptionError && <div className="inline-error compact-error"><AlertCircle size={14} /><span>{transcriptionError}</span></div>}
            {transcriptionError && onRetryTranscription && !isTranscribing && <button className="secondary-action" onClick={onRetryTranscription}>Retry failed chunk</button>}
          </div>
        )}
      </section>
    
      <section className="sidebar-section timeline-sidebar-tools">
        <div className="section-heading">
          <div><h2>Timeline tools</h2></div>
          <span className="count-badge">{subtitles.length}</span>
        </div>
        <div className="sidebar-timeline-actions">
          <div className="sidebar-action-row">
            <button className="sidebar-tool-btn" onClick={onUndo} disabled={!canUndo} title="Undo">
              <Undo2 size={14} />
              <span>Undo</span>
            </button>
            <button className="sidebar-tool-btn" onClick={onRedo} disabled={!canRedo} title="Redo">
              <Redo2 size={14} />
              <span>Redo</span>
            </button>
          </div>
          <div className="sidebar-action-row">
            <button className="sidebar-tool-btn" onClick={onDuplicateSubtitle} disabled={!hasSelectedSubtitle} title="Duplicate selected caption">
              <Copy size={14} />
              <span>Copy</span>
            </button>
            <button className="sidebar-tool-btn" onClick={onSplitSubtitle} disabled={!hasSelectedSubtitle} title="Split selected caption">
              <Scissors size={14} />
              <span>Split</span>
            </button>
            <button className="sidebar-tool-btn danger" onClick={onDeleteSubtitle} disabled={!hasSelectedSubtitle} title="Delete selected caption">
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
          <button className="secondary-action sidebar-add-caption-btn" onClick={onAddSubtitle} disabled={!mediaDuration} title="Add caption at current playhead">
            <Plus size={14} />
            <span>Add caption</span>
          </button>
        </div>
      </section>
    </aside>
  );
};