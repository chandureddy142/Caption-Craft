import type { CanvasSettings } from "../types";

export interface BackgroundThemeOption {
  id: string;
  name: string;
  previewCss: string;
}

export const BACKGROUND_THEMES: BackgroundThemeOption[] = [
  { id: "original-video", name: "Original Video", previewCss: "linear-gradient(135deg, #1e293b, #0f172a)" },
  { id: "midnight", name: "Solid Base", previewCss: "#000000" },
  { id: "sunset-mesh", name: "Sunset", previewCss: "linear-gradient(135deg, #ff512f, #dd2476)" },
  { id: "deep-blue", name: "Deep Blue", previewCss: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" },
  { id: "purple-haze", name: "Purple Haze", previewCss: "linear-gradient(135deg, #7f00ff, #e100ff)" },
  { id: "emerald", name: "Emerald", previewCss: "linear-gradient(135deg, #0ba360, #3cba92)" },
  { id: "crimson-tide", name: "Crimson", previewCss: "linear-gradient(135deg, #642b73, #c6426e)" },
  { id: "cyber-punk", name: "Cyberpunk", previewCss: "linear-gradient(135deg, #ff0844, #ffb199)" },
  { id: "aurora", name: "Aurora", previewCss: "linear-gradient(135deg, #00c6ff, #0072ff)" },
  { id: "golden-hour", name: "Gold", previewCss: "linear-gradient(135deg, #f7971e, #ffd200)" },
  { id: "midnight-neon", name: "Midnight", previewCss: "linear-gradient(135deg, #182848, #4b6cb7)" },
  { id: "dark-matter", name: "Obsidian", previewCss: "linear-gradient(135deg, #232526, #414345)" },
  { id: "pattern-grid", name: "Grid", previewCss: "radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), #0f172a" },
  { id: "pattern-dots", name: "Dots", previewCss: "radial-gradient(rgba(255,255,255,0.15) 1.5px, transparent 1.5px), #1e1b4b" },
  { id: "pattern-lines", name: "Lines", previewCss: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 0, transparent 10px), #0c1017" },
  { id: "pattern-carbon", name: "Carbon", previewCss: "linear-gradient(27deg, #151515 5px, transparent 5px) 0 5px, linear-gradient(207deg, #151515 5px, transparent 5px) 10px 0px, #111" },
  { id: "pattern-cubes", name: "Blueprint", previewCss: "linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px), #030712" },
  { id: "pattern-hex", name: "Hexagon", previewCss: "radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.15) 20%, transparent 20%), #090b10" },
  { id: "pattern-paper", name: "Paper", previewCss: "radial-gradient(#ffffff 0.5px, transparent 0.5px), #1e293b" },
  { id: "pattern-noise", name: "Studio", previewCss: "radial-gradient(circle at center, #1e293b 0%, #090d16 100%)" },
  { id: "pattern-scanlines", name: "Scanlines", previewCss: "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 2px), #1e1b4b" },
  { id: "pattern-glow", name: "Glow Orb", previewCss: "radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.4) 0%, transparent 70%), #020617" }
];

export interface DrawBackgroundOptions {
  themeId: string;
  width: number;
  height: number;
  backgroundColor?: string;
  videoElement?: HTMLVideoElement | null;
  isVideoMedia?: boolean;
  customImage?: HTMLImageElement | null;
  customVideoElement?: HTMLVideoElement | null;
  overlayOpacity?: number;
  fitMode?: CanvasSettings["fitMode"];
}


function drawMediaItem(
  ctx: CanvasRenderingContext2D,
  media: HTMLImageElement | HTMLVideoElement,
  canvasWidth: number,
  canvasHeight: number,
  mode: "cover" | "contain" | "stretch" | "blur-fill" = "cover"
) {
  const mediaWidth = "videoWidth" in media ? media.videoWidth || media.clientWidth : media.naturalWidth || media.width;
  const mediaHeight = "videoHeight" in media ? media.videoHeight || media.clientHeight : media.naturalHeight || media.height;

  if (!mediaWidth || !mediaHeight) {
    ctx.drawImage(media, 0, 0, canvasWidth, canvasHeight);
    return;
  }

  if (mode === "stretch") {
    ctx.drawImage(media, 0, 0, canvasWidth, canvasHeight);
    return;
  }

  const canvasRatio = canvasWidth / canvasHeight;
  const mediaRatio = mediaWidth / mediaHeight;

  if (mode === "blur-fill") {
    // 1. Draw blurred, zoomed background to fill bars
    ctx.save();
    let bgSWidth = mediaWidth;
    let bgSHeight = mediaHeight;
    let bgSx = 0;
    let bgSy = 0;
    if (mediaRatio > canvasRatio) {
      bgSWidth = mediaHeight * canvasRatio;
      bgSx = (mediaWidth - bgSWidth) / 2;
    } else {
      bgSHeight = mediaWidth / canvasRatio;
      bgSy = (mediaHeight - bgSHeight) / 2;
    }
    ctx.filter = "blur(22px) brightness(0.65)";
    ctx.drawImage(media, bgSx, bgSy, bgSWidth, bgSHeight, -20, -20, canvasWidth + 40, canvasHeight + 40);
    ctx.restore();

    // 2. Draw sharp, aspect-ratio preserved media centered on top
    let dWidth = canvasWidth;
    let dHeight = canvasHeight;
    let dx = 0;
    let dy = 0;
    if (mediaRatio > canvasRatio) {
      dHeight = canvasWidth / mediaRatio;
      dy = (canvasHeight - dHeight) / 2;
    } else {
      dWidth = canvasHeight * mediaRatio;
      dx = (canvasWidth - dWidth) / 2;
    }
    ctx.drawImage(media, 0, 0, mediaWidth, mediaHeight, dx, dy, dWidth, dHeight);
    return;
  }

  let sWidth = mediaWidth;
  let sHeight = mediaHeight;
  let sx = 0;
  let sy = 0;

  let dWidth = canvasWidth;
  let dHeight = canvasHeight;
  let dx = 0;
  let dy = 0;

  if (mode === "cover") {
    if (mediaRatio > canvasRatio) {
      sWidth = mediaHeight * canvasRatio;
      sx = (mediaWidth - sWidth) / 2;
    } else {
      sHeight = mediaWidth / canvasRatio;
      sy = (mediaHeight - sHeight) / 2;
    }
    ctx.drawImage(media, sx, sy, sWidth, sHeight, 0, 0, canvasWidth, canvasHeight);
  } else {
    // contain / fit
    if (mediaRatio > canvasRatio) {
      dHeight = canvasWidth / mediaRatio;
      dy = (canvasHeight - dHeight) / 2;
    } else {
      dWidth = canvasHeight * mediaRatio;
      dx = (canvasWidth - dWidth) / 2;
    }
    ctx.drawImage(media, 0, 0, mediaWidth, mediaHeight, dx, dy, dWidth, dHeight);
  }
}

export function drawBackgroundToCanvas(ctx: CanvasRenderingContext2D, options: DrawBackgroundOptions) {
  const { themeId, width, height, backgroundColor, fitMode, videoElement, isVideoMedia, customImage, customVideoElement } = options;

  ctx.save();

  const mode = (fitMode as "cover" | "contain" | "stretch") || "cover";

  if (themeId === "custom-image" && customImage) {
    drawMediaItem(ctx, customImage, width, height, mode);
    ctx.restore();
    return;
  }

  if (themeId === "custom-video" && customVideoElement) {
    drawMediaItem(ctx, customVideoElement, width, height, mode);
    ctx.restore();
    return;
  }

  if (themeId === "original-video" && isVideoMedia && videoElement) {
    drawMediaItem(ctx, videoElement, width, height, mode);
    ctx.restore();
    return;
  }

  // Gradients
  if (themeId === "sunset-mesh" || themeId === "gradient-sunset") {
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#ff512f");
    g.addColorStop(1, "#dd2476");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === "deep-blue") {
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#0f2027");
    g.addColorStop(0.5, "#203a43");
    g.addColorStop(1, "#2c5364");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === "purple-haze") {
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#7f00ff");
    g.addColorStop(1, "#e100ff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === "emerald") {
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#0ba360");
    g.addColorStop(1, "#3cba92");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === "crimson-tide") {
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#642b73");
    g.addColorStop(1, "#c6426e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === "cyber-punk") {
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#ff0844");
    g.addColorStop(1, "#ffb199");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === "aurora" || themeId === "gradient-aurora") {
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#00c6ff");
    g.addColorStop(1, "#0072ff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === "golden-hour") {
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#f7971e");
    g.addColorStop(1, "#ffd200");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === "midnight-neon") {
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#182848");
    g.addColorStop(1, "#4b6cb7");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === "dark-matter") {
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#232526");
    g.addColorStop(1, "#414345");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  } 
  // Patterns
  else if (themeId === "pattern-grid") {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (themeId === "pattern-dots") {
    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    for (let x = 12; x < width; x += 20) {
      for (let y = 12; y < height; y += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (themeId === "pattern-lines") {
    ctx.fillStyle = "#0c1017";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 2;
    for (let x = -height; x < width + height; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }
  } else if (themeId === "pattern-carbon") {
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#1c1c1c";
    for (let x = 0; x < width; x += 16) {
      for (let y = 0; y < height; y += 16) {
        if ((x / 16 + y / 16) % 2 === 0) {
          ctx.fillRect(x, y, 16, 16);
        }
      }
    }
  } else if (themeId === "pattern-cubes") {
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
    ctx.lineWidth = 1.5;
    for (let x = 0; x < width; x += 32) {
      ctx.strokeRect(x, 0, 32, height);
    }
    for (let y = 0; y < height; y += 32) {
      ctx.strokeRect(0, y, width, 32);
    }
  } else if (themeId === "pattern-hex") {
    ctx.fillStyle = "#090b10";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(168, 85, 247, 0.2)";
    for (let x = 10; x < width; x += 28) {
      for (let y = 10; y < height; y += 28) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (themeId === "pattern-paper") {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    for (let x = 6; x < width; x += 14) {
      for (let y = 6; y < height; y += 14) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  } else if (themeId === "pattern-noise") {
    const rad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, Math.max(width, height) / 1.2);
    rad.addColorStop(0, "#1e293b");
    rad.addColorStop(1, "#090d16");
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === "pattern-scanlines") {
    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }
  } else if (themeId === "pattern-glow") {
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, width, height);
    const rad = ctx.createRadialGradient(width / 2, height * 0.35, 10, width / 2, height * 0.35, width * 0.8);
    rad.addColorStop(0, "rgba(139, 92, 246, 0.65)");
    rad.addColorStop(1, "transparent");
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Solid plain color
    ctx.fillStyle = backgroundColor || (themeId.startsWith("#") ? themeId : "#ffffff");
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

export function getBackgroundTheme(id: string) {
  return BACKGROUND_THEMES.find(t => t.id === id) || BACKGROUND_THEMES[0];
}
