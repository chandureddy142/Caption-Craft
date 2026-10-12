import { useRef, useState } from 'react';
import { ArrowRight, FileAudio, FileVideo, RefreshCw, ShieldCheck, UploadCloud, X } from 'lucide-react';
import { formatMediaLimit } from '../utils/mediaValidation';

export interface UploadDashboardProps {
  onSelectAudio: (file: File) => void;
  onSelectVideo: (file: File) => void;
  selectedFile: File | null;
  duration: number;
  isPreparing: boolean;
  preparationStatus: string;
  error: string;
  onRemoveMedia: () => void;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Duration pending';
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds - minutes * 60;
  return minutes > 0 ? `${minutes}m ${remaining.toFixed(1)}s` : `${remaining.toFixed(1)}s`;
}

interface UploadCardProps {
  kind: 'audio' | 'video';
  selectedFile: File | null;
  duration: number;
  disabled: boolean;
  onSelect: (file: File) => void;
}

function UploadCard({ kind, selectedFile, duration, disabled, onSelect }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isAudio = kind === 'audio';
  const accepts = isAudio
    ? 'audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/ogg,.mp3,.wav,.m4a,.aac,.ogg'
    : 'video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv';
  const matchesCard = selectedFile && (isAudio
    ? selectedFile.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg)$/i.test(selectedFile.name)
    : selectedFile.type.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(selectedFile.name));

  const choose = (file: File | undefined) => {
    if (!file || disabled) return;
    onSelect(file);
  };

  return (
    <article
      className={`upload-card ${isDragging ? 'is-dragging' : ''} ${matchesCard ? 'has-file' : ''}`}
      onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDragging(false); }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        choose(event.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        className="visually-hidden"
        id={`${kind}-upload-input`}
        type="file"
        accept={accepts}
        disabled={disabled}
        onChange={(event) => {
          choose(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <div className={`upload-card-icon ${isAudio ? 'audio' : 'video'}`}>
        {isAudio ? <FileAudio size={26} /> : <FileVideo size={26} />}
      </div>
      <div className="upload-card-copy">
        <span className="eyebrow">{isAudio ? 'Audio source' : 'Video source'}</span>
        <h2>{isAudio ? 'Upload Audio' : 'Extract Audio from Video'}</h2>
        <p>{isAudio
          ? 'Add an audio file to generate synchronized captions.'
          : 'Upload a video and automatically extract its audio in the browser.'}</p>
      </div>
      <label className="upload-action button" htmlFor={`${kind}-upload-input`} aria-disabled={disabled}>
        {matchesCard ? <RefreshCw size={16} /> : <UploadCloud size={16} />}
        {matchesCard ? 'Replace file' : isAudio ? 'Choose Audio File' : 'Choose Video File'}
        <ArrowRight size={15} />
      </label>
      <div className="upload-card-footer">
        <span>{isAudio ? 'MP3 · WAV · M4A · AAC' : 'MP4 · MOV · WEBM'}</span>
        {matchesCard && selectedFile && (
          <span className="upload-file-meta">
            {selectedFile.name} · {formatBytes(selectedFile.size)} · {formatDuration(duration)}
          </span>
        )}
      </div>
      <p className="drop-hint">or drop a {isAudio ? 'file' : 'video'} here</p>
    </article>
  );
}

export function UploadDashboard({
  onSelectAudio,
  onSelectVideo,
  selectedFile,
  duration,
  isPreparing,
  preparationStatus,
  error,
  onRemoveMedia,
}: UploadDashboardProps) {
  return (
    <main className="upload-dashboard">
      <header className="welcome-header">
        <div className="brand-lockup">
          <div className="brand-mark">CC</div>
          <div>
            <div className="brand-name">CaptionCraft</div>
            <div className="brand-tagline">Turn your audio into perfectly styled captions.</div>
          </div>
        </div>
        <div className="privacy-badge"><span className="status-dot" /> Local media preparation <ShieldCheck size={14} /></div>
      </header>

      <section className="workflow-steps" aria-label="Caption workflow">
        <div className="workflow-step active"><span>01</span><strong>Upload Media</strong><small>Choose a source</small></div>
        <div className="workflow-line" />
        <div className="workflow-step"><span>02</span><strong>Generate &amp; Edit</strong><small>Refine every word</small></div>
        <div className="workflow-line" />
        <div className="workflow-step"><span>03</span><strong>Preview &amp; Export</strong><small>Publish with confidence</small></div>
      </section>

      <section className="upload-hero">
        <span className="eyebrow accent-eyebrow">Start a new caption project</span>
        <h1>What are you creating today?</h1>
        <p>Choose an audio or video source. CaptionCraft prepares the timeline first, then lets you style and edit captions frame by frame.</p>
      </section>

      <section className="upload-grid" aria-label="Media upload choices">
        <UploadCard kind="audio" selectedFile={selectedFile} duration={duration} disabled={isPreparing} onSelect={onSelectAudio} />
        <UploadCard kind="video" selectedFile={selectedFile} duration={duration} disabled={isPreparing} onSelect={onSelectVideo} />
      </section>

      {(isPreparing || error || selectedFile) && (
        <section className={`upload-status ${error ? 'error' : ''}`} aria-live="polite">
          <div className="upload-status-main">
            {isPreparing && <RefreshCw size={17} className="spin" />}
            <div>
              <strong>{error ? 'Media could not be prepared' : isPreparing ? 'Preparing your media' : 'Media ready'}</strong>
              <p>{error || preparationStatus || (selectedFile ? `${selectedFile.name} · ${formatDuration(duration)}` : '')}</p>
            </div>
          </div>
          {selectedFile && !isPreparing && (
            <button className="ghost-button" onClick={onRemoveMedia}><X size={15} /> Remove</button>
          )}
        </section>
      )}

      <footer className="upload-footer">
         <span>Supports MP3, WAV, M4A, AAC, MP4, MOV, WEBM and MKV · max {formatMediaLimit()} per file.</span>
        <span className="privacy-note"><ShieldCheck size={14} /> Audio stays in this browser during transcription after model assets are cached.</span>
      </footer>
    </main>
  );
}
