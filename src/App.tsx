import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { UploadDashboard } from './components/UploadDashboard';
import type { CanvasSettings, Subtitle, CaptionLanguage, SourceLanguage } from './types';
import { extractAudioToWav, getWavDurationFromBlob } from './utils/audioExtractor';
import {
  createLocalTranscriptionClient,
  LocalTranscriptionError,
  LOCAL_WHISPER_BASE_MODEL_ID,
  LOCAL_WHISPER_MODEL_ID,
  type LocalModelStatus,
  type LocalTranscriptionProgress,
} from './services/localTranscription';
import {
  transcribeWithGemini,
  GeminiTranscriptionError,
  GeminiKeyMissingError,
} from './services/geminiCaptionService';
import { normalizeSubtitles } from './utils/subtitleValidation';
import { validateMediaFile } from './utils/mediaValidation';
import { TranscriptionSession } from './services/transcriptionSession';
import { useHistory } from './utils/history';
import { ExportPage } from './components/ExportPage';
import { renderProjectToBlob } from './utils/projectRenderer';

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0.0s';
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return minutes > 0 ? `${minutes}m ${remainder.toFixed(1)}s` : `${remainder.toFixed(1)}s`;
}

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>('en');
  const [language, setLanguage] = useState<CaptionLanguage>('en');
  const [whisperModel, setWhisperModel] = useState<'tiny' | 'base'>('tiny');
  /** Active transcription backend: Gemini AI (cloud) or local Whisper (in-browser). */
  const [transcriptionBackend, setTranscriptionBackend] = useState<'gemini' | 'local'>('gemini');

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [transcriptionProcessedDuration, setTranscriptionProcessedDuration] = useState(0);
  const [transcriptionTotalDuration, setTranscriptionTotalDuration] = useState(0);
  const [transcriptionError, setTranscriptionError] = useState('');
  const [modelStatus, setModelStatus] = useState<LocalModelStatus>('idle');
  const [modelProgress, setModelProgress] = useState(0);
  const [modelBackend, setModelBackend] = useState<'webgpu' | 'wasm' | undefined>();
  const [audioReady, setAudioReady] = useState(false);
  const [showExportPage, setShowExportPage] = useState(false);
  const [projectTitle, setProjectTitle] = useState('Untitled Caption Project');

  const initialSettings: CanvasSettings = {
    aspectRatio: '9:16',
    backgroundColor: '#000000',
    backgroundTheme: 'midnight',
    backgroundOverlayOpacity: 0.25,
    fitMode: 'cover',
    selectedTemplateId: 'classic-white',
    fontFamily: "'Inter', sans-serif",
    fontSize: 46,
    textColor: '#ffffff',
    highlightColor: '#8b5cf6',
    boxColor: '#000000',
    style: 'outline',
    verticalPosition: 0.82,
    alignment: 'center',
    textBackground: false,
  };
  const editorHistory = useHistory({ subtitles: [] as Subtitle[], settings: initialSettings });
  const { undo, redo } = editorHistory;
  const subtitles = editorHistory.value.subtitles;
  const settings = editorHistory.value.settings;
  const setSubtitles = useCallback<React.Dispatch<React.SetStateAction<Subtitle[]>>>((update) => {
    editorHistory.setValue(current => ({
      ...current,
      subtitles: typeof update === 'function' ? update(current.subtitles) : update,
    }));
  }, [editorHistory.setValue]);
  const setSettings = useCallback<React.Dispatch<React.SetStateAction<CanvasSettings>>>((update) => {
    editorHistory.setValue(current => ({
      ...current,
      settings: typeof update === 'function' ? update(current.settings) : update,
    }));
  }, [editorHistory.setValue]);

  const [jumpTime, setJumpTime] = useState<number | null>(null);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);
  const [mediaDuration, setMediaDuration] = useState(0);

  const audioBlobRef = useRef<Blob | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const transcriptionSessionRef = useRef(new TranscriptionSession());
  const localTranscriptionRef = useRef(createLocalTranscriptionClient());

  useEffect(() => {
    const isTextInput = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable || target.tagName === 'TEXTAREA') return true;
      return target.tagName === 'INPUT';
    };
    const handleUndoRedo = (event: KeyboardEvent) => {
      if (isTextInput(event.target) || (!event.ctrlKey && !event.metaKey) || event.key.toLowerCase() !== 'z') return;
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener('keydown', handleUndoRedo);
    return () => window.removeEventListener('keydown', handleUndoRedo);
  }, [redo, undo]);

  const updateSubtitles: React.Dispatch<React.SetStateAction<Subtitle[]>> = (update) => {
    setSubtitles(previous => {
        const next = typeof update === 'function' ? update(previous) : update;
        const limit = mediaDuration > 0 ? mediaDuration : Number.POSITIVE_INFINITY;
      return normalizeSubtitles(next, limit);
    });
  };

  const applyProgress = (progress: LocalTranscriptionProgress) => {
    setTranscriptionProgress(progress.percent);
    setTranscriptionProcessedDuration(progress.processedDuration);
    setTranscriptionTotalDuration(progress.totalDuration);
    setTranscriptionStatus(
      `Transcribing chunk ${progress.completedChunks}/${progress.totalChunks} · ` +
      `${formatSeconds(progress.processedDuration)} / ${formatSeconds(progress.totalDuration)}`,
    );
  };

  const startGeminiTranscription = async (audioBlob: Blob) => {
    const session = transcriptionSessionRef.current;
    const jobId = session.start(audioBlob, sourceLanguage, 0);
    if (jobId === null) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsTranscribing(true);
    setTranscriptionError('');
    setTranscriptionProgress(0);
    setTranscriptionProcessedDuration(0);
    setSubtitles([]);
    setTranscriptionStatus('Sending audio to Gemini 2.0 Flash…');

    try {
      const result = await transcribeWithGemini(audioBlob, {
        sourceLanguage,
        captionLanguage: language,
        signal: controller.signal,
        onProgress: progress => {
          if (!session.isCurrent(jobId)) return;
          setTranscriptionProgress(progress.percent);
          setTranscriptionProcessedDuration(progress.processedDuration);
          setTranscriptionTotalDuration(progress.totalDuration);
          setTranscriptionStatus(
            `Gemini transcribing chunk ${progress.completedChunks}/${progress.totalChunks} · ` +
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
      setTranscriptionProgress(100);
      setTranscriptionProcessedDuration(previous => Math.max(previous, mediaDuration));
      setTranscriptionStatus(`Complete · ${result.length} caption segment${result.length === 1 ? '' : 's'}`);
      setTranscriptionError('');
      session.complete(jobId);
    } catch (error) {
      if (controller.signal.aborted || !session.isCurrent(jobId)) return;
      if (error instanceof GeminiKeyMissingError) {
        setTranscriptionError(error.message);
      } else if (error instanceof GeminiTranscriptionError) {
        session.recordCompleted(jobId, error.failedChunkIndex);
        updateSubtitles(error.partialSubtitles);
        setTranscriptionError(`${error.message} Completed segments were kept.`);
      } else {
        setTranscriptionError(error instanceof Error ? error.message : 'Gemini transcription failed.');
      }
      setTranscriptionStatus('Transcription failed');
    } finally {
      if (session.finish(jobId)) {
        abortControllerRef.current = null;
        setIsTranscribing(false);
      }
    }
  };

  const startTranscription = async (
    audioBlob: Blob,
    startChunkIndex = 0,
    initialSubtitles: Subtitle[] = [],
  ) => {
    const session = transcriptionSessionRef.current;
    const jobId = session.start(audioBlob, sourceLanguage, startChunkIndex);
    if (jobId === null) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsTranscribing(true);
    setTranscriptionError('');
    if (startChunkIndex === 0) {
      setTranscriptionProgress(0);
      setTranscriptionProcessedDuration(0);
      setSubtitles(initialSubtitles);
    }
    setTranscriptionStatus(startChunkIndex > 0 ? 'Resuming from the next unfinished audio chunk…' : 'Starting full-duration transcription…');

    try {
      const modelId = whisperModel === 'base' ? LOCAL_WHISPER_BASE_MODEL_ID : LOCAL_WHISPER_MODEL_ID;
      const result = await localTranscriptionRef.current.transcribe(audioBlob, {
        modelId,
        startChunkIndex,
        initialSubtitles,
        signal: controller.signal,
        sourceLanguage,
        onModelStatus: status => {
          if (!session.isCurrent(jobId)) return;
          setModelStatus(status.status);
          setModelBackend(status.backend);
          if (status.message) setTranscriptionStatus(status.message);
        },
        onModelProgress: progress => {
          if (!session.isCurrent(jobId)) return;
          if (progress.status === 'progress' && typeof progress.progress === 'number') setModelProgress(progress.progress);
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
      setTranscriptionProgress(100);
      setTranscriptionProcessedDuration(previous => Math.max(previous, transcriptionTotalDuration, mediaDuration));
      setTranscriptionStatus(`Complete · ${result.length} caption segment${result.length === 1 ? '' : 's'}`);
      setTranscriptionError('');
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
        setTranscriptionError(error instanceof Error ? error.message : 'Transcription failed.');
      }
      setTranscriptionStatus('Transcription failed');
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
    setProjectTitle(file.name.replace(/\.[^.]+$/, '') || 'Untitled Caption Project');
    const isVideo = Boolean(file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(file.name));
    setSettings(prev => ({
      ...prev,
      backgroundTheme: isVideo ? 'original-video' : 'midnight',
    }));
    setSubtitles([]);
    setSelectedSubtitleId(null);
    setMediaDuration(0);
    setAudioReady(false);
    setTranscriptionError('');
    setTranscriptionProgress(0);
    setTranscriptionProcessedDuration(0);
    setTranscriptionTotalDuration(0);

    const mediaValidationError = validateMediaFile(file);
    if (mediaValidationError) {
      setIsTranscribing(false);
      setTranscriptionStatus('Unsupported or empty media file');
      setTranscriptionError(mediaValidationError);
      return;
    }

    setIsTranscribing(true);
    setTranscriptionStatus('Extracting and resampling audio to mono 16 kHz…');
    try {
      const audioBlob = await extractAudioToWav(file);
      if (!session.isCurrent(jobId)) return;
      audioBlobRef.current = audioBlob;
      setAudioBlob(audioBlob);
      const duration = await getWavDurationFromBlob(audioBlob);
      if (!session.isCurrent(jobId)) return;
      setAudioReady(true);
      setMediaDuration(duration);
      setTranscriptionTotalDuration(duration);
      setIsTranscribing(false);
      setTranscriptionStatus(`Audio ready · ${formatSeconds(duration)} · click Generate captions to load Whisper locally`);
    } catch (error) {
      if (!session.isCurrent(jobId)) return;
      setIsTranscribing(false);
      setTranscriptionStatus('Audio preparation failed');
      setTranscriptionError(error instanceof Error ? error.message : 'Unable to prepare audio.');
    }
  };

  const handleGenerateCaptions = () => {
    const audioBlob = audioBlobRef.current;
    if (!audioBlob || !audioReady) {
      setTranscriptionError('Upload and prepare audio before generating captions.');
      return;
    }
    if (subtitles.length > 0 && !window.confirm('Regenerate captions and replace the current edited segments?')) return;
    if (transcriptionBackend === 'gemini') {
      void startGeminiTranscription(audioBlob);
    } else {
      void startTranscription(audioBlob);
    }
  };

  const handleRetry = () => {
    const audioBlob = audioBlobRef.current;
    const nextChunkIndex = transcriptionSessionRef.current.resume(audioBlob, sourceLanguage);
    if (!audioBlob || nextChunkIndex === null) {
      handleGenerateCaptions();
      return;
    }
    void startTranscription(audioBlob, nextChunkIndex, subtitles);
  };

  const handleCancelTranscription = () => {
    transcriptionSessionRef.current.cancel();
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    localTranscriptionRef.current.cancel();
    setModelStatus('idle');
    setModelProgress(0);
    setModelBackend(undefined);
    setIsTranscribing(false);
    setTranscriptionError('Transcription cancelled. Completed caption segments were kept; retry to resume.');
    setTranscriptionStatus('Transcription cancelled · completed segments were kept');
  };

  const handleRemoveMedia = () => {
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
    setIsTranscribing(false);
    setTranscriptionStatus('');
    setTranscriptionError('');
    setTranscriptionProgress(0);
    setTranscriptionProcessedDuration(0);
    setTranscriptionTotalDuration(0);
    setModelStatus('idle');
    setModelProgress(0);
    setModelBackend(undefined);
  };

  const handleSourceLanguageChange = (next: SourceLanguage) => {
    if (transcriptionSessionRef.current.running) return;
    if (next !== sourceLanguage) {
      transcriptionSessionRef.current.reset();
      setTranscriptionError('');
      setTranscriptionProgress(0);
      setTranscriptionProcessedDuration(0);
      setTranscriptionStatus('Source language changed · generate captions to start again');
    }
    setSourceLanguage(next);
    setLanguage(next === 'te' ? 'te' : 'en');
    if (next === 'te') {
      setWhisperModel('base');
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

  if (showExportPage && videoFile && audioReady) {
    return (
      <div className="app-frame">
        <ExportPage
          aspectRatio={settings.aspectRatio}
          subtitles={subtitles}
          language={language}
          duration={mediaDuration}
          initialFilename={videoFile.name.replace(/\.[^.]+$/, '')}
          onBack={() => setShowExportPage(false)}
          renderExport={(options, onProgress, signal) => renderProjectToBlob(videoFile, subtitles, settings, language, options, onProgress, signal)}
        />
      </div>
    );
  }

  return (
    <div className="app-frame">
      {!videoFile || !audioReady ? (
        <UploadDashboard
          onSelectAudio={handleFileUpload}
          onSelectVideo={handleFileUpload}
          selectedFile={videoFile}
          duration={mediaDuration}
          isPreparing={isTranscribing}
          preparationStatus={transcriptionStatus}
          error={transcriptionError}
          onRemoveMedia={handleRemoveMedia}
        />
      ) : (
        <div className="editor-shell">
          <div className="editor-steps" aria-label="Caption workflow">
            <button className="editor-back-button" onClick={handleRemoveMedia}>← Back to Upload</button>
            <div className="editor-step complete"><span>01</span> Upload Media</div>
            <div className="editor-step active"><span>02</span> Generate &amp; Edit</div>
            <div className="editor-step"><span>03</span> Preview &amp; Export</div>
            <div className="editor-model-status">
              {transcriptionBackend === 'gemini'
                ? 'Gemini 2.0 Flash · cloud'
                : `Local Whisper · ${modelBackend ?? 'not loaded'}`}
            </div>
          </div>
          <div className="editor-columns">
            <Sidebar
              onFileUpload={handleFileUpload}
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
              onLoadModel={() => localTranscriptionRef.current.preload({
                modelId: whisperModel === 'base' ? LOCAL_WHISPER_BASE_MODEL_ID : LOCAL_WHISPER_MODEL_ID,
                onModelStatus: status => { setModelStatus(status.status); setModelBackend(status.backend); },
                onModelProgress: progress => { if (typeof progress.progress === 'number') setModelProgress(progress.progress); },
              }).catch(error => setTranscriptionError(error instanceof Error ? error.message : 'Unable to load the local model.'))}
              onJumpToTime={setJumpTime}
              mediaDuration={mediaDuration}
              selectedSubtitleId={selectedSubtitleId}
              onSelectSubtitle={setSelectedSubtitleId}
              mediaFile={videoFile}
              onReplaceMedia={handleRemoveMedia}
              transcriptionBackend={transcriptionBackend}
              onSelectBackend={(backend) => {
                if (transcriptionSessionRef.current.running) return;
                setTranscriptionBackend(backend);
                setTranscriptionError('');
                setTranscriptionProgress(0);
                setTranscriptionProcessedDuration(0);
                setTranscriptionStatus(
                  backend === 'gemini'
                    ? 'Switched to Gemini AI · click Generate captions'
                    : 'Switched to Local Whisper · click Generate captions',
                );
              }}
              geminiKeyMissing={!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'your_gemini_api_key_here'}
            />
            <Workspace
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
    </div>
  );
}

export default App;
