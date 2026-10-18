import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CaptionTemplateDefinition } from "../types";
import { renderSubtitlesToCanvas } from "../utils/SubtitleRenderer";
import {
  PREVIEW_IDLE_TIME,
  PREVIEW_SUBTITLES,
  getPreviewFrameTime,
  getPreviewSettings,
} from "../utils/captionTemplates";

interface AnimatedTemplatePreviewProps {
  template: CaptionTemplateDefinition;
  isHovered?: boolean;
}

export default function AnimatedTemplatePreview({ template, isHovered = true }: AnimatedTemplatePreviewProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const frame = canvasRef.current?.parentElement;
    if (!frame) return undefined;
    const measure = (): void => {
      setSize({
        width: Math.round(frame.clientWidth),
        height: Math.round(frame.clientHeight) || 140,
      });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const dpr = typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;
  const pxWidth = Math.max(1, Math.round(size.width * dpr));
  const pxHeight = Math.max(1, Math.round(size.height * dpr));
  const previewSettings = useMemo(() => getPreviewSettings(template, pxWidth), [template, pxWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const paint = (time: number | null): void => {
      ctx.clearRect(0, 0, pxWidth, pxHeight);
      if (time !== null) {
        renderSubtitlesToCanvas(ctx, pxWidth, pxHeight, time, PREVIEW_SUBTITLES, previewSettings, "en", null);
      }
    };

    const reduceMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isHovered || reduceMotion) {
      let cancelled = false;
      paint(PREVIEW_IDLE_TIME);
      if (document.fonts?.ready) {
        void document.fonts.ready.then(() => {
          if (!cancelled) paint(PREVIEW_IDLE_TIME);
        });
      }
      return () => {
        cancelled = true;
      };
    }

    let rafId = 0;
    const startedAt = performance.now();
    const tick = (now: number): void => {
      paint(getPreviewFrameTime((now - startedAt) / 1000));
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [size, isHovered, previewSettings, pxHeight, pxWidth]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <canvas
        ref={canvasRef}
        width={pxWidth}
        height={pxHeight}
        aria-label={`${template.name} caption preview`}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
    </div>
  );
}
