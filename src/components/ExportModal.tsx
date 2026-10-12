import { CheckCircle2, Download, FileImage, FileText, Film, X, XCircle } from 'lucide-react';
import type { AspectRatio } from '../types';

export interface ExportModalProps {
  open: boolean;
  aspectRatio: AspectRatio;
  outputWidth: number;
  outputHeight: number;
  canExportWebm: boolean;
  isExporting: boolean;
  exportProgress: number;
  exportError: string;
  exportComplete: boolean;
  onClose: () => void;
  onCancel: () => void;
  onExportWebm: () => void;
  onExportFrame: () => void;
  onExportSrt: () => void;
  onExportVtt: () => void;
}

export function ExportModal({
  open,
  aspectRatio,
  outputWidth,
  outputHeight,
  canExportWebm,
  isExporting,
  exportProgress,
  exportError,
  exportComplete,
  onClose,
  onCancel,
  onExportWebm,
  onExportFrame,
  onExportSrt,
  onExportVtt,
}: ExportModalProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isExporting) onClose(); }}>
      <section className="export-modal" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow accent-eyebrow">Final delivery</span>
            <h2 id="export-title">Preview &amp; Export</h2>
            <p>Export the current caption styling, timing, and selected language.</p>
          </div>
          <button className="icon-button" onClick={onClose} disabled={isExporting} aria-label="Close export panel"><X size={18} /></button>
        </div>

        <div className="export-summary">
          <div><span>Aspect ratio</span><strong>{aspectRatio}</strong></div>
          <div><span>Output</span><strong>{outputWidth} × {outputHeight}</strong></div>
          <div><span>Caption timing</span><strong>Timeline synced</strong></div>
        </div>

        {exportError && <div className="inline-error"><XCircle size={17} /><span>{exportError}</span></div>}
        {exportComplete && !exportError && <div className="inline-success"><CheckCircle2 size={17} /><span>Your WebM export is ready to download.</span></div>}

        <div className="export-options">
          <button className="export-option primary" onClick={onExportWebm} disabled={!canExportWebm || isExporting}>
            <Film size={20} />
            <span><strong>{isExporting ? 'Rendering WebM…' : 'Export video'}</strong><small>{canExportWebm ? 'WebM; source audio is included when available' : 'WebM is not supported by this browser'}</small></span>
            <Download size={16} />
          </button>
          <div className="export-option-grid">
            <button className="export-option" onClick={onExportFrame} disabled={isExporting}><FileImage size={18} /><span><strong>PNG frame</strong><small>Current preview frame</small></span></button>
            <button className="export-option" onClick={onExportSrt} disabled={isExporting}><FileText size={18} /><span><strong>Download SRT</strong><small>Subtitle interchange</small></span></button>
            <button className="export-option" onClick={onExportVtt} disabled={isExporting}><FileText size={18} /><span><strong>Download VTT</strong><small>Web captions</small></span></button>
          </div>
        </div>

        {isExporting && (
          <div className="export-progress" aria-live="polite">
            <div className="progress-label"><span>Rendering preview frames</span><strong>{Math.round(exportProgress)}%</strong></div>
            <div className="progress-track"><span style={{ width: `${Math.min(100, Math.max(0, exportProgress))}%` }} /></div>
            <button className="ghost-button" onClick={onCancel}><X size={14} /> Cancel export</button>
          </div>
        )}

        <div className="modal-footer"><span>MP4 export is not implemented. WebM is offered only when this browser exposes a compatible MediaRecorder codec.</span><button className="text-button" onClick={onClose} disabled={isExporting}>Close</button></div>
      </section>
    </div>
  );
}
