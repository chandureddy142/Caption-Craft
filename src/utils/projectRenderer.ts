import type { CanvasSettings, CaptionLanguage, Subtitle, TimelineBgSegment } from "../types";
import { drawBackgroundToCanvas } from "./backgroundThemes";
import { renderSubtitlesToCanvas } from "./SubtitleRenderer";
import { getExportDimensions } from "./exportCapabilities";
import { type ExportOptions } from "./exportPage";
import { transcodeWithFfmpeg, type FfmpegContainer } from "../services/ffmpegExporter";

function stop(stream: MediaStream | null): void {
  try {
    stream?.getTracks().forEach(track => {
      try {
        track.stop();
      } catch {}
    });
  } catch {}
}

function capture(media: HTMLMediaElement): MediaStream | null {
  const source = media as HTMLMediaElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream };
  return source.captureStream?.() ?? source.mozCaptureStream?.() ?? null;
}

function waitForMetadata(media: HTMLMediaElement, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      media.removeEventListener("loadedmetadata", ready);
      media.removeEventListener("error", failed);
      signal.removeEventListener("abort", cancelled);
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const ready = () => finish();
    const failed = () => finish(new Error("The source media format could not be decoded for export."));
    const cancelled = () => finish(new Error("Export cancelled."));

    media.addEventListener("loadedmetadata", ready, { once: true });
    media.addEventListener("error", failed, { once: true });
    signal.addEventListener("abort", cancelled, { once: true });
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

export async function renderProjectToBlob(
  sourceFile: File,
  subtitles: Subtitle[],
  settings: CanvasSettings,
  language: CaptionLanguage,
  options: ExportOptions & {
    bgSegments?: TimelineBgSegment[];
    watermark?: boolean;
    musicUrl?: string;
    musicVolume?: number;
    audioVolume?: number;
  },
  onProgress: (progress: number) => void,
  signal: AbortSignal,
): Promise<Blob> {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    throw new Error("This browser does not support MediaRecorder export.");
  }

  // 1. If format is MKV or MOV, record intermediate staging webm/mp4, then transcode with FFmpeg
  if (options.format === "mkv" || options.format === "mov") {
    const stagingBlob = await renderProjectToBlob(
      sourceFile,
      subtitles,
      settings,
      language,
      { ...options, format: "webm", filename: "createcaptions-staging.webm" },
      progress => onProgress(Math.min(75, progress * 0.75)),
      signal,
    );
    return transcodeWithFfmpeg(
      stagingBlob,
      options.format as FfmpegContainer,
      options.frameRate,
      options.includeAudio,
      progress => onProgress(75 + progress * 0.25),
      signal,
    );
  }

  const { width, height, videoBitsPerSecond } = getExportDimensions(options.resolution, options.aspectRatio);
  const isVideoSource = sourceFile.type.startsWith("video/") || /.(mp4|mov|webm|mkv)$/i.test(sourceFile.name);
  const media = document.createElement(isVideoSource ? "video" : "audio");
  const mediaUrl = URL.createObjectURL(sourceFile);

  let songMedia: HTMLAudioElement | null = null;
  if (options.musicUrl && options.includeAudio) {
    songMedia = document.createElement("audio");
    songMedia.src = options.musicUrl;
    songMedia.preload = "auto";
  }

  let canvasStream: MediaStream | null = null;
  let mixedAudioStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let animation = 0;
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    cancelAnimationFrame(animation);
    stop(canvasStream);
    stop(mixedAudioStream);
    if (audioContext && audioContext.state !== "closed") {
      audioContext.close().catch(() => {});
    }
    try {
      media.pause();
      media.removeAttribute("src");
      media.load();
    } catch {}
    if (songMedia) {
      try {
        songMedia.pause();
        songMedia.removeAttribute("src");
        songMedia.load();
      } catch {}
    }
    URL.revokeObjectURL(mediaUrl);
  };

  media.src = mediaUrl;
  media.preload = "auto";
  if (media instanceof HTMLVideoElement) media.playsInline = true;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context || typeof canvas.captureStream !== "function") {
    cleanup();
    throw new Error("Canvas capture is unavailable in this browser.");
  }

  try {
    await waitForMetadata(media, signal);
    if (songMedia) {
      try {
        await waitForMetadata(songMedia, signal);
      } catch (e) {
        console.warn("Could not wait for song metadata:", e);
      }
    }

    // 2. Preload and cache all segment images so backdrop switching never drops or flashes black
    const imageCache = new Map<string, HTMLImageElement>();
    const segments = options.bgSegments || [];
    for (const seg of segments) {
      if (seg.themeId === "custom-image" && seg.customImageUrl) {
        if (!imageCache.has(seg.customImageUrl)) {
          const img = new Image();
          img.src = seg.customImageUrl;
          try {
            await img.decode();
          } catch {}
          imageCache.set(seg.customImageUrl, img);
        }
      }
    }

    canvasStream = canvas.captureStream(options.frameRate);
    if (canvasStream.getVideoTracks().length === 0) {
      throw new Error("The browser could not create a video capture track.");
    }

    // 3. Audio Mixing Pipeline (Voiceover + Background Music)
    if (options.includeAudio) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContext = new AudioCtx();
          const destination = audioContext.createMediaStreamDestination();

          // Voiceover node
          const mediaSource = audioContext.createMediaElementSource(media);
          const mediaGain = audioContext.createGain();
          mediaGain.gain.value = options.audioVolume ?? 1;
          mediaSource.connect(mediaGain);
          mediaGain.connect(destination);

          // Music track node
          if (songMedia && options.musicUrl) {
            const songSource = audioContext.createMediaElementSource(songMedia);
            const songGain = audioContext.createGain();
            songGain.gain.value = options.musicVolume ?? 0.8;
            songSource.connect(songGain);
            songGain.connect(destination);
          }

          mixedAudioStream = destination.stream;
        }
      } catch (audioErr) {
        console.warn("WebAudio mixer failed, falling back to direct capture:", audioErr);
        mixedAudioStream = capture(media);
      }
    }

    const audioTracks = options.includeAudio ? (mixedAudioStream?.getAudioTracks() ?? []) : [];

    // Prioritize hardware MP4 encoding if supported, else webm
    const supportedTypes = [
      "video/mp4;codecs=avc1",
      "video/mp4",
      "video/webm;codecs=h264",
      "video/webm;codecs=vp9",
      "video/webm",
    ];
    const mimeType = supportedTypes.find(t => MediaRecorder.isTypeSupported(t)) || "video/webm";

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(
        new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]),
        {
          mimeType,
          videoBitsPerSecond,
        }
      );
    } catch {
      throw new Error("The selected codec could not start in this browser.");
    }

    const chunks: Blob[] = [];
    let settled = false;
    let stopReason: Error | undefined;
    let stopping = false;
    let sourceEnded = false;
    let finalFrameTimer: ReturnType<typeof setTimeout> | undefined;

    return await new Promise<Blob>((resolve, reject) => {
      const removeListeners = () => {
        media.removeEventListener("ended", ended);
        media.removeEventListener("error", mediaFailed);
        signal.removeEventListener("abort", cancelled);
        if (finalFrameTimer !== undefined) clearTimeout(finalFrameTimer);
      };

      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        removeListeners();
        cleanup();
        if (error) reject(error);
        else resolve(new Blob(chunks, { type: mimeType }));
      };

      const requestStop = (error?: Error) => {
        if (error && !stopReason) stopReason = error;
        if (recorder.state === "inactive") {
          finish(stopReason);
          return;
        }
        if (stopping) return;
        stopping = true;
        try {
          recorder.stop();
        } catch {
          finish(stopReason ?? new Error("The browser could not finish the export."));
        }
      };

      const cancelled = () => requestStop(new Error("Export cancelled."));
      const mediaFailed = () => requestStop(new Error("The source media could not be decoded during export."));

      const ended = () => {
        try {
          drawFrame(true);
          if (stopping || settled || signal.aborted) return;
          sourceEnded = true;
          finalFrameTimer = setTimeout(() => requestStop(), Math.ceil(2000 / options.frameRate));
        } catch {
          requestStop(new Error("The browser could not render the final export frame."));
        }
      };

      const drawFrame = (finalFrame = false) => {
        if (signal.aborted) {
          requestStop(new Error("Export cancelled."));
          return;
        }
        if (settled || stopping || sourceEnded) return;

        try {
          const t = media.currentTime;
          context.clearRect(0, 0, width, height);
          context.fillStyle = "#000000";
          context.fillRect(0, 0, width, height);

          // Dynamic timeline segment evaluation
          const activeSeg = segments.find(s => t >= s.start && t < (s.end || media.duration));

          if (activeSeg) {
            let segImage: HTMLImageElement | null = null;
            if (activeSeg.themeId === "custom-image" && activeSeg.customImageUrl) {
              segImage = imageCache.get(activeSeg.customImageUrl) || null;
            }

            drawBackgroundToCanvas(context, {
              themeId: activeSeg.themeId || "midnight",
              backgroundColor: activeSeg.color || "#000000",
              width,
              height,
              videoElement: media instanceof HTMLVideoElement ? media : null,
              isVideoMedia: media instanceof HTMLVideoElement,
              customImage: segImage,
              overlayOpacity: settings.backgroundOverlayOpacity,
              fitMode: settings.fitMode,
            });
          } else {
            drawBackgroundToCanvas(context, {
              themeId: settings.backgroundTheme || "midnight",
              backgroundColor: settings.backgroundColor || "#000000",
              width,
              height,
              videoElement: media instanceof HTMLVideoElement ? media : null,
              isVideoMedia: media instanceof HTMLVideoElement,
              customImage: null,
              overlayOpacity: settings.backgroundOverlayOpacity,
              fitMode: settings.fitMode,
            });
          }

          // Render Subtitles with exact current media time
          renderSubtitlesToCanvas(
            context,
            width,
            height,
            t + 0.04,
            subtitles,
            { ...settings, aspectRatio: options.aspectRatio, fontSize: settings.fontSize * (height / 600) },
            language,
          );

          
          // Watermark pass for Starter tier (matches studio preview)
          if (options.watermark) {
            context.save();
            const evalT = t || 0;
            const totalDur = media.duration || 30;
            const intervalSec = Math.max(3.5, Math.min(6, totalDur / 5));
            const spotIndex = Math.floor(evalT / intervalSec) % 5;

            const captionY = (settings.verticalPosition ?? 0.75) * height;

            const spots = [
              { x: width * 0.50, y: height * 0.30, rot: -0.16 },
              { x: width * 0.50, y: captionY,     rot: 0.10  },
              { x: width * 0.54, y: height * 0.44, rot: -0.22 },
              { x: width * 0.46, y: height * 0.58, rot: 0.18  },
              { x: width * 0.50, y: Math.max(height * 0.25, captionY - 40), rot: -0.12 }
            ];

            const activeSpot = spots[spotIndex];
            context.translate(activeSpot.x, activeSpot.y);
            context.rotate(activeSpot.rot);

            const fontSize = Math.round(width * 0.085);
            context.font = `900 ${fontSize}px Inter, -apple-system, sans-serif`;
            context.textAlign = "center";
            context.textBaseline = "middle";

            context.lineWidth = Math.max(2, Math.round(fontSize * 0.055));
            context.strokeStyle = "rgba(0, 0, 0, 0.50)";
            context.lineJoin = "round";
            context.strokeText("Create Captions", 0, 0);

            context.fillStyle = "rgba(255, 255, 255, 0.32)";
            context.fillText("Create Captions", 0, 0);

            context.restore();
          }

          if (!finalFrame) {
            onProgress(media.duration > 0 ? Math.min(99, (media.currentTime / media.duration) * 100) : 0);
            if (!media.paused && !media.ended) {
              animation = requestAnimationFrame(() => drawFrame());
            }
          }
        } catch {
          requestStop(new Error("The browser could not render a frame for export."));
        }
      };

      const failed = () => requestStop(new Error("The browser stopped rendering unexpectedly."));
      recorder.ondataavailable = event => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = failed;
      recorder.onstop = () => {
        if (signal.aborted) finish(new Error("Export cancelled."));
        else if (stopReason) finish(stopReason);
        else if (!sourceEnded || chunks.length === 0) finish(new Error("The browser stopped recording before the full source was exported."));
        else {
          onProgress(100);
          finish();
        }
      };

      signal.addEventListener("abort", cancelled, { once: true });
      media.addEventListener("ended", ended, { once: true });
      media.addEventListener("error", mediaFailed, { once: true });

      try {
        recorder.start();
        drawFrame();
      } catch {
        requestStop(new Error("The selected codec could not start in this browser."));
        return;
      }

      if (audioContext && audioContext.state === "suspended") {
        void audioContext.resume();
      }

      if (songMedia) {
        songMedia.currentTime = 0;
        void songMedia.play().catch(() => {});
      }

      void media.play()
        .then(() => {
          if (!settled && !stopping && !sourceEnded) {
            try {
              drawFrame();
            } catch {
              requestStop(new Error("The browser could not render a frame for export."));
            }
          }
        })
        .catch(() => requestStop(new Error("The browser blocked media playback for export.")));
    });
  } catch (error) {
    cleanup();
    throw error instanceof Error ? error : new Error("Video rendering failed.");
  }
}
