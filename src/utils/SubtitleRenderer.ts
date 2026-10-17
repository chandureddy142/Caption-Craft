import type { CanvasSettings, Subtitle, CaptionLanguage, WordStyleRule } from '../types';
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
  fontSize: number;
}

const DEFAULT_PAD_X = 10;
const DEFAULT_PAD_Y = 4;

function isTeluguText(text: string): boolean {
  return /[\u0C00-\u0C7F]/.test(text);
}

function withTeluguFallback(fontFamily: string, isTelugu: boolean): string {
  if (!isTelugu || /Noto Sans Telugu/i.test(fontFamily)) return fontFamily;
  return `${fontFamily}, 'Noto Sans Telugu', sans-serif`;
}

function fontString(style: 'normal' | 'italic', weight: string, size: number, family: string): string {
  return `${style === 'italic' ? 'italic ' : ''}${weight} ${size}px ${family}`;
}

function wrapCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontFamily: string,
  fontSize: number,
): { lines: string[]; fontSize: number } {
  let size = fontSize;
  const words = text.split(/\s+/).filter(Boolean);
  while (size >= 18) {
    ctx.font = `700 ${size}px ${fontFamily}`;
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(candidate).width > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    if (lines.length <= 3 && lines.every(line => ctx.measureText(line).width <= maxWidth)) {
      return { lines, fontSize: size };
    }
    size -= 2;
  }
  ctx.font = `700 18px ${fontFamily}`;
  return { lines: [text], fontSize: 18 };
}

function baseFontFamily(settings: CanvasSettings, text: string, language: CaptionLanguage): string {
  const isTelugu = language === 'te' || isTeluguText(text);
  return withTeluguFallback(isTelugu ? "'Noto Sans Telugu', 'Inter', sans-serif" : settings.fontFamily, isTelugu);
}

function resolveCaptionText(subtitle: Subtitle, settings: CanvasSettings, language: CaptionLanguage): string {
  const text = getCaptionText(subtitle.text, language, subtitle.tenglishText);
  return settings.textTransform === 'uppercase' ? text.toUpperCase() : text;
}

export function getSubtitleCanvasLayout(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  subtitles: Subtitle[],
  settings: CanvasSettings,
  language: CaptionLanguage,
): SubtitleCanvasLayout | null {
  const subtitle = subtitles.find(item => currentTime >= item.start && currentTime <= item.end);
  if (!subtitle) return null;
  const rawText = resolveCaptionText(subtitle, settings, language);
  const fontFamily = baseFontFamily(settings, rawText, language);
  const wrapped = wrapCaption(ctx, rawText, width * 0.8, fontFamily, settings.fontSize);
  const isTelugu = language === 'te' || isTeluguText(rawText);
  const lineHeight = wrapped.fontSize * (isTelugu ? 1.35 : 1.2);
  ctx.font = `${settings.fontWeight ?? '700'} ${wrapped.fontSize}px ${fontFamily}`;
  const lineWidths = wrapped.lines.map(line => ctx.measureText(line).width);
  const horizontalPadding = settings.style === 'box' || settings.textBackground ? 40 : settings.style === 'outline' ? 12 : 0;
  const verticalPadding = settings.style === 'box' || settings.textBackground ? 20 : settings.style === 'outline' ? 12 : 0;
  const maxLineWidth = Math.max(...lineWidths, 0);
  const renderedHeight = wrapped.lines.length * lineHeight;
  const margin = 24;
  let blockLeft: number;
  if (settings.alignment === 'left') {
    blockLeft = margin + horizontalPadding / 2;
  } else if (settings.alignment === 'right') {
    blockLeft = width - margin - maxLineWidth - horizontalPadding / 2;
  } else {
    blockLeft = width / 2 - maxLineWidth / 2;
  }
  const x = settings.alignment === 'left' ? blockLeft : settings.alignment === 'right' ? blockLeft + maxLineWidth : width / 2;
  const y = Math.min(
    height * 0.9 - renderedHeight / 2,
    Math.max(height * 0.1 + renderedHeight / 2, height * settings.verticalPosition),
  );
  return {
    subtitle,
    x,
    left: blockLeft - horizontalPadding / 2,
    y,
    width: maxLineWidth + horizontalPadding,
    height: renderedHeight + verticalPadding,
    lineHeight,
    lines: wrapped.lines,
    fontSize: wrapped.fontSize,
  };
}

