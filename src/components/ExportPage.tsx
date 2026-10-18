import { 
  ArrowLeft, 
  CheckCircle2, 
  Download, 
  FileText, 
  Film, 
  Layers, 
  Sliders, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  XCircle 
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AspectRatio, CaptionLanguage, ExportResolutionPreset, Subtitle } from "../types";
import { EXPORT_RESOLUTION_PRESETS, getExportDimensions } from "../utils/exportCapabilities";
import {
  downloadBlob,
  downloadSubtitleFile,
  BROWSER_EXPORT_LIMITATION,
  getExportFormatAvailability,
  normalizeExportFilename,
  type ExportFormat,
  type ExportOptions,
  type RenderExport,
} from "../utils/exportPage";

export type ExportPageStatus = "idle" | "rendering" | "success" | "error";

export interface ExportPageProps {
  aspectRatio: AspectRatio;
  subtitles: Subtitle[];
  language: CaptionLanguage;
  duration?: number;
  renderExport?: RenderExport;
  formatSupport?: Partial<Record<ExportFormat, boolean>>;
  initialFilename?: string;
  onBack?: () => void;
}

const resolutions: ExportResolutionPreset[] = ["720p", "1080p", "2K", "4K"];
const frameRates = [24, 30, 60];
const aspectRatios: Array<{ value: AspectRatio; label: string; iconLabel: string }> = [
  { value: "9:16", label: "9:16 · Reels / Shorts", iconLabel: "Portrait" },
  { value: "16:9", label: "16:9 · YouTube / Web", iconLabel: "Landscape" },
  { value: "1:1", label: "1:1 · Square", iconLabel: "Square" },
  { value: "4:5", label: "4:5 · Feed", iconLabel: "Feed" },
];

