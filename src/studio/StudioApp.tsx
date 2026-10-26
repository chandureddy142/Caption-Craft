import { useCallback, useEffect, useRef, useState } from "react";
import { LandingPage } from "../components/LandingPage";
import { Sidebar } from "../components/Sidebar";
import { Workspace } from "../components/Workspace";
import { ExportPage } from "../components/ExportPage";
import type {
  CanvasSettings,
  Subtitle,
  CaptionLanguage,
  SourceLanguage,
  TimelineBgSegment,
  TimelineSongSegment,
} from "../types";
import { extractAudioToWav, getWavDurationFromBlob } from "../utils/audioExtractor";
import {
  createLocalTranscriptionClient,
  LocalTranscriptionError,
  LOCAL_WHISPER_BASE_MODEL_ID,
  LOCAL_WHISPER_MODEL_ID,
  type LocalModelStatus,
  type LocalTranscriptionProgress,
} from "../services/localTranscription";
import {
  transcribeWithCloudAi,
  CloudTranscriptionError,
  AiKeyMissingError,
} from "../services/cloudCaptionService";
import { normalizeSubtitles } from "../utils/subtitleValidation";
import { applyTemplateToSettings } from "../utils/captionTemplates";
import { validateMediaFile } from "../utils/mediaValidation";
import { TranscriptionSession } from "../services/transcriptionSession";
import { useHistory } from "../utils/history";
import { renderProjectToBlob } from "../utils/projectRenderer";
import { getLocalProjectMedia, saveLocalExportMedia } from "../lib/localMediaStorage";
import { saveLocalProjectDraft, getLocalProjectDraft } from "../lib/projectDraftStorage";
import { supabase } from "../lib/supabase";
import { getCurrentUserPlan } from "../services/userService";

export interface StudioAppProps {
  initialTemplateId?: string;
  initialFile?: File | null;
  projectId?: string;
  onBackToDashboard?: () => void;
}

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0.0s";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return minutes > 0 ? `${minutes}m ${remainder.toFixed(1)}s` : `${remainder.toFixed(1)}s`;
}

