import React, {
  useEffect, useState } from "react";
import type { CaptionLanguage, SourceLanguage, Subtitle } from "../types";
import {
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileText,
  Pause,
  Play,
  Plus,
  Redo2,
  RefreshCw,
  Scissors,
  Trash2,
  Undo2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

interface SidebarProps {
  bgSegmentsCount?: number;
  onSelectSubtitle?: (id: string | null) => void;
  onSearchQueryChange?: (query: string) => void;
  onFileUpload: (file: File) => void;
  isTranscribing: boolean;
  transcriptionStatus: string;
  transcriptionProgress: number;
  transcriptionProcessedDuration?: number;
  transcriptionTotalDuration?: number;
  transcriptionError?: string;
  modelStatus?: "idle" | "loading" | "ready" | "error";
  modelProgress?: number;
  onGenerateCaptions?: () => void;
  onRetryTranscription?: () => void;
  onCancelTranscription?: () => void;
  subtitles: Subtitle[];
  setSubtitles?: React.Dispatch<React.SetStateAction<Subtitle[]>>;
  sourceLanguage: SourceLanguage;
  setSourceLanguage: (language: SourceLanguage) => void;
  language: CaptionLanguage;
  setLanguage: (lang: CaptionLanguage) => void;
  onBackToUpload: () => void;
  onJumpToTime: (time: number) => void;
  mediaDuration?: number;
  mediaFile?: File | null;
  onReplaceMedia?: () => void;
  whisperModel?: "tiny" | "base";
  onSelectWhisperModel?: (model: "tiny" | "base") => void;
  transcriptionBackend?: "gemini" | "local";
  onSelectBackend?: (backend: "gemini" | "local") => void;
  geminiKeyMissing?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  _onDuplicateSubtitle?: () => void;
  onDuplicateSubtitle?: () => void;
  onSplitSubtitle?: () => void;
  onDeleteSubtitle?: () => void;
  onAddSubtitle?: () => void;
  hasSelectedSubtitle?: boolean;
  hasSelectedSegment?: boolean;
  selectedLayer?: "audio" | "background" | "caption" | "music" | null;
  copiedCaption?: Subtitle | null;
  onCopyOrPaste?: () => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  volume?: number;
  onVolumeChange?: (vol: number) => void;
  songVolume?: number;
  onSongVolumeChange?: (vol: number) => void;
  hasSong?: boolean;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onFileUpload,
  isTranscribing,
  transcriptionStatus: _transcriptionStatus,
  transcriptionProgress: _transcriptionProgress,
  transcriptionProcessedDuration: _transcriptionProcessedDuration = 0,
  transcriptionTotalDuration: _transcriptionTotalDuration = 0,
  transcriptionError: _transcriptionError = "",
  modelStatus = "idle",
  modelProgress: _modelProgress = 0,
  onGenerateCaptions,
  onRetryTranscription: _onRetryTranscription,
  onCancelTranscription: _onCancelTranscription,
  subtitles,
    sourceLanguage,
  setSourceLanguage,
  language,
  setLanguage,
  onJumpToTime,
  onSelectSubtitle,
  onSearchQueryChange,
  onBackToUpload,
  mediaDuration = 0,
  mediaFile = null,
  onReplaceMedia,
  whisperModel = "tiny",
  onSelectWhisperModel,
  transcriptionBackend: _transcriptionBackend = "gemini",
  onSelectBackend,
  geminiKeyMissing = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
    onSplitSubtitle,
  onDeleteSubtitle,
  onAddSubtitle,
  hasSelectedSubtitle = false,
  hasSelectedSegment = false,
  selectedLayer = "caption",
  copiedCaption = null,
  onCopyOrPaste,
  isPlaying = false,
  onTogglePlay,
  currentTime = 0,
  duration = 0,
  volume = 1,
  onVolumeChange,
  songVolume = 0.8,
  onSongVolumeChange,
  hasSong: _hasSong = false,
  bgSegmentsCount: _bgSegmentsCount = 1,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  // Normalize words by removing punctuation for accurate comparison
  const normalizeText = (str: string) =>
    str.toLowerCase().replace(/[.,/#!$%^&*;:{}=-_~()?]/g, "").trim();

  const isSubtitleMatch = (subText: string, query: string) => {
    const cleanQ = normalizeText(query);
    if (!cleanQ) return false;
    const cleanSub = normalizeText(subText);
    
    // Direct phrase match
    if (cleanSub.includes(cleanQ)) return true;

    // Check individual word match if multi-word caption
    const queryWords = cleanQ.split(/s+/).filter(Boolean);
    const subWords = cleanSub.split(/s+/).filter(Boolean);

    return queryWords.some(qw => subWords.some(sw => sw.includes(qw) || qw.includes(sw)));
  };

  const matchedSubtitles = React.useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return subtitles.filter(s => isSubtitleMatch(s.text || "", q));
  }, [subtitles, searchQuery]);

  const jumpToCaption = (targetCaption: typeof subtitles[0]) => {
    if (!targetCaption) return;
    // Set playhead directly into the segment so the preview video shows the exact frame
    const targetTime = targetCaption.start + 0.02;
    onJumpToTime?.(targetTime);
    onSelectSubtitle?.(targetCaption.id);
  };

  const handleNextMatch = () => {
    if (!matchedSubtitles.length) return;
    const nextIdx = (activeMatchIndex + 1) % matchedSubtitles.length;
    setActiveMatchIndex(nextIdx);
    jumpToCaption(matchedSubtitles[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (!matchedSubtitles.length) return;
    const prevIdx = (activeMatchIndex - 1 + matchedSubtitles.length) % matchedSubtitles.length;
    setActiveMatchIndex(prevIdx);
    jumpToCaption(matchedSubtitles[prevIdx]);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveMatchIndex(0);
    onSearchQueryChange?.("");
  };

  useEffect(() => {
    onSearchQueryChange?.(searchQuery);
  }, [searchQuery, onSearchQueryChange]);

  const [activeAudioTarget, setActiveAudioTarget] = useState<"audio" | "music">("audio");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onFileUpload(file);
  };

  const backendButton = sourceLanguage === "te" ? (
    <button
      type="button"
      style={{ width: "100%", background: "#2d3345", color: "#ffffff", border: "1px solid #4a5568", fontWeight: 600, padding: "8px 12px", borderRadius: "6px" }}
      onClick={() => onSelectBackend?.("gemini")}
      disabled={isTranscribing}

    >
      ⚡ CaptionCraft AI
    </button>
  ) : (
    <button
      type="button"
      style={{ width: "100%", background: "#2d3345", color: "#ffffff", border: "1px solid #4a5568", fontWeight: 600, padding: "8px 12px", borderRadius: "6px" }}
      onClick={() => onSelectBackend?.("local")}
      disabled={isTranscribing}

    >
      🖥 On-Device
    </button>
  );

  const hasSelectionOrClipboard = Boolean(hasSelectedSubtitle || hasSelectedSegment || copiedCaption);

  return (
    <aside className="control-sidebar" style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px 14px", overflowY: "auto", height: "100%", background: "#12141a", borderRight: "1px solid rgba(255, 255, 255, 0.08)" }}>
      {/* 1. brand row */}
      <div className="sidebar-brand-row" style={{ paddingBottom: "2px", marginBottom: "0" }}>
        <div className="brand-lockup compact">
          <img src="/media/logo.png" alt="CaptionCraft" style={{ width: "28px", height: "28px", borderRadius: "7px", objectFit: "contain", border: "1.5px solid rgba(255, 255, 255, 0.85)", padding: "2px" }} />
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><span style={{ fontSize: "15px", fontWeight: 700, color: "var(--card-text-primary, #ffffff)" }}>CaptionCraft</span><span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "#232734", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", fontWeight: 700 }}>studio</span></div>
        </div>
        <button className="ghost-button" onClick={onBackToUpload}>
          ← Back to Upload
        </button>
      </div>

      {/* 2. media summary */}
      <div className="media-summary" style={{ margin: "2px 0 6px", padding: "8px 10px", borderRadius: "8px", background: "#181b24", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
        <div className="media-summary-icon">
          <FileText size={17} />
        </div>
        <div className="media-summary-copy">
          <strong style={{ color: "#ffffff", fontWeight: 700 }}>{mediaFile?.name || "Untitled project"}</strong>
          <span>
            {mediaFile
              ? `${formatBytes(mediaFile.size)} · ${formatDuration(mediaDuration)}`
              : "No media selected"}
          </span>
        </div>
        <label className="icon-button" title="Replace media" htmlFor="editor-media-upload">
          <Upload size={15} />
        </label>
        {onReplaceMedia && (
          <button className="icon-button danger" onClick={onReplaceMedia} title="Remove media">
            <X size={15} />
          </button>
        )}
        <input
          id="editor-media-upload"
          className="visually-hidden"
          type="file"
          accept="audio/*,video/*,.mkv,.ogg"
          onChange={handleFileChange}
        />
      </div>

      {/* 3. source language */}
      <section className="sidebar-section" style={{ margin: "0", padding: "0" }}>
        <div className="section-heading">
          <div>
            <h2 style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.82rem", margin: 0 }}>Source language</h2>
          </div>
        </div>
        <div className="language-pills source-language-pills" style={{ background: "#181b24", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }} role="group" aria-label="Source language">
          <button
            style={{ background: sourceLanguage === "en" ? "#2d3345" : "#181b24", color: "#ffffff", border: sourceLanguage === "en" ? "1px solid #4a5568" : "1px solid rgba(255,255,255,0.08)", fontWeight: 600 }}
            onClick={() => setSourceLanguage("en")}
            disabled={isTranscribing}
          >
            English
          </button>
          <button
            style={{ background: sourceLanguage === "te" ? "#2d3345" : "#181b24", color: "#ffffff", border: sourceLanguage === "te" ? "1px solid #4a5568" : "1px solid rgba(255,255,255,0.08)", fontWeight: 600 }}
            onClick={() => setSourceLanguage("te")}
            disabled={isTranscribing}
          >
            తెలుగు
          </button>
        </div>
      </section>

      {/* 4. output format */}
      <section className="sidebar-section" style={{ margin: "0", padding: "0" }}>
        <div className="section-heading">
          <div>
            <h2 style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.82rem", margin: 0 }}>Output format</h2>
          </div>
        </div>
        <div className="language-pills output-language-pills" style={{ background: "#181b24", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }} role="group" aria-label="Caption output format">
          {sourceLanguage === "te" ? (
            <>
              <button
                type="button"
                className={language === "te" ? "active" : ""}
                onClick={() => setLanguage("te")}
                disabled={isTranscribing}
              >
                తెలుగు
              </button>
              <button
                type="button"
                className={language === "tenglish" ? "active" : ""}
                onClick={() => setLanguage("tenglish")}
                disabled={isTranscribing}
              >
                Tenglish
              </button>
            </>
          ) : (
            <button
              type="button"
              style={{ gridColumn: "1 / -1", background: language === "en" ? "#2d3345" : "#181b24", color: "#ffffff", border: language === "en" ? "1px solid #4a5568" : "1px solid rgba(255,255,255,0.08)", fontWeight: 600 }}
              onClick={() => setLanguage("en")}
              disabled={isTranscribing}

            >
              English
            </button>
          )}
        </div>
      </section>

      {/* 5. generate captions */}
      <section className="sidebar-section generate-section" style={{ margin: "0", padding: "0" }}>
        <div className="section-heading">
          <div>
            <h2 style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.82rem", margin: 0 }}>Generate captions</h2>
          </div>
          <span className={`live-status ${isTranscribing ? "working" : "ready"}`}>
            <i />
            {isTranscribing ? "Working" : "Ready"}
          </span>
        </div>

        <div className="language-pills backend-pills" role="group" aria-label="Transcription backend" style={{ gridTemplateColumns: "1fr", background: "#181b24", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          {backendButton}
        </div>

        {sourceLanguage === "te" && geminiKeyMissing && (
          <div className="inline-error compact-error gemini-key-warning" style={{ margin: "8px 0" }}>
            <AlertCircle size={13} />
            <span>
              <strong>API key missing.</strong> Set <code>VITE_GEMINI_API_KEY</code> in your <code>.env</code> file.
            </span>
          </div>
        )}

        {sourceLanguage === "en" && (
          <div className="language-pills model-choice-pills" role="group" aria-label="Whisper model accuracy" style={{ margin: "8px 0", background: "#181b24", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <button
              type="button"
              style={{ background: whisperModel === "tiny" ? "#2d3345" : "#181b24", color: "#ffffff", border: whisperModel === "tiny" ? "1px solid #4a5568" : "1px solid rgba(255,255,255,0.08)", fontWeight: 600 }}
              onClick={() => onSelectWhisperModel?.("tiny")}
              disabled={isTranscribing}
            >
              Standard
            </button>
            <button
              type="button"
              style={{ background: whisperModel === "base" ? "#2d3345" : "#181b24", color: "#ffffff", border: whisperModel === "base" ? "1px solid #4a5568" : "1px solid rgba(255,255,255,0.08)", fontWeight: 600 }}
              onClick={() => onSelectWhisperModel?.("base")}
              disabled={isTranscribing}
            >
              High Accuracy
            </button>
          </div>
        )}

        <button
          type="button"
          className="primary-action" style={{ background: "#2d3345", color: "#ffffff", border: "1px solid #4a5568", fontWeight: 700, padding: "10px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", cursor: "pointer" }}
          onClick={onGenerateCaptions}
          disabled={isTranscribing || !onGenerateCaptions || (sourceLanguage === "te" && geminiKeyMissing)}

        >
          <RefreshCw size={16} className={isTranscribing || modelStatus === "loading" ? "spin" : ""} />
          {subtitles.length ? "Regenerate captions" : "Generate captions"}
        </button>
      </section>

      {/* 6. timeline tools */}
      <section className="sidebar-section timeline-sidebar-tools" style={{ margin: "0", padding: "0" }}>
        <div className="section-heading">
          <div>
            <h2 style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.82rem", margin: 0 }}>Timeline tools</h2>
          </div>
          <span className="count-badge">{subtitles.length}</span>
        </div>
        <div className="sidebar-timeline-actions">
          <div className="sidebar-action-row">
            <button className="sidebar-tool-btn" style={{ background: "#1c202a", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.12)", fontWeight: 600 }} onClick={onUndo} disabled={!canUndo} title="Undo">
              <Undo2 size={14} />
              <span>Undo</span>
            </button>
            <button className="sidebar-tool-btn" style={{ background: "#1c202a", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.12)", fontWeight: 600 }} onClick={onRedo} disabled={!canRedo} title="Redo">
              <Redo2 size={14} />
              <span>Redo</span>
            </button>
          </div>

          <div className="sidebar-action-row">
            {/* Copy / Paste */}
            <button
              className={`sidebar-tool-btn ${copiedCaption ? "active-toggle" : ""}`}
              onClick={onCopyOrPaste}
              disabled={!hasSelectionOrClipboard || selectedLayer === "audio"}
              title={copiedCaption ? "Click to paste caption at needle position" : "Copy selected caption"}
              style={{
                background: copiedCaption ? "var(--accent-glow, rgba(59, 130, 246, 0.28)" : undefined,
                color: copiedCaption ? "#93c5fd" : undefined,
                border: copiedCaption ? "1px solid var(--accent-primary)" : undefined,
              }}
            >
              {copiedCaption ? <ClipboardCheck size={14} /> : <Copy size={14} />}
              <span>{copiedCaption ? "Paste" : "Copy"}</span>
            </button>

            {/* Split */}
            <button
              className="sidebar-tool-btn" style={{ background: "#1c202a", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.12)", fontWeight: 600 }}
              onClick={onSplitSubtitle}
              disabled={(!hasSelectedSubtitle && !hasSelectedSegment) || selectedLayer === "audio"}
              title="Split at needle"
            >
              <Scissors size={14} />
              <span>Split</span>
            </button>

            {/* Delete */}
            <button
              className="sidebar-tool-btn danger" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", fontWeight: 600 }}
              onClick={onDeleteSubtitle}
              disabled={(!hasSelectedSubtitle && !hasSelectedSegment) || selectedLayer === "audio"}
              title="Delete selected item"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>

          {/* Add caption */}
          <button
            className="secondary-action sidebar-add-caption-btn" style={{ background: "#1c202a", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.12)", fontWeight: 700 }}
            onClick={onAddSubtitle}
            disabled={selectedLayer !== "caption" || !mediaDuration}
            title={selectedLayer === "caption" ? "Add new caption at playhead needle" : "Select caption track to add caption"}
          >
            <Plus size={14} />
            <span>Add caption</span>
          </button>
        </div>

        {/* Find & Jump tool */}
        <div
          style={{
            marginTop: "8px",
            display: "flex",
            alignItems: "center",
            background: "#1a1d26", border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "8px",
            padding: "3px 6px 3px 10px",
            gap: "6px",
          }}
        >
          <Search size={14} style={{ color: searchQuery ? "#93c5fd" : "rgba(255, 255, 255, 0.35)", flexShrink: 0 }} />

          <input
            type="text"
            placeholder="find in captions..."
            value={searchQuery}
            onChange={e => {
              const val = e.target.value;
              setSearchQuery(val);
              setActiveMatchIndex(0);
              onSearchQueryChange?.(val);
              const q = val.trim();
              if (q) {
                const firstMatch = subtitles.find(s => isSubtitleMatch(s.text || "", q));
                if (firstMatch) jumpToCaption(firstMatch);
              }
            }}
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#ffffff",
              fontSize: "0.78rem",
              padding: "4px 0",
            }}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "none",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255, 255, 255, 0.6)",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
              }}
              title="Clear search"
            >
              <X size={11} />
            </button>
          )}

          {searchQuery && (
            <span
              style={{
                fontSize: "0.68rem",
                fontFamily: "monospace",
                fontWeight: 600,
                color: matchedSubtitles.length ? "#60a5fa" : "#f87171",
                background: matchedSubtitles.length ? "rgba(52, 211, 153, 0.12)" : "rgba(248, 113, 113, 0.12)",
                padding: "2px 5px",
                borderRadius: "4px",
                flexShrink: 0,
              }}
            >
              {matchedSubtitles.length ? `${activeMatchIndex + 1}/${matchedSubtitles.length}` : "0"}
            </span>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "2px", borderLeft: "1px solid rgba(255, 255, 255, 0.08)", paddingLeft: "4px" }}>
            <button
              type="button"
              onClick={handlePrevMatch}
              disabled={!matchedSubtitles.length}
              style={{
                width: "20px",
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                borderRadius: "4px",
                color: matchedSubtitles.length ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.2)",
                cursor: matchedSubtitles.length ? "pointer" : "default",
              }}
              title="previous match"
            >
              <ChevronLeft size={13} />
            </button>

            <button
              type="button"
              onClick={handleNextMatch}
              disabled={!matchedSubtitles.length}
              style={{
                width: "20px",
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                borderRadius: "4px",
                color: matchedSubtitles.length ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.2)",
                cursor: matchedSubtitles.length ? "pointer" : "default",
              }}
              title="next match"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* 7. playback & dual volume card */}
      <div
        style={{
          marginTop: "12px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "#181b24",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          color: "#ffffff"
        }}
      >
        {/* top row: play/pause on left, music/audio toggle on right */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <button
            type="button"
            onClick={onTogglePlay}
            style={{
              flex: 1,
              height: "32px",
              borderRadius: "5px",
              background: "#2d3345",
              border: "1px solid #4a5568",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "lowercase",
            }}
          >
            {isPlaying ? (
              <>
                <Pause size={13} fill="currentColor" />
                <span>pause</span>
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" style={{ marginLeft: "1px" }} />
                <span>play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveAudioTarget(prev => (prev === "audio" ? "music" : "audio"))}
            style={{
              flex: 1,
              height: "32px",
              borderRadius: "5px",
              background: "#1c202a",
              border: activeAudioTarget === "music" ? "1px solid rgba(52, 211, 153, 0.45)" : "1px solid rgba(59, 130, 246, 0.45)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "lowercase",
            }}
            title="Click to switch volume between audio and music"
          >
            {activeAudioTarget}
          </button>
        </div>

        {/* bottom row: time on left, volume controls on right */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div
            style={{
              flex: 1,
              fontFamily: "monospace",
              fontSize: "0.78rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              color: "#ffffff"
            }}
          >
            <span style={{ color: "#ffffff", fontWeight: 700 }}>{formatDuration(currentTime)}</span>
            <span style={{ margin: "0 2px", color: "rgba(255, 255, 255, 0.6)" }}>/</span>
            <span>{formatDuration(duration || mediaDuration)}</span>
          </div>

          <div
            style={{
              flex: 1.2,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (activeAudioTarget === "music") {
                  onSongVolumeChange?.(songVolume === 0 ? 0.8 : 0);
                } else {
                  onVolumeChange?.(volume === 0 ? 1 : 0);
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                color: (activeAudioTarget === "music" ? songVolume === 0 : volume === 0) ? "#ef4444" : "#475569",
                cursor: "pointer",
                display: "flex",
                padding: 0,
              }}
              title="Mute / Unmute"
            >
              {(activeAudioTarget === "music" ? songVolume === 0 : volume === 0) ? (
                <VolumeX size={14} />
              ) : (
                <Volume2 size={14} />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={activeAudioTarget === "music" ? songVolume : volume}
              onInput={e => {
                const val = Number((e.target as HTMLInputElement).value);
                if (activeAudioTarget === "music") {
                  onSongVolumeChange?.(val);
                } else {
                  onVolumeChange?.(val);
                }
              }}
              onChange={e => {
                const val = Number(e.target.value);
                if (activeAudioTarget === "music") {
                  onSongVolumeChange?.(val);
                } else {
                  onVolumeChange?.(val);
                }
              }}
              style={{
                flex: 1,
                accentColor: "#cbd5e1",
                cursor: "pointer",
                height: "4px",
              }}
            />

            <span
              style={{
                fontSize: "0.72rem",
                color: "rgba(255, 255, 255, 0.6)",
                fontFamily: "monospace",
                minWidth: "32px",
                textAlign: "right",
              }}
            >
              {Math.round((activeAudioTarget === "music" ? songVolume : volume) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
