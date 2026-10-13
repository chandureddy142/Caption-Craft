import type { CanvasSettings, CaptionLanguage, Subtitle } from '../types';
import { drawBackgroundToCanvas } from './backgroundThemes';
import { renderSubtitlesToCanvas } from './SubtitleRenderer';
import { getExportDimensions } from './exportCapabilities';
import { getExportFormatAvailability, type ExportOptions } from './exportPage';
import { transcodeWithFfmpeg, type FfmpegContainer } from '../services/ffmpegExporter';

function stop(stream: MediaStream | null): void {
  try {
    stream?.getTracks().forEach(track => {
      try {
        track.stop();
      } catch {
        // A track may already be closed while another failure is being cleaned up.
      }
    });
  } catch {
    // Some browser implementations can throw while enumerating a closed stream.
  }
}

function capture(media: HTMLMediaElement): MediaStream | null {
  const source = media as HTMLMediaElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream };
  return source.captureStream?.() ?? source.mozCaptureStream?.() ?? null;
}

function waitForMetadata(media: HTMLMediaElement, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      media.removeEventListener('loadedmetadata', ready);
      media.removeEventListener('error', failed);
      signal.removeEventListener('abort', cancelled);
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const ready = () => finish();
    const failed = () => finish(new Error('The source media format could not be decoded for export.'));
    const cancelled = () => finish(new Error('Export cancelled.'));

    media.addEventListener('loadedmetadata', ready, { once: true });
    media.addEventListener('error', failed, { once: true });
    signal.addEventListener('abort', cancelled, { once: true });
    if (signal.aborted) {
      cancelled();
      return;
    }
    try {
      media.load();
    } catch {
      failed();
    }
  });
}

/** Browser-native renderer used by the dedicated export screen. It records the
 * same canvas composition used by the editor and never claims unsupported MP4. */
