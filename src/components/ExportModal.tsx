import { CheckCircle2, Download, FileImage, FileText, Film, Monitor, X, XCircle } from 'lucide-react';
import type { AspectRatio, ExportResolutionPreset } from '../types';
import { getExportDimensions, EXPORT_RESOLUTION_PRESETS } from '../utils/exportCapabilities';

function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

export interface ExportModalProps {
  open: boolean;
  aspectRatio: AspectRatio;
  canExportWebm: boolean;
  isExporting: boolean;
  exportProgress: number;
  exportError: string;
  exportComplete: boolean;
  /** Selected resolution preset. */
  exportResolution: ExportResolutionPreset;
  /** Called when the user picks a new resolution. Disabled during export. */
  onChangeResolution: (preset: ExportResolutionPreset) => void;
  /** Current playback time during export (seconds). */
  exportCurrentTime?: number;
  /** Total media duration (seconds). */
  exportTotalDuration?: number;
  onClose: () => void;
  onCancel: () => void;
  onExportWebm: () => void;
  onExportFrame: () => void;
  onExportSrt: () => void;
  onExportVtt: () => void;
}

const PRESET_ORDER: ExportResolutionPreset[] = ['720p', '1080p', '2K', '4K'];

export function ExportModal({
  open,
  aspectRatio,
  canExportWebm,
  isExporting,
  exportProgress,
  exportError,
  exportComplete,
  exportResolution,
  onChangeResolution,
  exportCurrentTime = 0,
  exportTotalDuration = 0,
  onClose,
  onCancel,
  onExportWebm,
  onExportFrame,
  onExportSrt,
  onExportVtt,
}: ExportModalProps) {
  if (!open) return null;

  const dims = getExportDimensions(exportResolution, aspectRatio);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isExporting) onClose();
      }}
    >
      <section className="export-modal" role="dialog" aria-modal="true" aria-labelledby="export-title">
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <span className="eyebrow accent-eyebrow">Final delivery</span>
            <h2 id="export-title">Preview &amp; Export</h2>
            <p>Export the current caption styling, timing, and selected language.</p>
          </div>
          <button className="icon-button" onClick={onClose} disabled={isExporting} aria-label="Close export panel">
            <X size={18} />
          </button>
        </div>

        {/* RESOLUTION PICKER */}
        <div className="export-resolution-section">
          <div className="export-resolution-label">
            <Monitor size={14} />
            <span>Export resolution</span>
          </div>
          <div className="resolution-pill-group" role="group" aria-label="Export resolution">
            {PRESET_ORDER.map(preset => {
              const config = EXPORT_RESOLUTION_PRESETS[preset];
              const isActive = exportResolution === preset;
              const isRecommended = preset === '1080p';
              return (
                <button
                  key={preset}
                  type="button"
                  className={`resolution-pill ${isActive ? 'active' : ''}`}
                  onClick={() => onChangeResolution(preset)}
                  disabled={isExporting}
                  aria-pressed={isActive}
                  title={`${config.label} — ${(config.videoBitsPerSecond / 1_000_000).toFixed(0)} Mbps`}
                >
                  <strong>{preset}</strong>
                  {isRecommended && <span className="res-badge">✓ Recommended</span>}
                </button>
              );
            })}
          </div>
          <div className="export-summary">
            <div>
              <span>Aspect ratio</span>
              <strong>{aspectRatio}</strong>
            </div>
            <div>
              <span>Output</span>
              <strong>{dims.width} × {dims.height}</strong>
            </div>
            <div>
              <span>Bitrate</span>
              <strong>{(dims.videoBitsPerSecond / 1_000_000).toFixed(0)} Mbps</strong>
            </div>
            <div>
              <span>Caption timing</span>
              <strong>Timeline synced</strong>
            </div>
          </div>
        </div>

        {/* STATUS ALERTS */}
        {exportError && (
          <div className="inline-error">
            <XCircle size={17} />
            <span>{exportError}</span>
          </div>
        )}
        {exportComplete && !exportError && (
          <div className="inline-success">
            <CheckCircle2 size={17} />
            <span>Your export is ready to download.</span>
          </div>
        )}

        {/* EXPORT ACTIONS */}
        <div className="export-options">
          <button
            className="export-option primary"
            onClick={onExportWebm}
            disabled={!canExportWebm || isExporting}
            id="export-video-btn"
          >
            <Film size={20} />
            <span>
              <strong>{isExporting ? 'Rendering…' : 'Export video'}</strong>
              <small>
                {canExportWebm
                  ? `WebM / VP9 · ${EXPORT_RESOLUTION_PRESETS[exportResolution].label} · source audio included`
                  : 'WebM is not supported by this browser'}
              </small>
            </span>
            <Download size={16} />
          </button>

          <div className="export-option-grid">
            <button className="export-option" onClick={onExportFrame} disabled={isExporting}>
              <FileImage size={18} />
              <span>
                <strong>PNG frame</strong>
                <small>Current preview frame</small>
              </span>
            </button>
            <button className="export-option" onClick={onExportSrt} disabled={isExporting}>
              <FileText size={18} />
              <span>
                <strong>Download SRT</strong>
                <small>Subtitle interchange</small>
              </span>
            </button>
            <button className="export-option" onClick={onExportVtt} disabled={isExporting}>
              <FileText size={18} />
              <span>
                <strong>Download VTT</strong>
                <small>Web captions</small>
              </span>
            </button>
          </div>
        </div>

        {/* EXPORT PROGRESS */}
        {isExporting && (
          <div className="export-progress" aria-live="polite">
            <div className="progress-label">
              <span>
                Rendering {EXPORT_RESOLUTION_PRESETS[exportResolution].label}
                {exportTotalDuration > 0 && (
                  <> &nbsp;·&nbsp; {formatTimecode(exportCurrentTime)} / {formatTimecode(exportTotalDuration)}</>
                )}
              </span>
              <strong>{Math.round(exportProgress)}%</strong>
            </div>
            <div className="progress-track">
              <span
                className="progress-fill-animated"
                style={{ width: `${Math.min(100, Math.max(0, exportProgress))}%` }}
              />
            </div>
            <button className="ghost-button" onClick={onCancel}>
              <X size={14} /> Cancel export
            </button>
          </div>
        )}

        {/* FOOTER */}
        <div className="modal-footer">
          <span>
            High-resolution off-screen rendering · VP9/opus preferred · MP4 probed as fallback
          </span>
          <button className="text-button" onClick={onClose} disabled={isExporting}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
