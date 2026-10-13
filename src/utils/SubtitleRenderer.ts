import type { CanvasSettings, Subtitle, CaptionLanguage } from '../types';
import { getCaptionText } from './transliterate';

export interface SubtitleCanvasLayout {
  subtitle: Subtitle;
  x: number;
  left: number;
  y: number;
  width: number;
  height: number;
  lineHeight: number;
  lines: string[];
}

/**
 * Returns the rendered bounds for the subtitle currently visible on the
 * canvas. Keeping hit testing here means the editor uses the same font,
 * transliteration, and placement rules as the renderer itself.
 */
export function getSubtitleCanvasLayout(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  subtitles: Subtitle[],
  settings: CanvasSettings,
  language: CaptionLanguage,
): SubtitleCanvasLayout | null {
  const subtitle = subtitles.find(s => currentTime >= s.start && currentTime <= s.end);
  if (!subtitle) return null;

  const isTelugu = language === 'te' || /[\u0C00-\u0C7F]/.test(subtitle.text);
  const fontFamily = isTelugu
    ? "'Noto Sans Telugu', 'Inter', sans-serif"
    : `${settings.fontFamily}, 'Noto Sans Telugu', sans-serif`;
  const lineHeight = settings.fontSize * (isTelugu ? 1.35 : 1.2);
  const lines = getCaptionText(subtitle.text, language, subtitle.tenglishText).split('\n');

  ctx.save();
  ctx.font = `bold ${settings.fontSize}px ${fontFamily}`;
  const lineWidths = lines.map(line => ctx.measureText(
    line
  ).width);
  ctx.restore();

  const horizontalPadding = settings.style === 'box' || settings.textBackground ? 40 : settings.style === 'outline' ? 12 : 0;
  const verticalPadding = settings.style === 'box' || settings.textBackground ? 20 : settings.style === 'outline' ? 12 : 0;
  const maxLineWidth = Math.max(...lineWidths, 0);
  const renderedHeight = lines.length * lineHeight;
  const blockLeft = width / 2 - maxLineWidth / 2;
  const textX = settings.alignment === 'left'
    ? blockLeft
    : settings.alignment === 'right'
      ? blockLeft + maxLineWidth
      : width / 2;
  const x = textX;
  const y = height * settings.verticalPosition;

  return {
    subtitle,
    x,
    left: blockLeft - horizontalPadding / 2,
    y,
    width: maxLineWidth + horizontalPadding,
    height: renderedHeight + verticalPadding,
    lineHeight,
    lines
  };
}

