import { 
  ArrowLeft, 
  CheckCircle2, 
  Download, 
  FileText, 
  Film, 
Sliders, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  X,
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
      const blob = await renderExport(
        options,
        value => setProgress(Math.max(0, Math.min(100, Math.round(value)))),
        controller.signal
      );
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

  const getPreviewAspectStyles = () => {
    switch (selectedAspectRatio) {
      case "9:16":
        return { width: "160px", height: "284px" };
      case "16:9":
        return { width: "284px", height: "160px" };
      case "1:1":
        return { width: "200px", height: "200px" };
      case "4:5":
        return { width: "180px", height: "225px" };
      default:
        return { width: "160px", height: "284px" };
    }
  };

  const previewDims = getPreviewAspectStyles();

  return (
    <div style={{ minHeight: "100vh",
      background: "#12141a",
      color: "#f3f4f6",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "20px 36px 40px",
      boxSizing: "border-box"
    }}>
      {/* 1. TOP HEADER - ONLY BACK TO EDITOR BUTTON */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        paddingBottom: "16px",
        marginBottom: "24px"
      }}>
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
              background: "var(--bg-app, #fbf8ef)", border: "1px solid rgba(0, 0, 0, 0.12)", color: "#1e232d",
              fontSize: "13px",
              fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer"
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to editor</span>
          </button>
        )}
      </header>

      {/* 2. TITLE & OUTPUT INFO ROW (MOVED DOWN) */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: "1180px",
        margin: "0 auto 24px auto"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-primary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Studio Export
            </span>
            <span style={{ color: "#374151" }}>•</span>
            <span style={{ fontSize: "11px", color: "#6b7280" }}>Final Master Delivery</span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "4px 0 0 0", color: "#ffffff", letterSpacing: "-0.02em" }}>
            Export Project
          </h1>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#12141a",
          border: "1px solid #181b24",
          borderRadius: "8px",
          padding: "7px 16px",
          fontSize: "12px",
          color: "#94a3b8"
        }}>
          <Sparkles size={14} color="var(--accent-primary)" />
          <span>Output: <strong style={{ color: "#fff" }}>{dimensions.width} × {dimensions.height}</strong></span>
          <span style={{ color: "#334155" }}>|</span>
          <span>{duration > 0 ? `${duration.toFixed(1)}s` : "Source duration"}</span>
        </div>
      </div>

      {/* 3. TWO-COLUMN DASHBOARD */}
      <div  style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.25fr",
        gap: "28px",
        maxWidth: "1180px",
        margin: "0 auto"
      }}>
        {/* LEFT COLUMN: RENDER SETTINGS */}
        <section style={{
          background: "#12141a",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "14px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "22px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #1c202a", paddingBottom: "12px" }}>
            <Sliders size={16} color="var(--accent-primary)" />
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
                      background: isSelected ? "var(--accent-glow, rgba(255, 255, 255, 0.08)" : "#1c202a",
                      border: isSelected ? "1.5px solid var(--accent-primary)" : "1px solid #232836",
                      color: isSelected ? "#fbf8ef" : "#94a3b8",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: busy ? "not-allowed" : "pointer",
                      textAlign: "center"
                    }}
                  >
                    <div>{val}</div>
                    <div style={{ fontSize: "10px", fontWeight: 500, color: isSelected ? "#ffffff" : "#64748b", marginTop: "2px" }}>
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
                      background: isSelected ? "var(--accent-glow, rgba(255, 255, 255, 0.08)" : "#1c202a",
                      border: isSelected ? "1.5px solid var(--accent-primary)" : "1px solid #232836",
                      color: isSelected ? "#ffffff" : "#94a3b8",
                      cursor: busy ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      fontWeight: 600
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ fontSize: "10px", color: isSelected ? "#fbf8ef" : "#64748b", padding: "2px 6px", background: "rgba(0,0,0,0.3)", borderRadius: "4px" }}>
                      {item.iconLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frame Rate & Container Format in 2 cols */}
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
                        background: isSelected ? "var(--accent-primary)" : "#1c202a",
                        border: isSelected ? "1px solid var(--accent-primary)" : "1px solid #232836",
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
                  background: "#1c202a",
                  border: "1px solid #232836",
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

          {/* Filename & Audio Track Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af" }}>
              Export File Name
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              background: "#1c202a",
              border: "1px solid #232836",
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
              background: "#1c202a",
              border: "1px solid #232836",
              borderRadius: "8px",
              cursor: busy ? "not-allowed" : "pointer",
              marginTop: "4px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {includeAudio ? <Volume2 size={16} color="var(--accent-primary)" /> : <VolumeX size={16} color="#64748b" />}
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
                style={{ width: "16px", height: "16px", accentColor: "var(--accent-primary)", cursor: "pointer" }}
              />
            </label>
          </div>
        </section>

        {/* RIGHT COLUMN: PREVIEW WITH CAPCUT OUTLINE PROGRESS & ACTIONS */}
        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* PREVIEW + CAPCUT-STYLE OUTLINE PROGRESS BOX */}
          <div style={{
            background: "#12141a",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            position: "relative"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Film size={15} color="var(--accent-primary)" />
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#f3f4f6" }}>Master Preview</span>
              </div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                {selectedAspectRatio} • {resolution}
              </span>
            </div>

            {/* VIDEO FRAME WITH CAPCUT ANIMATED CONIC PROGRESS BORDER */}
            <div style={{
              position: "relative",
              padding: "4px",
              borderRadius: "14px",
              background: busy
                ? `conic-gradient(var(--accent-primary) ${progress * 3.6}deg, #d946ef ${progress * 3.6}deg, rgba(255, 255, 255, 0.08) 0deg)`
                : "rgba(255, 255, 255, 0.1)",
              boxShadow: busy ? "0 0 20px var(--accent-glow, rgba(255, 255, 255, 0.18)" : "none",
              transition: "box-shadow 0.3s ease"
            }}>
              <div style={{
                ...previewDims,
                background: "#12141a",
                borderRadius: "10px",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255, 255, 255, 0.05)"
              }}>
                {/* Subtle Film strip backdrop */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.25,
                  backgroundImage: "radial-gradient(var(--accent-primary) 1px, transparent 1px)",
                  backgroundSize: "12px 12px"
                }} />

                {/* Subtitle badge indicator */}
                <div style={{
                  position: "absolute",
                  bottom: "16px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(0, 0, 0, 0.75)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  fontSize: "10px",
                  color: "#cbd5e1",
                  maxWidth: "80%",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textAlign: "center"
                }}>
                  {subtitles.length > 0 ? subtitles[0].text : "Captions ready"}
                </div>

                {/* ACTIVE RENDERING OVERLAY (CAPCUT PROGRESS) */}
                {busy && (
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(8, 11, 14, 0.82)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    zIndex: 10
                  }}>
                    <span style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em" }}>
                      {progress}%
                    </span>
                    <span style={{ fontSize: "11px", color: "#fbf8ef", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Rendering...
                    </span>
                    <button
                      type="button"
                      onClick={cancel}
                      style={{
                        marginTop: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        background: "var(--bg-app, #fbf8ef)", border: "1.5px solid var(--accent-primary, #ff6347)",
                        color: "#fca5a5",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      <X size={12} />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* STATUS NOTICES */}
            {format === "mp4" && (
              <div style={{ width: "100%", padding: "10px 12px", background: "rgba(234, 179, 8, 0.08)", border: "1px solid rgba(234, 179, 8, 0.2)", borderRadius: "8px", fontSize: "11px", color: "#fde047", lineHeight: "1.4" }}>
                {BROWSER_EXPORT_LIMITATION}
              </div>
            )}

            {!formatSupported && (
              <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "var(--bg-app, #fbf8ef)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "8px", fontSize: "12px", color: "#f87171" }}>
                <XCircle size={16} />
                <span>{availability.message ?? `${format.toUpperCase()} export is unavailable.`}</span>
              </div>
            )}

            {status === "error" && (
              <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "var(--bg-app, #fbf8ef)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "8px", fontSize: "12px", color: "#f87171" }}>
                <XCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {status === "success" && (
              <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.25)", borderRadius: "8px", fontSize: "12px", color: "#4ade80" }}>
                <CheckCircle2 size={16} />
                <span>Video rendered and downloaded successfully!</span>
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
                background: busy || !formatSupported ? "#181b24" : "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)",
                color: "#ffffff",
                border: "none",
                fontSize: "14px",
                fontWeight: 700,
                cursor: busy || !formatSupported ? "not-allowed" : "pointer",
                boxShadow: busy || !formatSupported ? "none" : "0 4px 18px var(--accent-glow, rgba(255, 255, 255, 0.18)",
                transition: "all 0.15s ease"
              }}
            >
              <Film size={18} />
              <span>{busy ? `Rendering (${progress}%)…` : "Render and Download Video"}</span>
              <Download size={16} />
            </button>
          </div>

          {/* Subtitle Interchange Downloads */}
          <div style={{
            background: "#12141a",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={16} color="var(--accent-primary)" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#f3f4f6" }}>Subtitle Interchanges</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                disabled={busy || subtitles.length === 0}
                onClick={() => downloadSubtitleFile(subtitles, language, "srt")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "#1c202a",
                  border: "1px solid #232836",
                  color: "#e5e7eb",
                  cursor: busy || subtitles.length === 0 ? "not-allowed" : "pointer",
                  textAlign: "left"
                }}
              >
                <FileText size={16} color="#ffffff" />
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
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "#1c202a",
                  border: "1px solid #232836",
                  color: "#e5e7eb",
                  cursor: busy || subtitles.length === 0 ? "not-allowed" : "pointer",
                  textAlign: "left"
                }}
              >
                <FileText size={16} color="var(--accent-primary)" />
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