function App({ initialTemplateId: _initialTemplateId, initialFile, projectId, onBackToDashboard }: StudioAppProps = {}) {
  const [showLanding, setShowLanding] = useState<boolean>(false);
  const [userPlan, setUserPlan] = useState<string>("starter");

  // Sync real-time Supabase user plan & subscription tier
  useEffect(() => {
    let mounted = true;

    async function syncPlan() {
      const activePlan = await getCurrentUserPlan();
      if (mounted) {
        setUserPlan(activePlan);
      }
    }

    syncPlan();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        await syncPlan();
      } else if (event === "SIGNED_OUT") {
        if (mounted) setUserPlan("starter");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const [playbackState, setPlaybackState] = useState<{
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    songVolume?: number;
    selectedLayer?: "audio" | "background" | "caption" | "music" | null;
    selectedSegmentId?: string | null;
    bgSegmentsCount?: number;
    songSegmentsCount?: number;
    localSongUrl?: string | null;
    hasSong?: boolean;
    splitActiveLayer?: () => void;
    pasteActiveLayer?: () => void;
    hasCopiedBg?: boolean;
    deleteActiveLayer?: () => void;
    copyActiveLayer?: () => void;
    togglePlay: () => void;
    seek: (t: number) => void;
    setVolume: (v: number) => void;
    setSongVolume?: (v: number) => void;
  }>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    songVolume: 0.8,
    selectedLayer: "caption",
    selectedSegmentId: null,
    togglePlay: () => {},
    seek: () => {},
    setVolume: () => {},
  });

  const initialSettings: CanvasSettings = {
    aspectRatio: "9:16",
    backgroundColor: "#ffffff",
    backgroundTheme: "midnight",
    backgroundOverlayOpacity: 0.25,
    fitMode: "cover",
    selectedTemplateId: "classic-two-tone",
    fontFamily: "'Inter', sans-serif",
    fontSize: 24,
    textColor: "#ffffff",
    highlightColor: "var(--accent-primary)",
    boxColor: "#000000",
    style: "outline",
    verticalPosition: 0.82,
    alignment: "center",
    textBackground: false,
    hookOverlay: {
      id: "hook-overlay-default",
      text: "",
      enabled: false,
      fontFamily: "'Inter', sans-serif",
      fontSize: 34,
      color: "#ffffff",
      backgroundColor: "#ffffff",
      outlineColor: "#000000",
      outlineWidth: 2,
      horizontalAlign: "center",
      verticalPosition: 0.14,
      xPosition: 0.5,
      yPosition: 0.14,
    },
    safeZones: {
      platform: "instagram",
      show: false,
    },
    backgroundMusic: {
      enabled: false,
      volume: 0.45,
      muted: false,
      fadeIn: 0.6,
      fadeOut: 0.7,
      startOffset: 0,
      looping: true,
      duckingEnabled: true,
      duckingRatio: 0.3,
      attack: 0.12,
      release: 0.18,
    },
    animationSettings: {
      style: "karaoke",
      wordHighlightEnabled: true,
      emojiEnhancement: false,
    },
    exportPreferences: {
      subtitleFormat: "srt",
      includeHookOverlay: true,
      includeWatermark: true,
      audioExportFormat: "wav",
    },
    watermarkEnabled: false,
    watermarkOpacity: 0.7,
    watermarkPosition: "bottom-right",
  };

  const editorHistory = useHistory({
    subtitles: [] as Subtitle[],
    settings: initialSettings,
    bgSegments: [] as TimelineBgSegment[],
    songSegments: [{ id: "song-default", start: 0, end: 0 }] as TimelineSongSegment[],
  });

  const { undo, redo } = editorHistory;
  const subtitles = editorHistory.value.subtitles;
  const settings = editorHistory.value.settings;
  const bgSegments = editorHistory.value.bgSegments;
  const songSegments = editorHistory.value.songSegments;

  const setSubtitles = useCallback<React.Dispatch<React.SetStateAction<Subtitle[]>>>((update) => {
    editorHistory.setValue(current => ({
      ...current,
      subtitles: typeof update === "function" ? update(current.subtitles) : update,
    }));
  }, [editorHistory.setValue]);

  const setSettings = useCallback<React.Dispatch<React.SetStateAction<CanvasSettings>>>((update) => {
    editorHistory.setValue(current => ({
      ...current,
      settings: typeof update === "function" ? update(current.settings) : update,
    }));
  }, [editorHistory.setValue]);

  const setBgSegments = useCallback<React.Dispatch<React.SetStateAction<TimelineBgSegment[]>>>((update) => {
    editorHistory.setValue(current => ({
      ...current,
      bgSegments: typeof update === "function" ? update(current.bgSegments) : update,
    }));
  }, [editorHistory.setValue]);

  const setSongSegments = useCallback<React.Dispatch<React.SetStateAction<TimelineSongSegment[]>>>((update) => {
    editorHistory.setValue(current => ({
      ...current,
      songSegments: typeof update === "function" ? update(current.songSegments) : update,
    }));
  }, [editorHistory.setValue]);

  const [jumpTime, setJumpTime] = useState<number | null>(null);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);
  const [mediaDuration, setMediaDuration] = useState(0);

  const [draftSongUrl, setDraftSongUrl] = useState<string | null>(null);
  const [draftSongName, setDraftSongName] = useState<string | null>(null);
  const currentSongBlobRef = useRef<Blob | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false);
  const [captionSearchQuery, setCaptionSearchQuery] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>("en");
  const [language, setLanguage] = useState<CaptionLanguage>("en");
  const [whisperModel, setWhisperModel] = useState<"tiny" | "base">("tiny");
  const [transcriptionBackend, setTranscriptionBackend] = useState<"cloud" | "local">("cloud");

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState("");
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [transcriptionProcessedDuration, setTranscriptionProcessedDuration] = useState(0);
  const [transcriptionTotalDuration, setTranscriptionTotalDuration] = useState(0);
  const [transcriptionError, setTranscriptionError] = useState("");
  const [modelStatus, setModelStatus] = useState<LocalModelStatus>("idle");
  const [modelProgress, setModelProgress] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [showExportPage, setShowExportPage] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Caption Project");
  const [copiedCaption, setCopiedCaption] = useState<Subtitle | null>(null);

  const audioBlobRef = useRef<Blob | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const transcriptionSessionRef = useRef(new TranscriptionSession());
  const localTranscriptionRef = useRef(createLocalTranscriptionClient());

  useEffect(() => {
    const isTextInput = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable || target.tagName === "TEXTAREA") return true;
      return target.tagName === "INPUT";
    };
    const handleUndoRedo = (event: KeyboardEvent) => {
      if (isTextInput(event.target) || (!event.ctrlKey && !event.metaKey) || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener("keydown", handleUndoRedo);
    return () => window.removeEventListener("keydown", handleUndoRedo);
  }, [redo, undo]);

  const updateSubtitles: React.Dispatch<React.SetStateAction<Subtitle[]>> = (update) => {
    setSubtitles(previous => {
      const next = typeof update === "function" ? update(previous) : update;
      const limit = mediaDuration > 0 ? mediaDuration : Number.POSITIVE_INFINITY;
      return normalizeSubtitles(next, limit);
    });
  };

  const applyProgress = (progress: LocalTranscriptionProgress) => {
    setTranscriptionProgress(progress.percent);
    setTranscriptionProcessedDuration(progress.processedDuration);
    setTranscriptionTotalDuration(progress.totalDuration);
    setTranscriptionStatus(
      `Processing audio ${progress.completedChunks}/${progress.totalChunks} · ` +
      `${formatSeconds(progress.processedDuration)} / ${formatSeconds(progress.totalDuration)}`,
    );
  };

  const startCloudTranscription = async (blob: Blob) => {
    const session = transcriptionSessionRef.current;
    const jobId = session.start(blob, sourceLanguage, 0);
    if (jobId === null) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsTranscribing(true);
    setTranscriptionError("");
    setTranscriptionProgress(0);
    setTranscriptionProcessedDuration(0);
    setSubtitles([]);
    setTranscriptionStatus("Sending audio to Create Captions AI…");

    try {
      const result = await transcribeWithCloudAi(blob, {
        sourceLanguage,
        captionLanguage: language,
        signal: controller.signal,
        onProgress: progress => {
          if (!session.isCurrent(jobId)) return;
          setTranscriptionProgress(progress.percent);
          setTranscriptionProcessedDuration(progress.processedDuration);
          setTranscriptionTotalDuration(progress.totalDuration);
          setTranscriptionStatus(
            `Create Captions AI transcribing chunk ${progress.completedChunks}/${progress.totalChunks} · ` +
            `${formatSeconds(progress.processedDuration)} / ${formatSeconds(progress.totalDuration)}`,
          );
        },
        onPartialResult: (partial, progress) => {
          if (!session.isCurrent(jobId)) return;
          session.recordCompleted(jobId, progress.completedChunks);
          updateSubtitles(partial);
        },
      });
      if (!session.isCurrent(jobId)) return;
      updateSubtitles(result);
      setSettings(prev => (prev.selectedTemplateId === "classic-white" || !prev.selectedTemplateId) ? applyTemplateToSettings(prev, "classic-two-tone") : prev);
      setTranscriptionProgress(100);
      setTranscriptionProcessedDuration(previous => Math.max(previous, mediaDuration));
      setTranscriptionStatus(`Complete · ${result.length} caption segment${result.length === 1 ? "" : "s"}`);
      setTranscriptionError("");
      session.complete(jobId);
    } catch (error) {
      if (controller.signal.aborted || !session.isCurrent(jobId)) return;
      if (error instanceof AiKeyMissingError) {
        setTranscriptionError(error.message);
      } else if (error instanceof CloudTranscriptionError) {
        session.recordCompleted(jobId, error.failedChunkIndex);
        updateSubtitles(error.partialSubtitles);
        setTranscriptionError(`${error.message} Completed segments were kept.`);
      } else {
        setTranscriptionError(error instanceof Error ? error.message : "Create Captions AI transcription failed.");
      }
      setTranscriptionStatus("Transcription failed");
    } finally {
      if (session.finish(jobId)) {
        abortControllerRef.current = null;
        setIsTranscribing(false);
      }
    }
  };

  const startTranscription = async (
    blob: Blob,
    startChunkIndex = 0,
    initialSubtitles: Subtitle[] = [],
  ) => {
    const session = transcriptionSessionRef.current;
    const jobId = session.start(blob, sourceLanguage, startChunkIndex);
    if (jobId === null) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsTranscribing(true);
    setTranscriptionError("");
    if (startChunkIndex === 0) {
      setTranscriptionProgress(0);
      setTranscriptionProcessedDuration(0);
      setSubtitles(initialSubtitles);
    }
    setTranscriptionStatus(startChunkIndex > 0 ? "Resuming from the next unfinished audio chunk…" : "Starting full-duration transcription…");

    try {
      const modelId = whisperModel === "base" ? LOCAL_WHISPER_BASE_MODEL_ID : LOCAL_WHISPER_MODEL_ID;
      const result = await localTranscriptionRef.current.transcribe(blob, {
        modelId,
        startChunkIndex,
        initialSubtitles,
        signal: controller.signal,
        sourceLanguage,
        onModelStatus: status => {
          if (!session.isCurrent(jobId)) return;
          setModelStatus(status.status);
          if (status.message) setTranscriptionStatus(status.message);
        },
        onModelProgress: progress => {
          if (!session.isCurrent(jobId)) return;
          if (progress.status === "progress" && typeof progress.progress === "number") setModelProgress(progress.progress);
        },
        onProgress: progress => {
          if (session.isCurrent(jobId)) applyProgress(progress);
        },
        onPartialResult: (partial, progress) => {
          if (!session.isCurrent(jobId)) return;
          session.recordCompleted(jobId, progress.completedChunks);
          updateSubtitles(partial);
          applyProgress(progress);
        },
      });
      if (!session.isCurrent(jobId)) return;
      updateSubtitles(result);
      setSettings(prev => (prev.selectedTemplateId === "classic-white" || !prev.selectedTemplateId) ? applyTemplateToSettings(prev, "classic-two-tone") : prev);
      setTranscriptionProgress(100);
      setTranscriptionProcessedDuration(previous => Math.max(previous, transcriptionTotalDuration, mediaDuration));
      setTranscriptionStatus(`Complete · ${result.length} caption segment${result.length === 1 ? "" : "s"}`);
      setTranscriptionError("");
      session.complete(jobId);
    } catch (error) {
      if (controller.signal.aborted || !session.isCurrent(jobId)) return;
      if (error instanceof LocalTranscriptionError) {
        session.recordCompleted(jobId, error.failedChunkIndex);
        updateSubtitles(error.partialSubtitles);
        setTranscriptionError(
          `${error.message} Completed caption segments were kept. Retry can resume from the failed chunk.`,
        );
      } else {
        setTranscriptionError(error instanceof Error ? error.message : "Transcription failed.");
      }
      setTranscriptionStatus("Transcription failed");
    } finally {
      if (session.finish(jobId)) {
        abortControllerRef.current = null;
        setIsTranscribing(false);
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    const session = transcriptionSessionRef.current;
    session.reset();
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    const jobId = session.revision;
    audioBlobRef.current = null;
    setAudioBlob(null);
    setVideoFile(file);
    setProjectTitle(file.name.replace(/.[^.]+$/, "") || "Untitled Caption Project");
    const isVideo = Boolean(file.type.startsWith("video/") || /.(mp4|mov|webm|mkv)$/i.test(file.name));
    setSettings(prev => ({
      ...prev,
      backgroundTheme: isVideo ? "original-video" : "midnight",
    }));
    setSubtitles([]);
    setSelectedSubtitleId(null);
    setMediaDuration(0);
    setAudioReady(false);
    setTranscriptionError("");
    setTranscriptionProgress(0);
    setTranscriptionProcessedDuration(0);
    setTranscriptionTotalDuration(0);

    const mediaValidationError = validateMediaFile(file);
    if (mediaValidationError) {
      setIsTranscribing(false);
      setTranscriptionStatus("Unsupported or empty media file");
      setTranscriptionError(mediaValidationError);
      return;
    }

    setTranscriptionStatus("Extracting and resampling audio to mono 16 kHz…");
    try {
      const blob = await extractAudioToWav(file);
      if (!session.isCurrent(jobId)) return;
      audioBlobRef.current = blob;
      setAudioBlob(blob);
      const duration = await getWavDurationFromBlob(blob);
      if (!session.isCurrent(jobId)) return;
      setAudioReady(true);
      setMediaDuration(duration);
      setTranscriptionTotalDuration(duration);
      setIsTranscribing(false);
      setTranscriptionStatus(`Audio ready · ${formatSeconds(duration)} · click Generate captions to load Whisper locally`);
    } catch (error) {
      if (!session.isCurrent(jobId)) return;
      setIsTranscribing(false);
      setTranscriptionStatus("Audio preparation failed");
      setTranscriptionError(error instanceof Error ? error.message : "Unable to prepare audio.");
    }
  };

  useEffect(() => {
    if (initialFile) {
      setShowLanding(false);
      handleFileUpload(initialFile);
    } else if (projectId) {
      setShowLanding(false);
      getLocalProjectMedia(projectId).then(async storedFile => {
        if (storedFile) {
          await handleFileUpload(storedFile);
          try {
            const draft = await getLocalProjectDraft(projectId);
            if (draft) {
              if (draft.projectTitle) setProjectTitle(draft.projectTitle);
              if (draft.subtitles && draft.subtitles.length > 0) setSubtitles(draft.subtitles);
              if (draft.settings) setSettings(draft.settings);
              if (draft.bgSegments && draft.bgSegments.length > 0) setBgSegments(draft.bgSegments);
              if (draft.songSegments && draft.songSegments.length > 0) setSongSegments(draft.songSegments);
              if (draft.songBlob) {
                const sUrl = URL.createObjectURL(draft.songBlob);
                setDraftSongUrl(sUrl);
                setDraftSongName(draft.songName || "Custom song track");
                currentSongBlobRef.current = draft.songBlob;
              } else if (draft.songUrl) {
                setDraftSongUrl(draft.songUrl);
                setDraftSongName(draft.songName || "Custom song track");
              }
            }
          } catch (e) {
            console.warn("Could not load draft:", e);
          }
        } else {
          setTranscriptionStatus("Media not found in local browser storage. Please re-upload.");
        }
      });
    }
  }, [initialFile, projectId]);

  const handleGenerateCaptions = () => {
    const blob = audioBlobRef.current;
    if (!blob || !audioReady) {
      setTranscriptionError("Upload and prepare audio before generating captions.");
      return;
    }
    if (subtitles.length > 0 && !window.confirm("Regenerate captions and replace the current edited segments?")) return;
    const shouldUseCloudAi = transcriptionBackend === "cloud" && sourceLanguage !== "en";
    if (shouldUseCloudAi) {
      void startCloudTranscription(blob);
    } else {
      void startTranscription(blob);
    }
  };

  const handleRetry = () => {
    const blob = audioBlobRef.current;
    const nextChunkIndex = transcriptionSessionRef.current.resume(blob, sourceLanguage);
    if (!blob || nextChunkIndex === null) {
      handleGenerateCaptions();
      return;
    }
    if (transcriptionBackend === "cloud" && sourceLanguage !== "en") {
      void startCloudTranscription(blob);
    } else {
      void startTranscription(blob, nextChunkIndex, subtitles);
    }
  };

  const handleCancelTranscription = () => {
    transcriptionSessionRef.current.cancel();
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    localTranscriptionRef.current.cancel();
    setModelStatus("idle");
    setModelProgress(0);
    setIsTranscribing(false);
    setTranscriptionError("");
    setTranscriptionStatus("");
    setTranscriptionProgress(0);
  };

  const handleSaveDraftAndExit = async () => {
    setIsSavingDraft(true);
    const targetId = projectId || ("p" + Date.now());
    try {
      const m = Math.floor((mediaDuration || playbackState.duration || 0) / 60);
      const s = Math.floor((mediaDuration || playbackState.duration || 0) % 60);
      const timecodeStr = m + ":" + String(s).padStart(2, "0");

      await saveLocalProjectDraft({
        projectId: targetId,
        projectTitle: projectTitle || "Untitled Project",
        duration: mediaDuration || playbackState.duration || 0,
        durationFormatted: timecodeStr,
        captionsCount: subtitles.length,
        subtitles,
        settings,
        bgSegments,
        songSegments,
        songBlob: currentSongBlobRef.current || undefined,
        songName: draftSongName || undefined,
        songUrl: draftSongUrl || undefined,
        updatedAt: new Date().toISOString(),
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user && projectId) {
        await supabase.from("projects").update({
          title: projectTitle || "Untitled Project",
          words_count: subtitles.reduce((acc, s) => acc + (s.text ? s.text.trim().split(/s+/).length : 0), 0),
          ratio: settings.aspectRatio || "9:16",
          status: "Draft",
          updated_at: new Date().toISOString(),
        }).eq("id", projectId);
      }
    } catch (err) {
      console.warn("Failed to save draft:", err);
    } finally {
      setIsSavingDraft(false);
      setShowExitConfirmModal(false);
      if (onBackToDashboard) onBackToDashboard();
      else handleForceExit();
    }
  };

  const handleDiscardAndExit = () => {
    setShowExitConfirmModal(false);
    if (onBackToDashboard) onBackToDashboard();
    else handleForceExit();
  };

  const handleForceExit = () => {
    transcriptionSessionRef.current.reset();
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    audioBlobRef.current = null;
    setAudioBlob(null);
    setVideoFile(null);
    setShowExportPage(false);
    setSubtitles([]);
    setSelectedSubtitleId(null);
    setMediaDuration(0);
    setAudioReady(false);
  };

  const handleRemoveMedia = () => {
    setShowExitConfirmModal(true);
  };

  const handleSourceLanguageChange = (next: SourceLanguage) => {
    if (transcriptionSessionRef.current.running) return;
    if (next !== sourceLanguage) {
      transcriptionSessionRef.current.reset();
      setTranscriptionError("");
      setTranscriptionProgress(0);
      setTranscriptionProcessedDuration(0);
      setTranscriptionStatus("Source language changed · generate captions to start again");
    }
    setSourceLanguage(next);
    setLanguage(next === "te" ? "te" : "en");
    setTranscriptionBackend(next === "te" ? "cloud" : "local");
    if (next === "te") {
      setWhisperModel("base");
    }
  };

  useEffect(() => {
    const client = localTranscriptionRef.current;
    const session = transcriptionSessionRef.current;
    return () => {
      session.reset();
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      client.cleanup();
    };
  }, []);

  const deleteSelectedCaption = () => {
    if (!selectedSubtitleId) return;
    updateSubtitles(previous => previous.filter(item => item.id !== selectedSubtitleId));
    setSelectedSubtitleId(null);
  };

  const handleUnifiedSplit = () => {
    const currentLayer = playbackState.selectedLayer || "caption";
    if (currentLayer === "audio") return;
    if (currentLayer === "caption") {
      const needle = playbackState.currentTime;
      setSubtitles(prev => {
        const targetIdx = prev.findIndex(s => 
          (selectedSubtitleId && s.id === selectedSubtitleId && needle > s.start + 0.05 && needle < s.end - 0.05) ||
          (!selectedSubtitleId && needle > s.start + 0.05 && needle < s.end - 0.05)
        );
        if (targetIdx === -1) return prev;
        const target = prev[targetIdx];
        const words = target.text.trim().split(/s+/).filter(Boolean);
        const ratio = (needle - target.start) / (target.end - target.start);
        const mid = Math.max(1, Math.min(words.length - 1, Math.round(words.length * ratio)));

        const first: Subtitle = {
          ...target,
          end: needle,
          text: words.slice(0, mid).join(" ") || target.text,
        };
        const second: Subtitle = {
          ...target,
          id: `${target.id}-split-${Date.now()}`,
          start: needle,
          text: words.slice(mid).join(" ") || "...",
        };
        const next = [...prev];
        next.splice(targetIdx, 1, first, second);
        return next;
      });
    } else {
      playbackState.splitActiveLayer?.();
    }
  };

  const handleUnifiedDelete = () => {
    const currentLayer = playbackState.selectedLayer || "caption";
    if (currentLayer === "audio") return;
    if (currentLayer === "caption") {
      deleteSelectedCaption();
    } else {
      playbackState.deleteActiveLayer?.();
    }
  };

  const handleCopyOrPaste = () => {
    const currentLayer = playbackState.selectedLayer || "caption";
    if (currentLayer === "background" || currentLayer === "music") {
      if (playbackState.hasCopiedBg) {
        playbackState.pasteActiveLayer?.();
      } else {
        playbackState.copyActiveLayer?.();
      }
      return;
    }
    const audioLimit = mediaDuration || playbackState.duration || 0;
    if (copiedCaption) {
      const needle = playbackState.currentTime || 0;
      if (needle >= audioLimit - 0.05) return;

      const origLen = Math.max(0.1, copiedCaption.end - copiedCaption.start);
      const start = Math.max(0, needle);
      const end = Math.min(start + origLen, audioLimit);

      if (end - start < 0.05) return;

      const pasted: Subtitle = {
        ...copiedCaption,
        id: "caption-pasted-" + Date.now(),
        start,
        end,
      };
      updateSubtitles(prev => [...prev, pasted].sort((a, b) => a.start - b.start));
      setSelectedSubtitleId(pasted.id);
      setCopiedCaption(null);
    } else if (selectedSubtitleId) {
      const selected = subtitles.find(s => s.id === selectedSubtitleId);
      if (selected) {
        setCopiedCaption(selected);
      }
    }
  };

  const addTimelineCaption = () => {
    const audioLimit = mediaDuration || playbackState.duration || 0;
    if (audioLimit <= 0) return;

    const playhead = playbackState.currentTime || 0;
    if (playhead >= audioLimit - 0.05) return;

    const start = Math.max(0, playhead);
    const end = Math.min(start + 2, audioLimit);

    if (end - start < 0.05) return;

    const caption: Subtitle = {
      id: "caption-" + Date.now(),
      start,
      end,
      text: "New caption",
    };
    updateSubtitles(previous => [...previous, caption].sort((a, b) => a.start - b.start));
    setSelectedSubtitleId(caption.id);
  };

  if (showExportPage && videoFile && audioReady) {
    return (
      <div className="app-frame">
        <ExportPage
          userPlan={userPlan}
          aspectRatio={settings.aspectRatio}
          subtitles={subtitles}
          language={language}
          duration={mediaDuration}
          initialFilename={videoFile.name.replace(/.[^.]+$/, "")}
          onBack={() => setShowExportPage(false)}
          renderExport={async (options, onProgress, signal) => {
            const activeSongUrl = draftSongUrl || playbackState.localSongUrl || undefined;
            const blob = await renderProjectToBlob(videoFile, subtitles, settings, language, {
              ...options,
              watermark: userPlan === "starter",
              bgSegments,
              musicUrl: activeSongUrl,
              musicVolume: playbackState.songVolume ?? 0.8,
              audioVolume: playbackState.volume ?? 1,
            }, onProgress, signal);
            const exportId = "exp-" + Date.now();
            const exportName = (videoFile.name.replace(/.[^/.]+$/, "") || "export") + ".mp4";

            try {
              await saveLocalExportMedia(exportId, blob, exportName);

              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase.from("exports").insert({
                  id: exportId,
                  user_id: user.id,
                  project_id: projectId || null,
                  project_title: videoFile.name.replace(/.[^/.]+$/, "") || "Untitled Project",
                  script_format: language === "te" ? "Telugu Lipi" : language === "tenglish" ? "Tenglish" : "English",
                  export_types: "MP4 1080p, Subtitles (Burned-in)",
                  download_url: "local:" + exportId,
                });
              }
            } catch (err) {
              console.error("Failed to persist export to IndexedDB / Supabase:", err);
            }

            return blob;
          }}
        />
      </div>
    );
  }

  if (showLanding && !videoFile) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  return (
    <div className="app-frame">
      {!videoFile || !audioReady ? (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#070b09",
          color: "var(--accent-primary)",
          fontFamily: "inherit",
          gap: "16px",
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid #14231b",
            borderTopColor: "var(--accent-primary)",
            borderRadius: "50%",
            animation: "cc-spin 0.8s linear infinite",
          }} />
          <style>{"@keyframes cc-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }"}</style>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#e5e7eb" }}>
            Preparing media & timeline…
          </div>
          <div style={{ fontSize: "12px", color: "#8a9c92" }}>
            {transcriptionStatus || "Extracting audio track"}
          </div>
        </div>
      ) : (
        <div className="editor-shell">
          <div className="editor-columns">
            <Sidebar
              bgSegmentsCount={playbackState.bgSegmentsCount ?? 1}
              hasSong={Boolean(playbackState.hasSong)}
              onSearchQueryChange={setCaptionSearchQuery}
              onFileUpload={handleFileUpload}
              onBackToUpload={handleRemoveMedia}
              isTranscribing={isTranscribing}
              transcriptionStatus={transcriptionStatus}
              transcriptionProgress={transcriptionProgress}
              transcriptionProcessedDuration={transcriptionProcessedDuration}
              transcriptionTotalDuration={transcriptionTotalDuration || mediaDuration}
              transcriptionError={transcriptionError}
              modelStatus={modelStatus}
              modelProgress={modelProgress}
              onGenerateCaptions={handleGenerateCaptions}
              onRetryTranscription={handleRetry}
              onCancelTranscription={handleCancelTranscription}
              subtitles={subtitles}
              setSubtitles={updateSubtitles}
              sourceLanguage={sourceLanguage}
              setSourceLanguage={handleSourceLanguageChange}
              language={language}
              setLanguage={setLanguage}
              whisperModel={whisperModel}
              onSelectWhisperModel={setWhisperModel}
              onJumpToTime={setJumpTime}
              mediaDuration={mediaDuration}
              mediaFile={videoFile}
              onReplaceMedia={handleRemoveMedia}
              transcriptionBackend={transcriptionBackend}
              onSelectBackend={(backend) => {
                if (transcriptionSessionRef.current.running) return;
                const forceBackend = sourceLanguage === "te" ? "cloud" : "local";
                if (backend !== forceBackend) return;
                setTranscriptionBackend(forceBackend);
                setTranscriptionError("");
                setTranscriptionProgress(0);
                setTranscriptionProcessedDuration(0);
                setTranscriptionStatus(
                  forceBackend === "cloud"
                    ? "Switched to Create Captions AI · click Generate captions"
                    : "Switched to Local Whisper · click Generate captions",
                );
              }}
              aiKeyMissing={!import.meta.env.VITE_AI_API_KEY || import.meta.env.VITE_AI_API_KEY === "your_ai_api_key_here"}
              canUndo={editorHistory.canUndo}
              canRedo={editorHistory.canRedo}
              onUndo={undo}
              onRedo={redo}
              onDuplicateSubtitle={handleCopyOrPaste}
              onSplitSubtitle={handleUnifiedSplit}
              onDeleteSubtitle={handleUnifiedDelete}
              selectedLayer={playbackState.selectedLayer || "caption"}
              copiedCaption={playbackState.selectedLayer === "background" || playbackState.selectedLayer === "music" ? (playbackState.hasCopiedBg ? ({ id: "bg-copied" } as any) : null) : copiedCaption}
              onCopyOrPaste={handleCopyOrPaste}
              onAddSubtitle={addTimelineCaption}
              hasSelectedSubtitle={Boolean(selectedSubtitleId)}
              hasSelectedSegment={Boolean(playbackState.selectedSegmentId)}
              isPlaying={playbackState.isPlaying}
              onTogglePlay={playbackState.togglePlay}
              currentTime={playbackState.currentTime}
              duration={playbackState.duration || mediaDuration}
              onSeek={playbackState.seek}
              volume={playbackState.volume}
              songVolume={playbackState.songVolume ?? 0.8}
              onVolumeChange={(val) => {
                setPlaybackState(prev => ({ ...prev, volume: val }));
                const fn = (playbackState as any).setVolume;
                if (typeof fn === "function") fn(val);
              }}
              onSongVolumeChange={(val) => {
                setPlaybackState(prev => ({ ...prev, songVolume: val }));
                const fn = (playbackState as any).setSongVolume;
                if (typeof fn === "function") fn(val);
              }}
            />
            <Workspace
              userPlan={userPlan}
              initialSongUrl={draftSongUrl}
              initialSongName={draftSongName}
              onSongChange={({ songUrl, songName, songBlob }) => {
                setDraftSongUrl(songUrl);
                setDraftSongName(songName);
                if (songBlob !== undefined) currentSongBlobRef.current = songBlob;
              }}
              bgSegments={bgSegments}
              setBgSegments={setBgSegments}
              songSegments={songSegments}
              setSongSegments={setSongSegments}
              captionSearchQuery={captionSearchQuery}
              onPlaybackStateChange={(st) => setPlaybackState(prev => ({ ...prev, ...st }))}
              videoFile={videoFile}
              audioBlob={audioBlob}
              subtitles={subtitles}
              language={language}
              settings={settings}
              setSettings={setSettings}
              setSubtitles={updateSubtitles}
              jumpTime={jumpTime}
              selectedSubtitleId={selectedSubtitleId}
              onSelectSubtitle={setSelectedSubtitleId}
              onDurationChange={(duration) => {
                setMediaDuration(duration);
                setTranscriptionTotalDuration(previous => Math.max(previous, duration));
              }}
              onBackToUpload={handleRemoveMedia}
              onOpenExport={() => setShowExportPage(true)}
              projectTitle={projectTitle}
              onProjectTitleChange={setProjectTitle}
              canUndo={editorHistory.canUndo}
              canRedo={editorHistory.canRedo}
              onUndo={undo}
              onRedo={redo}
            />
          </div>
        </div>
      )}

      {isTranscribing && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.72)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "20px",
        }}>
          <div style={{
            background: "#12141c",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px",
            padding: "28px 32px",
            width: "100%",
            maxWidth: "420px",
            boxShadow: "0 24px 50px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "17px", fontWeight: 600, color: "#fff" }}>
              {modelStatus === "loading" ? "Initializing speech model" : "Generating captions"}
            </div>

            <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.65)", minHeight: "20px" }}>
              {modelStatus === "loading"
                ? `Loading Whisper locally (${Math.round(modelProgress || 0)}%)`
                : (transcriptionStatus || "Processing audio...")}
            </div>

            <div style={{
              width: "100%",
              height: "7px",
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: "999px",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, Math.max(0, modelStatus === "loading" ? modelProgress : transcriptionProgress))}%`,
                background: "linear-gradient(90deg, var(--accent-primary), var(--accent-primary))",
                borderRadius: "999px",
                transition: "width 0.25s ease",
              }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>
              <span>{modelStatus === "loading" ? "Initial model download" : `${(transcriptionProcessedDuration || 0).toFixed(1)}s / ${(transcriptionTotalDuration || 0).toFixed(1)}s`}</span>
              <strong style={{ color: "var(--accent-primary)" }}>
                {Math.round(modelStatus === "loading" ? modelProgress : transcriptionProgress)}%
              </strong>
            </div>

            <button
              type="button"
              onClick={handleCancelTranscription}
              style={{
                marginTop: "8px",
                padding: "10px 16px",
                borderRadius: "10px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.12)",
                color: "#f87171",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              Cancel transcription
            </button>
          </div>
        </div>
      )}

      {/* EXIT & SAVE DRAFT CONFIRMATION MODAL */}
      {showExitConfirmModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(6px)",
          padding: "20px",
        }}
        onClick={() => setShowExitConfirmModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#12141c",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "14px",
              padding: "24px",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              color: "#ffffff",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
                Save project as draft?
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", lineHeight: 1.5 }}>
                Do you want to save your edited captions, background segments, and music before leaving?
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={handleDiscardAndExit}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#f87171",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Discard & Exit
              </button>

              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "transparent",
                  color: "#cbd5e1",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSavingDraft}
                onClick={handleSaveDraftAndExit}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--accent-primary, #ef4444)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: isSavingDraft ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                {isSavingDraft ? "Saving..." : "Save as Draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