export function ExportPage({
  aspectRatio,
  subtitles,
  language,
  duration = 0,
  renderExport,
  formatSupport,
  initialFilename = "caption-export",
  onBack,
}: ExportPageProps) {
  const [resolution, setResolution] = useState<ExportResolutionPreset>("1080p");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(aspectRatio);
  const [frameRate, setFrameRate] = useState(30);
  const [format, setFormat] = useState<ExportFormat>("webm");
  const [includeAudio, setIncludeAudio] = useState(true);
  const [filename, setFilename] = useState(initialFilename);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ExportPageStatus>("idle");
  const [error, setError] = useState("");
  const controllerRef = useRef<AbortController | null>(null);
  const filenameEditedRef = useRef(false);

  const availability = useMemo(() => getExportFormatAvailability(format, includeAudio), [format, includeAudio]);
  const formatSupported = formatSupport?.[format] ?? availability.supported;
  const dimensions = getExportDimensions(resolution, selectedAspectRatio);
  const busy = status === "rendering";

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
      setError("No video renderer is connected. Open the editor export action to render this project.");
      setStatus("error");
      return;
    }
    if (!formatSupported) {
      setError(availability.message ?? `${format.toUpperCase()} export is not supported.`);
      setStatus("error");
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("rendering");
    setError("");
    setProgress(0);
    try {
      const blob = await renderExport(options, value => setProgress(Math.max(0, Math.min(100, value))), controller.signal);
      if (controller.signal.aborted) return;
      downloadBlob(blob, options.filename);
      setProgress(100);
      setStatus("success");
    } catch (renderError) {
      if (controller.signal.aborted) return;
      setError(renderError instanceof Error ? renderError.message : "Video rendering failed.");
      setStatus("error");
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  const cancel = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
    setProgress(0);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080b0e",
      color: "#f3f4f6",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "24px 32px",
      boxSizing: "border-box"
    }}>
      {/* 1. TOP BAR */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #161e27",
        paddingBottom: "18px",
        marginBottom: "28px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={busy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "#101620",
                border: "1px solid #1e2836",
                color: "#9ca3af",
                fontSize: "13px",
                fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer"
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to editor</span>
            </button>
          )}

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#8b5cf6", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Studio Export
              </span>
              <span style={{ color: "#374151" }}>•</span>
              <span style={{ fontSize: "11px", color: "#6b7280" }}>Final Master Delivery</span>
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, margin: "2px 0 0 0", color: "#ffffff", letterSpacing: "-0.02em" }}>
              Export Project
            </h1>
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#0d131a",
          border: "1px solid #1a2330",
          borderRadius: "8px",
          padding: "6px 14px",
          fontSize: "12px",
          color: "#94a3b8"
        }}>
          <Sparkles size={14} color="#8b5cf6" />
          <span>Output: <strong style={{ color: "#fff" }}>{dimensions.width} × {dimensions.height}</strong></span>
          <span style={{ color: "#334155" }}>|</span>
          <span>{duration > 0 ? `${duration.toFixed(1)}s` : "Source duration"}</span>
        </div>
      </header>

      {/* 2. TWO-COLUMN DASHBOARD */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.25fr 1fr",
        gap: "28px",
        maxWidth: "1180px",
        margin: "0 auto"
      }}>
        {/* LEFT COLUMN: RENDER SETTINGS */}
        <section style={{
          background: "#0c1117",
          border: "1px solid #182230",
          borderRadius: "14px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "22px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #151e2b", paddingBottom: "12px" }}>
            <Sliders size={16} color="#8b5cf6" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#f3f4f6" }}>Render Settings</span>
          </div>

          {/* Resolution Selector */}
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "8px" }}>
              Target Resolution
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {resolutions.map(val => {
                const isSelected = resolution === val;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={busy}
                    onClick={() => setResolution(val)}
                    style={{
                      padding: "10px 0",
                      background: isSelected ? "rgba(139, 92, 246, 0.16)" : "#101622",
                      border: isSelected ? "1.5px solid #8b5cf6" : "1px solid #1c2635",
                      color: isSelected ? "#c4b5fd" : "#94a3b8",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: busy ? "not-allowed" : "pointer",
                      textAlign: "center"
                    }}
                  >
                    <div>{val}</div>
                    <div style={{ fontSize: "10px", fontWeight: 500, color: isSelected ? "#a78bfa" : "#64748b", marginTop: "2px" }}>
                      {EXPORT_RESOLUTION_PRESETS[val].label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio Cards */}
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "8px" }}>
              Canvas Aspect Ratio
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              {aspectRatios.map(item => {
                const isSelected = selectedAspectRatio === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={busy}
                    onClick={() => setSelectedAspectRatio(item.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: isSelected ? "rgba(139, 92, 246, 0.14)" : "#101622",
                      border: isSelected ? "1.5px solid #8b5cf6" : "1px solid #1c2635",
                      color: isSelected ? "#ffffff" : "#94a3b8",
                      cursor: busy ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      fontWeight: 600
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ fontSize: "10px", color: isSelected ? "#c4b5fd" : "#64748b", padding: "2px 6px", background: "rgba(0,0,0,0.3)", borderRadius: "4px" }}>
                      {item.iconLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frame Rate & Format */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "8px" }}>
                Framerate
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {frameRates.map(fps => {
                  const isSelected = frameRate === fps;
                  return (
                    <button
                      key={fps}
                      type="button"
                      disabled={busy}
                      onClick={() => setFrameRate(fps)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: "7px",
                        background: isSelected ? "#8b5cf6" : "#101622",
                        border: isSelected ? "1px solid #a855f7" : "1px solid #1c2635",
                        color: isSelected ? "#ffffff" : "#94a3b8",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: busy ? "not-allowed" : "pointer"
                      }}
                    >
                      {fps} fps
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "8px" }}>
                Format & Codec
              </div>
              <select
                value={format}
                disabled={busy}
                onChange={e => setFormat(e.target.value as ExportFormat)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "7px",
                  background: "#101622",
                  border: "1px solid #1c2635",
                  color: "#f3f4f6",
                  fontSize: "12px",
                  fontWeight: 600,
                  outline: "none",
                  cursor: busy ? "not-allowed" : "pointer"
                }}
              >
                <option value="webm">WebM · browser capture</option>
                <option value="mp4">MP4 · H.264 x264</option>
                <option value="mkv">MKV · H.264 x264</option>
                <option value="mov">MOV · H.264 x264</option>
              </select>
            </div>
          </div>

          {/* Filename & Audio Track */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af" }}>
              Export File Name
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              background: "#101622",
              border: "1px solid #1c2635",
              borderRadius: "8px",
              padding: "0 12px"
            }}>
              <input
                value={filename}
                disabled={busy}
                onChange={event => {
                  filenameEditedRef.current = true;
                  setFilename(event.target.value);
                }}
                placeholder="Enter file name"
                aria-label="Export filename"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "10px 0",
                  outline: "none",
                  flex: 1
                }}
              />
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>
                .{format}
              </span>
            </div>

            <label style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "#101622",
              border: "1px solid #1c2635",
              borderRadius: "8px",
              cursor: busy ? "not-allowed" : "pointer",
              marginTop: "4px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {includeAudio ? <Volume2 size={16} color="#8b5cf6" /> : <VolumeX size={16} color="#64748b" />}
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#f3f4f6" }}>Include Master Audio</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Export with voiceover and background track</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeAudio}
                disabled={busy}
                onChange={event => setIncludeAudio(event.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#8b5cf6", cursor: "pointer" }}
              />
            </label>
          </div>
        </section>

        {/* RIGHT COLUMN: ACTIONS & DOWNLOADS */}
        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Summary Preview Box */}
          <div style={{
            background: "#0c1117",
            border: "1px solid #182230",
            borderRadius: "14px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "14px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={16} color="#8b5cf6" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#f3f4f6" }}>Export Summary</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #151e2b" }}>
                <span style={{ color: "#9ca3af" }}>File Name</span>
                <span style={{ color: "#ffffff", fontWeight: 600 }}>{normalizeExportFilename(filename, format)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #151e2b" }}>
                <span style={{ color: "#9ca3af" }}>Dimensions</span>
                <span style={{ color: "#ffffff", fontWeight: 600 }}>{dimensions.width} × {dimensions.height} ({selectedAspectRatio})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #151e2b" }}>
                <span style={{ color: "#9ca3af" }}>Segments</span>
                <span style={{ color: "#c4b5fd", fontWeight: 700 }}>{subtitles.length} kinetic caption blocks</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ color: "#9ca3af" }}>Audio Pass</span>
                <span style={{ color: includeAudio ? "#34d399" : "#f87171", fontWeight: 700 }}>
                  {includeAudio ? "Included (stereo)" : "Muted"}
                </span>
              </div>
            </div>

            {format === "mp4" && (
              <div style={{ padding: "10px 12px", background: "rgba(234, 179, 8, 0.08)", border: "1px solid rgba(234, 179, 8, 0.2)", borderRadius: "8px", fontSize: "11px", color: "#fde047", lineHeight: "1.4" }}>
                {BROWSER_EXPORT_LIMITATION}
              </div>
            )}

            {!formatSupported && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "8px", fontSize: "12px", color: "#f87171" }}>
                <XCircle size={16} />
                <span>{availability.message ?? `${format.toUpperCase()} export is unavailable.`}</span>
              </div>
            )}

            {status === "error" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "8px", fontSize: "12px", color: "#f87171" }}>
                <XCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {status === "success" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.25)", borderRadius: "8px", fontSize: "12px", color: "#4ade80" }}>
                <CheckCircle2 size={16} />
                <span>Video rendered and downloaded successfully!</span>
              </div>
            )}

            {busy && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", background: "#101622", borderRadius: "10px", border: "1px solid #1f2a3a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "#9ca3af" }}>Rendering video stream...</span>
                  <strong style={{ color: "#8b5cf6" }}>{Math.round(progress)}%</strong>
                </div>
                <div style={{ width: "100%", height: "6px", background: "#1b2330", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #8b5cf6, #d946ef)", transition: "width 0.2s ease" }} />
                </div>
                <button
                  type="button"
                  onClick={cancel}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#f87171",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    alignSelf: "flex-end",
                    marginTop: "4px"
                  }}
                >
                  Cancel Render
                </button>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              disabled={busy || !formatSupported}
              onClick={() => void handleRender()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                background: busy || !formatSupported ? "#1e293b" : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                color: "#ffffff",
                border: "none",
                fontSize: "14px",
                fontWeight: 700,
                cursor: busy || !formatSupported ? "not-allowed" : "pointer",
                boxShadow: busy || !formatSupported ? "none" : "0 4px 18px rgba(139, 92, 246, 0.4)",
                transition: "transform 0.15s ease"
              }}
            >
              <Film size={18} />
              <span>{busy ? "Rendering project in browser…" : "Render and Download Video"}</span>
              <Download size={16} />
            </button>
          </div>

          {/* Subtitle Downloads */}
          <div style={{
            background: "#0c1117",
            border: "1px solid #182230",
            borderRadius: "14px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={16} color="#8b5cf6" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#f3f4f6" }}>Subtitle Interchanges</span>
            </div>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0" }}>
              Download standalone caption files synced to your timeline for YouTube, Premiere, or Final Cut.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                disabled={busy || subtitles.length === 0}
                onClick={() => downloadSubtitleFile(subtitles, language, "srt")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "#101622",
                  border: "1px solid #1c2635",
                  color: "#e5e7eb",
                  cursor: busy || subtitles.length === 0 ? "not-allowed" : "pointer",
                  textAlign: "left"
                }}
              >
                <FileText size={16} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>Download SRT</div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>SubRip interchange</div>
                </div>
              </button>

              <button
                type="button"
                disabled={busy || subtitles.length === 0}
                onClick={() => downloadSubtitleFile(subtitles, language, "vtt")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "#101622",
                  border: "1px solid #1c2635",
                  color: "#e5e7eb",
                  cursor: busy || subtitles.length === 0 ? "not-allowed" : "pointer",
                  textAlign: "left"
                }}
              >
                <FileText size={16} color="#a855f7" />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>Download VTT</div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>Web & HTML5 standard</div>
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}