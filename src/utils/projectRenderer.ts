import type { CanvasSettings, CaptionLanguage, ExportResolutionPreset, Subtitle } from '../types';
import { drawBackgroundToCanvas } from './backgroundThemes';
import { renderSubtitlesToCanvas } from './SubtitleRenderer';
import { getExportDimensions } from './exportCapabilities';
import { getExportFormatAvailability, type ExportOptions } from './exportPage';

function stop(stream: MediaStream | null): void {
  stream?.getTracks().forEach(track => track.stop());
}

function capture(media: HTMLMediaElement): MediaStream | null {
  const source = media as HTMLMediaElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream };
  return source.captureStream?.() ?? source.mozCaptureStream?.() ?? null;
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
  if (!('MediaRecorder' in window)) throw new Error('This browser does not support MediaRecorder export.');
  const support = getExportFormatAvailability(options.format, options.includeAudio);
  if (!support.supported || !support.mimeType) throw new Error(support.message ?? 'The selected export format is unavailable.');

  const { width, height, videoBitsPerSecond } = getExportDimensions(options.resolution, options.aspectRatio);
  const media = document.createElement(sourceFile.type.startsWith('video/') ? 'video' : 'audio');
  const mediaUrl = URL.createObjectURL(sourceFile);
  media.src = mediaUrl;
  media.preload = 'auto';
  media.muted = !options.includeAudio;
  if (media instanceof HTMLVideoElement) media.playsInline = true;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context || typeof canvas.captureStream !== 'function') throw new Error('Canvas capture is unavailable in this browser.');

  await new Promise<void>((resolve, reject) => {
    const ready = () => resolve();
    const failed = () => reject(new Error('The source media format could not be decoded for export.'));
    media.addEventListener('loadedmetadata', ready, { once: true });
    media.addEventListener('error', failed, { once: true });
    media.load();
  });

  const canvasStream = canvas.captureStream(options.frameRate);
  const sourceStream = capture(media);
  const audioTracks = options.includeAudio ? sourceStream?.getAudioTracks() ?? [] : [];
  const combined = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
  const recorder = new MediaRecorder(combined, { mimeType: support.mimeType, videoBitsPerSecond });
  const chunks: Blob[] = [];
  let animation = 0;
  let settled = false;

  const cleanup = () => {
    cancelAnimationFrame(animation);
    stop(canvasStream);
    stop(sourceStream);
    URL.revokeObjectURL(mediaUrl);
    media.removeAttribute('src');
    media.load();
  };

  return await new Promise<Blob>((resolve, reject) => {
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve(new Blob(chunks, { type: support.mimeType ?? 'video/webm' }));
    };
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => finish(new Error('The browser stopped rendering unexpectedly.'));
    recorder.onstop = () => signal.aborted ? finish(new Error('Export cancelled.')) : finish();
    signal.addEventListener('abort', () => {
      if (recorder.state !== 'inactive') recorder.stop();
      else finish(new Error('Export cancelled.'));
    }, { once: true });
    const draw = () => {
      if (signal.aborted) { if (recorder.state !== 'inactive') recorder.stop(); return; }
      drawBackgroundToCanvas(context, {
        themeId: settings.backgroundTheme,
        width,
        height,
        videoElement: media instanceof HTMLVideoElement ? media : null,
        isVideoMedia: media instanceof HTMLVideoElement,
        overlayOpacity: settings.backgroundOverlayOpacity,
        fitMode: settings.fitMode,
      });
      renderSubtitlesToCanvas(context, width, height, media.currentTime, subtitles, { ...settings, fontSize: settings.fontSize * (height / 600) }, language);
      onProgress(media.duration > 0 ? Math.min(99, (media.currentTime / media.duration) * 100) : 0);
      if (!media.paused && !media.ended) animation = requestAnimationFrame(draw);
    };
    media.addEventListener('ended', () => { onProgress(100); if (recorder.state !== 'inactive') recorder.stop(); }, { once: true });
    try {
      recorder.start();
    } catch {
      finish(new Error('The selected codec could not start in this browser.'));
      return;
    }
    void media.play().then(draw).catch(() => finish(new Error('The browser blocked media playback for export.')));
  });
}