/** Dual-word rule: rule[index % rules.length] (word 0 = base, word 1 = accent). */
function ruleFor(settings: CanvasSettings, index: number): WordStyleRule | undefined {
  const patterns = settings.wordPatterns;
  return patterns && patterns.length > 0 ? patterns[index % patterns.length] : undefined;
}

function wordFont(settings: CanvasSettings, rule: WordStyleRule | undefined, text: string, language: CaptionLanguage): string {
  const family = rule?.fontFamily || settings.fontFamily;
  return withTeluguFallback(family, language === 'te' || isTeluguText(text));
}

function activeProgress(currentTime: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (currentTime - start) / Math.max(0.001, end - start)));
}

interface MeasuredWord {
  displayWord: string;
  rule: WordStyleRule | undefined;
  size: number;
  font: string;
  weight: string;
  fontStyle: 'normal' | 'italic';
  textWidth: number;
  padX: number;
  padY: number;
  /** Width of the word slot (text + box padding), excluding the trailing space. */
  slotWidth: number;
  /** Slot plus the gap before the next word. */
  advance: number;
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
): void {
  const activeSub = subtitles.find(item => currentTime >= item.start && currentTime <= item.end);
  if (!activeSub) return;
  const rawText = resolveCaptionText(activeSub, settings, language);
  const layout = getSubtitleCanvasLayout(ctx, width, height, currentTime, subtitles, settings, language);
  if (!layout) return;

  ctx.textAlign = settings.alignment;
  ctx.textBaseline = 'middle';
  const animation = settings.animation ?? 'none';
  const hasWordTimeline = Boolean(activeSub.words?.length);
  const baseFamily = baseFontFamily(settings, rawText, language);
  const baseWeight: string = settings.fontWeight ?? '700';
  const lines = layout.lines;
  const lineHeight = layout.lineHeight;
  const x = settings.alignment === 'left' ? layout.left : settings.alignment === 'right' ? layout.left + layout.width : width / 2;
  const drawBackground = settings.style === 'box' || settings.textBackground;
  const lineProgress = activeProgress(currentTime, activeSub.start, activeSub.end);
  let globalWordIndex = 0;

  lines.forEach((line, lineIndex) => {
    const lineY = layout.y + (lineIndex - (lines.length - 1) / 2) * lineHeight;
    const words = line.split(/\s+/).filter(Boolean);

    // Measure every word with ITS OWN font so boxes and spacing match the preview.
    const measured: MeasuredWord[] = words.map((word, wordIndex) => {
      const rule = ruleFor(settings, globalWordIndex + wordIndex);
      const size = layout.fontSize * (rule?.fontSizeMultiplier ?? 1);
      const displayWord = rule?.uppercase ? word.toUpperCase() : word;
      const font = wordFont(settings, rule, displayWord, language);
      const weight: string = rule?.fontWeight ?? baseWeight;
      const fontStyle = rule?.fontStyle ?? 'normal';
      ctx.font = fontString(fontStyle, weight, size, font);
      const textWidth = ctx.measureText(displayWord).width;
      const spaceWidth = ctx.measureText(' ').width;
      const hasBox = Boolean(rule?.backgroundColor);
      const scaleToSize = layout.fontSize / Math.max(1, settings.fontSize);
      const padX = hasBox ? (rule?.paddingX ?? DEFAULT_PAD_X) * scaleToSize : 0;
      const padY = hasBox ? (rule?.paddingY ?? DEFAULT_PAD_Y) * scaleToSize : 0;
      const slotWidth = textWidth + padX * 2;
      return { displayWord, rule, size, font, weight, fontStyle, textWidth, padX, padY, slotWidth, advance: slotWidth + spaceWidth };
    });

    const lastAdvanceGap = measured.length > 0 ? measured[measured.length - 1].advance - measured[measured.length - 1].slotWidth : 0;
    const totalWidth = measured.reduce((sum, item) => sum + item.advance, 0) - lastAdvanceGap;
    const lineLeft = settings.alignment === 'left'
      ? layout.left
      : settings.alignment === 'right'
        ? layout.left + layout.width - totalWidth
        : x - totalWidth / 2;

    const entryProgress = Math.min(1, lineProgress / 0.25);
    const lineOffsetY = animation === 'slide-up' ? (1 - entryProgress) * 16 : 0;
    const lineOffsetX = animation === 'slide-left' ? (1 - entryProgress) * width * 0.12 : 0;
    const lineScale = animation === 'zoom-in'
      ? 0.7 + 0.3 * (entryProgress + Math.sin(entryProgress * Math.PI) * 0.08)
      : 1;
    const flipScaleY = animation === 'flip-in' ? Math.max(0.01, entryProgress) : 1;

    ctx.save();
    ctx.globalAlpha = animation === 'fade' ? Math.min(1, lineProgress * 1.5) : 1;
    if (typeof ctx.translate === 'function' && typeof ctx.scale === 'function') {
      ctx.translate(x + lineOffsetX, lineY + lineOffsetY);
      ctx.scale(lineScale, flipScaleY);
      ctx.translate(-x, -lineY);
    }
    if (animation === 'wipe-right' && typeof ctx.rect === 'function' && typeof ctx.clip === 'function') {
      ctx.beginPath();
      ctx.rect(0, 0, width * lineProgress, height);
      ctx.clip();
    }

    if (drawBackground) {
      ctx.save();
      ctx.fillStyle = settings.boxColor || 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      const boxWidth = totalWidth + 40;
      const boxLeft = settings.alignment === 'center' ? x - boxWidth / 2 : lineLeft - 20;
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(boxLeft, lineY - (lineHeight + 20) / 2, boxWidth, lineHeight + 20, 10);
        ctx.fill();
      } else if (typeof ctx.fillRect === 'function') {
        ctx.fillRect(boxLeft, lineY - (lineHeight + 20) / 2, boxWidth, lineHeight + 20);
      }
      ctx.restore();
    }

    let cursorX = lineLeft;
    measured.forEach((item, wordIndex) => {
      const timelineWord = activeSub.words?.[globalWordIndex + wordIndex];
      const isActive = Boolean(timelineWord && currentTime >= timelineWord.start && currentTime <= timelineWord.end);
      const progress = timelineWord ? activeProgress(currentTime, timelineWord.start, timelineWord.end) : 1;
      const displayText = isActive && animation === 'typewriter'
        ? item.displayWord.slice(0, Math.ceil(item.displayWord.length * progress))
        : item.displayWord;
      const centerX = cursorX + item.slotWidth / 2;
      const centerY = lineY;
      const kineticProgress = animation === 'split-stagger'
        ? Math.min(1, Math.max(0, (lineProgress - wordIndex * 0.08) / 0.35))
        : progress;
      const scale = animation === 'pop'
        ? kineticProgress < 0.25 ? 1 + (kineticProgress / 0.25) * 0.25 : 1.25 - ((kineticProgress - 0.25) / 0.75) * 0.25
        : animation === 'bounce' ? 1 + Math.sin(kineticProgress * Math.PI) * 0.15
          : animation === 'elastic-punch' ? 1 + Math.sin(kineticProgress * Math.PI) * 0.35
            : animation === 'karaoke-sweep' ? 1 + Math.sin(kineticProgress * Math.PI) * 0.05
              : 1;
      const offsetY = animation === 'bounce'
        ? -Math.sin(kineticProgress * Math.PI) * 14
        : animation === 'slide-up' && isActive && progress < 0.3
          ? (1 - progress / 0.3) * 16
          : 0;
      const staticRotation = ((item.rule?.rotation ?? 0) * Math.PI) / 180;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = fontString(item.fontStyle, item.weight, item.size, item.font);
      if (animation === 'fade' && isActive) ctx.globalAlpha = Math.min(1, progress * 1.5);

      // Shared transform: position -> animation scale -> static tilt, so the word's
      // box, underline, stroke and text all move together.
      if (typeof ctx.translate === 'function' && typeof ctx.scale === 'function') {
        ctx.translate(centerX, centerY + offsetY);
        ctx.scale(scale, scale);
        if (staticRotation !== 0 && typeof ctx.rotate === 'function') ctx.rotate(staticRotation);
        if (animation === 'elastic-punch' && typeof ctx.rotate === 'function') {
          ctx.rotate(-0.04 * Math.sin(kineticProgress * Math.PI));
        }
      }
      // From here on, (0, 0) is the word's centre.

      // 1) Individual word box / pill / marker.
      if (item.rule?.backgroundColor) {
        ctx.save();
        ctx.fillStyle = item.rule.backgroundColor;
        const boxW = item.slotWidth;
        const boxH = item.size * 1.05 + item.padY * 2;
        const radius = Math.min(item.rule.borderRadius ?? 4, boxH / 2);
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, radius);
          ctx.fill();
        } else if (typeof ctx.fillRect === 'function') {
          ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
        }
        ctx.restore();
      }

      // 2) Shadows / glow (per-word glow always on, template animations on top).
      if (item.rule?.glowColor) {
        ctx.shadowColor = item.rule.glowColor;
        ctx.shadowBlur = item.rule.glowBlur ?? 16;
      }
      if (animation === 'neon-glow' && isActive) {
        ctx.shadowColor = item.rule?.glowColor || settings.shadowColor || settings.highlightColor;
        ctx.shadowBlur = 24 + Math.sin(progress * Math.PI * 2) * 8;
      }
      if (animation === 'hard-shadow') {
        ctx.shadowColor = settings.shadowColor || '#000000';
        ctx.shadowOffsetX = settings.shadowOffsetX ?? 6;
        ctx.shadowOffsetY = settings.shadowOffsetY ?? 6;
        ctx.shadowBlur = settings.shadowBlur ?? 0;
      }

      // 3) Stroke (per-word outline wins; otherwise the template's outline style).
      const styleOutlineWidth = settings.style === 'outline'
        ? settings.strokeWidth ?? Math.max(4, Math.round(item.size * 0.12))
        : 0;
      const strokeWidth = item.rule?.outlineWidth ?? styleOutlineWidth;
      const fillColor = isActive
        ? item.rule?.highlightColor || settings.highlightColor
        : item.rule?.textColor || item.rule?.color || settings.textColor;
      if (strokeWidth > 0) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = item.rule?.outlineColor || settings.strokeColor || settings.boxColor || '#000000';
        ctx.lineJoin = 'round';
        ctx.strokeText(displayText, 0, 0);
      }
      ctx.fillStyle = fillColor;
      ctx.fillText(displayText, 0, 0);

      // 4) Underline accent.
      if (item.rule?.underlineColor && typeof ctx.fillRect === 'function') {
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = item.rule.underlineColor;
        ctx.fillRect(-item.textWidth / 2, item.size * 0.46, item.textWidth, Math.max(2, item.size * 0.08));
      }
      ctx.restore();
      cursorX += item.advance;
    });
    globalWordIndex += words.length;

    if (!hasWordTimeline && words.length === 0) {
      ctx.save();
      ctx.font = `${baseWeight} ${layout.fontSize}px ${baseFamily}`;
      ctx.fillStyle = settings.textColor;
      ctx.fillText(line, x, lineY);
      ctx.restore();
    }
    ctx.restore();
  });

  if (selectedSubtitleId === activeSub.id) {
    ctx.save();
    ctx.strokeStyle = settings.highlightColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(layout.left - 10, layout.y - layout.height / 2 - 8, layout.width + 20, layout.height + 16);
    ctx.restore();
  }
}