export function renderSubtitlesToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  subtitles: Subtitle[],
  settings: CanvasSettings,
  language: CaptionLanguage,
  selectedSubtitleId?: string | null,
) {
  // Find active subtitle
  const activeSub = subtitles.find(s => currentTime >= s.start && currentTime <= s.end);

  if (!activeSub) return;

  // Basic styling
  ctx.textAlign = settings.alignment;
  ctx.textBaseline = 'middle';
  
  // Use Noto Sans Telugu for Telugu Lipi or whenever Telugu text is detected
  const isTelugu = language === 'te' || /[\u0C00-\u0C7F]/.test(activeSub.text);
  const fontFamily = isTelugu
    ? "'Noto Sans Telugu', 'Inter', sans-serif"
    : `${settings.fontFamily}, 'Noto Sans Telugu', sans-serif`;
  ctx.font = `bold ${settings.fontSize}px ${fontFamily}`;
  
  const x = width / 2;
  const y = height * settings.verticalPosition;

  let activeWordObj = null;

  if (activeSub.words && settings.style === 'kinetic') {
    // Find active word
    activeWordObj = activeSub.words.find(w => currentTime >= w.start && currentTime <= w.end);
  }
  const activeWordText = activeWordObj
    ? getCaptionText(activeWordObj.word, language)
    : undefined;

  const lines = getCaptionText(activeSub.text, language, activeSub.tenglishText).split('\n');
  const lineHeight = settings.fontSize * (isTelugu ? 1.35 : 1.2);
  const lineWidths = lines.map(line => ctx.measureText(line).width);
  const blockWidth = Math.max(...lineWidths, 0);
  const blockLeft = x - blockWidth / 2;
  const textX = settings.alignment === 'left'
    ? blockLeft
    : settings.alignment === 'right'
      ? blockLeft + blockWidth
      : x;
  const drawBackground = settings.style === 'box' || settings.textBackground;

  lines.forEach((line, index) => {
    const lineY = y + (index - (lines.length - 1) / 2) * lineHeight;
    const transliteratedLine = line;

    if (drawBackground) {
      const metrics = ctx.measureText(transliteratedLine);
      const boxWidth = metrics.width + 40;
      const boxHeight = lineHeight + 20;
      const boxLeft = settings.alignment === 'left'
        ? textX - 20
        : settings.alignment === 'right'
          ? textX - boxWidth + 20
          : textX - boxWidth / 2;
      ctx.fillStyle = settings.boxColor || 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(boxLeft, lineY - boxHeight / 2, boxWidth, boxHeight, 10);
      ctx.fill();
    }

    if (settings.style === 'box') {
      ctx.fillStyle = settings.textColor;
      ctx.fillText(transliteratedLine, textX, lineY);
    } else if (settings.style === 'outline') {
      ctx.lineWidth = Math.max(4, Math.round(settings.fontSize * 0.12));
      ctx.strokeStyle = settings.boxColor || '#000000';
      ctx.lineJoin = 'round';
      ctx.strokeText(transliteratedLine, textX, lineY);
      
      ctx.fillStyle = settings.textColor;
      ctx.fillText(transliteratedLine, textX, lineY);
    } else if (settings.style === 'kinetic') {
      if (activeWordObj) {
        // Word-level highlighting: active word in highlightColor, others in textColor
        const words = line.split(' ');
        let totalWidth = 0;
        const wordMetrics = words.map(w => {
          const tW = w;
          const wWidth = ctx.measureText(tW + ' ').width;
          totalWidth += wWidth;
          return { original: w, transliterated: tW, width: wWidth };
        });

        let currentX = settings.alignment === 'left'
          ? blockLeft
          : settings.alignment === 'right'
            ? blockLeft + blockWidth - totalWidth
            : x - totalWidth / 2;
        ctx.save();
        ctx.textAlign = 'center';
        
        words.forEach((w, i) => {
          const wObj = wordMetrics[i];
          const isMatch = Boolean(activeWordText && (
            w === activeWordText ||
            w.replace(/[^\p{L}\p{N}]/gu, '') === activeWordText.replace(/[^\p{L}\p{N}]/gu, '')
          ));
          
          if (isMatch) {
            ctx.fillStyle = settings.highlightColor;
            ctx.shadowColor = 'rgba(0,0,0,0.85)';
            ctx.shadowBlur = 12;
          } else {
            ctx.fillStyle = settings.textColor;
            ctx.shadowColor = 'transparent';
          }
          
          ctx.fillText(wObj.transliterated, currentX + wObj.width / 2, lineY);
          currentX += wObj.width;
        });
        ctx.restore();
      } else {
        // If no word is currently active, render standard textColor with readability shadow
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = settings.textColor;
        ctx.fillText(transliteratedLine, textX, lineY);
        ctx.shadowColor = 'transparent';
      }
    } else if (settings.style === 'minimalist') {
      // Minimalist
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = settings.textColor;
       ctx.fillText(transliteratedLine, textX, lineY);
      ctx.shadowColor = 'transparent'; // reset
    }
  });

  if (selectedSubtitleId === activeSub.id) {
    const layout = getSubtitleCanvasLayout(ctx, width, height, currentTime, subtitles, settings, language);
    if (layout) {
      ctx.save();
      ctx.strokeStyle = settings.highlightColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]);
      ctx.strokeRect(
        layout.left - 10,
        layout.y - layout.height / 2 - 8,
        layout.width + 20,
        layout.height + 16,
      );
      ctx.restore();
    }
  }
}