export async function renderProjectToBlob(
  sourceFile: File,
  subtitles: Subtitle[],
  settings: CanvasSettings,
  language: CaptionLanguage,
  options: ExportOptions,
  onProgress: (progress: number) => void,
  signal: AbortSignal,
): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
    throw new Error('This browser does not support MediaRecorder export.');
  }

  if (options.format !== 'webm') {
    const stagingBlob = await renderProjectToBlob(
      sourceFile,
      subtitles,
      settings,
      language,
      { ...options, format: 'webm', filename: 'captioncraft-staging.webm' },
      progress => onProgress(Math.min(70, progress * 0.7)),
      signal,
    );
    return transcodeWithFfmpeg(
      stagingBlob,
      options.format as FfmpegContainer,
      options.frameRate,
      options.includeAudio,
      progress => onProgress(70 + progress * 0.3),
      signal,
    );
  }

  const support = getExportFormatAvailability(options.format, options.includeAudio);
  if (!support.supported || !support.mimeType) throw new Error(support.message ?? 'The selected export format is unavailable.');

  const { width, height, videoBitsPerSecond } = getExportDimensions(options.resolution, options.aspectRatio);
  const isVideoSource = sourceFile.type.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(sourceFile.name);
  const media = document.createElement(isVideoSource ? 'video' : 'audio');
  const mediaUrl = URL.createObjectURL(sourceFile);
  let canvasStream: MediaStream | null = null;
  let sourceStream: MediaStream | null = null;
  let animation = 0;
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    cancelAnimationFrame(animation);
    stop(canvasStream);
    stop(sourceStream);
    try {
      media.pause();
      media.removeAttribute('src');
      media.load();
    } catch {
      // Media elements can throw while being torn down after a decode failure.
    }
    URL.revokeObjectURL(mediaUrl);
  };

  media.src = mediaUrl;
  media.preload = 'auto';
  media.muted = !options.includeAudio;
  if (media instanceof HTMLVideoElement) media.playsInline = true;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context || typeof canvas.captureStream !== 'function') {
    cleanup();
    throw new Error('Canvas capture is unavailable in this browser.');
  }

  try {
    await waitForMetadata(media, signal);
    if (typeof MediaStream === 'undefined') throw new Error('Media stream capture is unavailable in this browser.');

    try {
      canvasStream = canvas.captureStream(options.frameRate);
      sourceStream = capture(media);
    } catch {
      throw new Error('The browser could not capture media for export.');
    }
    if (canvasStream.getVideoTracks().length === 0) throw new Error('The browser could not create a video capture track.');
    if (options.includeAudio && !sourceStream) throw new Error('Audio capture is unavailable in this browser.');

    const audioTracks = options.includeAudio ? sourceStream?.getAudioTracks() ?? [] : [];
    if (options.includeAudio && media instanceof HTMLAudioElement && audioTracks.length === 0) {
      throw new Error('The source audio track could not be captured for export.');
    }
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]), {
        mimeType: support.mimeType,
        videoBitsPerSecond,
      });
    } catch {
      throw new Error('The selected codec could not start in this browser.');
    }

    const chunks: Blob[] = [];
    let settled = false;
    let stopReason: Error | undefined;
    let stopping = false;
    let sourceEnded = false;
    let finalFrameTimer: ReturnType<typeof setTimeout> | undefined;

    return await new Promise<Blob>((resolve, reject) => {
      const removeListeners = () => {
        media.removeEventListener('ended', ended);
        media.removeEventListener('error', mediaFailed);
        signal.removeEventListener('abort', cancelled);
        if (finalFrameTimer !== undefined) clearTimeout(finalFrameTimer);
      };
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        removeListeners();
        cleanup();
        if (error) reject(error);
        else resolve(new Blob(chunks, { type: support.mimeType ?? 'video/webm' }));
      };
      const requestStop = (error?: Error) => {
        if (error && !stopReason) stopReason = error;
        if (recorder.state === 'inactive') {
          finish(stopReason);
          return;
        }
        if (stopping) return;
        stopping = true;
        try {
          // MediaRecorder.stop() queues the final dataavailable event before
          // stop. Cleanup therefore happens only from onstop below.
          recorder.stop();
        } catch {
          finish(stopReason ?? new Error('The browser could not finish the export.'));
        }
      };
      const cancelled = () => requestStop(new Error('Export cancelled.'));
      const mediaFailed = () => requestStop(new Error('The source media could not be decoded during export.'));
      const ended = () => {
        // Draw once at the terminal media time before stopping. Without this,
        // the last subtitle/video frame can be missing from the encoded output.
        try {
          drawFrame(true);
          if (stopping || settled || signal.aborted) return;
          sourceEnded = true;
          // Canvas capture and encoding are asynchronous. Give the terminal
          // canvas frame two frame intervals before asking the recorder to
          // flush, rather than cutting off the video or source audio early.
          finalFrameTimer = setTimeout(() => requestStop(), Math.ceil(2000 / options.frameRate));
        } catch {
          requestStop(new Error('The browser could not render the final export frame.'));
        }
      };
      const drawFrame = (finalFrame = false) => {
        if (signal.aborted) {
          requestStop(new Error('Export cancelled.'));
          return;
        }
        if (settled || stopping || sourceEnded) return;
        try {
          drawBackgroundToCanvas(context, {
            themeId: settings.backgroundTheme,
            width,
            height,
            videoElement: media instanceof HTMLVideoElement ? media : null,
            isVideoMedia: media instanceof HTMLVideoElement,
            overlayOpacity: settings.backgroundOverlayOpacity,
            fitMode: settings.fitMode,
          });
          renderSubtitlesToCanvas(context, width, height, media.currentTime, subtitles, { ...settings, aspectRatio: options.aspectRatio, fontSize: settings.fontSize * (height / 600) }, language);
          if (!finalFrame) {
            onProgress(media.duration > 0 ? Math.min(99, (media.currentTime / media.duration) * 100) : 0);
            if (!media.paused && !media.ended) animation = requestAnimationFrame(() => drawFrame());
          }
        } catch {
          requestStop(new Error('The browser could not render a frame for export.'));
        }
      };
      const failed = () => requestStop(new Error('The browser stopped rendering unexpectedly.'));
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = failed;
      recorder.onstop = () => {
        if (signal.aborted) finish(new Error('Export cancelled.'));
        else if (stopReason) finish(stopReason);
        else if (!sourceEnded || chunks.length === 0) finish(new Error('The browser stopped recording before the full source was exported.'));
        else {
          onProgress(100);
          finish();
        }
      };
      signal.addEventListener('abort', cancelled, { once: true });
      media.addEventListener('ended', ended, { once: true });
      media.addEventListener('error', mediaFailed, { once: true });
      try {
        recorder.start();
        // Capture an initial frame before playback advances so short media does
        // not produce an audio-only/empty first segment.
        drawFrame();
      } catch {
        requestStop(new Error('The selected codec could not start in this browser.'));
        return;
      }
      void media.play()
        .then(() => {
          if (!settled && !stopping && !sourceEnded) {
            try {
              drawFrame();
            } catch {
              requestStop(new Error('The browser could not render a frame for export.'));
            }
          }
        })
        .catch(() => requestStop(new Error('The browser blocked media playback for export.')));
    });
  } catch (error) {
    cleanup();
    throw error instanceof Error ? error : new Error('Video rendering failed.');
  }
}
