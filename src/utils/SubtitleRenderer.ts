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

/**
 * Template pixel values (outline width, padding, radius, glow, offsets) are authored
 * at this font size. Everything is multiplied by `fontSize / 26` at draw time, so a
 * caption looks identical on a 337px preview, a 1080p export, or a 120px sidebar card.
 */
export const TEMPLATE_REFERENCE_FONT_SIZE = 26;

const DEFAULT_PAD_X = 10;
const DEFAULT_PAD_Y = 4;
/** Entry transitions never take longer than this (or 35% of the caption). */
const ENTRY_MAX_SECONDS = 0.4;
const WORD_STAGGER_SECONDS = 0.14;
const WORD_MOTION_SECONDS = 0.28;

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

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value: number): number {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 3);
}

function wrapCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontFamily: string,
  fontSize: number,
): { lines: string[]; fontSize: number } {
  const minSize = Math.max(6, Math.floor(fontSize * 0.7));
  const words = text.split(/\s+/).filter(Boolean);
  // Short captions shrink to stay on one line (down to 70%) before they wrap.
  const step = Math.max(1, fontSize / 13);
  for (let single = fontSize; single >= minSize; single -= step) {
    ctx.font = `700 ${single}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) return { lines: [text], fontSize: single };
  }
  let size = fontSize;
  while (size >= minSize) {
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
    size -= step;
  }
  ctx.font = `700 ${minSize}px ${fontFamily}`;
  return { lines: [text], fontSize: minSize };
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
  const unit = wrapped.fontSize / TEMPLATE_REFERENCE_FONT_SIZE;
  const isTelugu = language === 'te' || isTeluguText(rawText);
  const lineHeight = wrapped.fontSize * (isTelugu ? 1.35 : 1.2);
  ctx.font = `${settings.fontWeight ?? '700'} ${wrapped.fontSize}px ${fontFamily}`;
  const lineWidths = wrapped.lines.map(line => ctx.measureText(line).width);
  const horizontalPadding = (settings.style === 'box' || settings.textBackground ? 40 : settings.style === 'outline' ? 12 : 0) * unit;
  const verticalPadding = (settings.style === 'box' || settings.textBackground ? 20 : settings.style === 'outline' ? 12 : 0) * unit;
  const maxLineWidth = Math.max(...lineWidths, 0);
  const renderedHeight = wrapped.lines.length * lineHeight;
  const margin = 24 * unit;
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
  return clamp01((currentTime - start) / Math.max(0.001, end - start));
}

/* -------------------------------------------------------------------------- */
/*  Per-word entry motion (boxes / typo transitions), driven by elapsed time   */
/*  so it works with or without word timings and plays identically in the     */
/*  sidebar preview and on the video.                                         */
/* -------------------------------------------------------------------------- */

interface WordMotion {
  alpha: number;
  dx: number;
  dy: number;
  scale: number;
  /** 0..1 horizontal growth of the word's box, anchored on its left edge. */
  boxScaleX: number;
  /** 0..1 growth of the underline, anchored on its left edge. */
  underline: number;
}

const NO_MOTION: WordMotion = { alpha: 1, dx: 0, dy: 0, scale: 1, boxScaleX: 1, underline: 1 };

function wordMotion(animation: string, index: number, elapsed: number, unit: number): WordMotion {
  const delay = Math.min(index, 4) * WORD_STAGGER_SECONDS;
  const local = elapsed - delay;
  const p = easeOutCubic(local / WORD_MOTION_SECONDS);
  switch (animation) {
    case 'rise':
      return { ...NO_MOTION, alpha: p, dy: (1 - p) * 10 * unit, underline: easeOutCubic((local - 0.18) / 0.3) };
    case 'drop':
      return { ...NO_MOTION, alpha: p, dy: -(1 - p) * 10 * unit };
    case 'converge':
      return { ...NO_MOTION, alpha: p, dx: (index % 2 === 0 ? -1 : 1) * (1 - p) * 18 * unit };
    case 'settle':
      return { ...NO_MOTION, alpha: p, scale: 1 + (1 - p) * 0.1 };
    case 'split-stagger':
      return { ...NO_MOTION, alpha: p, dy: (1 - p) * 8 * unit };
    case 'box-wipe':
      return { ...NO_MOTION, alpha: easeOutCubic((local - 0.1) / 0.25), boxScaleX: easeOutCubic((local - 0.02) / 0.3) };
    case 'box-drop':
      return { ...NO_MOTION, alpha: p, dy: -(1 - p) * 8 * unit };
    case 'box-slide':
      return { ...NO_MOTION, alpha: p, dx: -(1 - p) * 14 * unit };
    default:
      return NO_MOTION;
  }
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
  const unit = layout.fontSize / TEMPLATE_REFERENCE_FONT_SIZE;
  const x = settings.alignment === 'left' ? layout.left : settings.alignment === 'right' ? layout.left + layout.width : width / 2;
  const drawBackground = settings.style === 'box' || settings.textBackground;

  // Time-based entry: consistent speed for 1s and 6s captions alike.
  const elapsed = currentTime - activeSub.start;
  const captionSeconds = Math.max(0.001, activeSub.end - activeSub.start);
  const entryProgress = easeOutCubic(elapsed / Math.min(ENTRY_MAX_SECONDS, captionSeconds * 0.35));
  const totalChars = rawText.replace(/\s+/g, '').length;
  const typeSeconds = 0.35 + totalChars * 0.02;
  let globalWordIndex = 0;
  let charsBefore = 0;

  lines.forEach((line, lineIndex) => {
    const lineY = layout.y + (lineIndex - (lines.length - 1) / 2) * lineHeight;
    const words = line.split(/\s+/).filter(Boolean);

    // Measure every word with ITS OWN font so boxes and spacing match across surfaces.
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
      const padX = hasBox ? (rule?.paddingX ?? DEFAULT_PAD_X) * unit : 0;
      const padY = hasBox ? (rule?.paddingY ?? DEFAULT_PAD_Y) * unit : 0;
      const slotWidth = textWidth + padX * 2;
      return { displayWord, rule, size, font, weight, fontStyle, textWidth, padX, padY, slotWidth, advance: slotWidth + spaceWidth };
    });

    const lastItem = measured[measured.length - 1];
    const trailingGap = lastItem ? lastItem.advance - lastItem.slotWidth : 0;
    const totalWidth = measured.reduce((sum, item) => sum + item.advance, 0) - trailingGap;
    const lineLeft = settings.alignment === 'left'
      ? layout.left
      : settings.alignment === 'right'
        ? layout.left + layout.width - totalWidth
        : x - totalWidth / 2;

    const lineOffsetY = animation === 'slide-up' ? (1 - entryProgress) * 16 * unit : 0;
    const lineOffsetX = animation === 'slide-left' ? (1 - entryProgress) * width * 0.12 : 0;
    const lineScale = animation === 'zoom-in' ? 0.82 + 0.18 * entryProgress : 1;
    const flipScaleY = animation === 'flip-in' ? Math.max(0.01, entryProgress) : 1;
    const fadesIn = animation === 'fade' || animation === 'slide-up' || animation === 'slide-left' || animation === 'zoom-in' || animation === 'flip-in';

    ctx.save();
    ctx.globalAlpha = fadesIn ? entryProgress : 1;
    if (typeof ctx.translate === 'function' && typeof ctx.scale === 'function') {
      ctx.translate(x + lineOffsetX, lineY + lineOffsetY);
      ctx.scale(lineScale, flipScaleY);
      ctx.translate(-x, -lineY);
    }
    if (animation === 'wipe-right' && typeof ctx.rect === 'function' && typeof ctx.clip === 'function') {
      ctx.beginPath();
      ctx.rect(lineLeft - 24 * unit, 0, (totalWidth + 48 * unit) * entryProgress, height);
      ctx.clip();
    }

    if (drawBackground) {
      ctx.save();
      ctx.fillStyle = settings.boxColor || 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      const boxWidth = totalWidth + 40 * unit;
      const boxLeft = settings.alignment === 'center' ? x - boxWidth / 2 : lineLeft - 20 * unit;
      const boxHeight = lineHeight + 20 * unit;
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(boxLeft, lineY - boxHeight / 2, boxWidth, boxHeight, 10 * unit);
        ctx.fill();
      } else if (typeof ctx.fillRect === 'function') {
        ctx.fillRect(boxLeft, lineY - boxHeight / 2, boxWidth, boxHeight);
      }
      ctx.restore();
    }

    let cursorX = lineLeft;
    measured.forEach((item, wordIndex) => {
      const index = globalWordIndex + wordIndex;
      const timelineWord = activeSub.words?.[index];
      const isActive = Boolean(timelineWord && currentTime >= timelineWord.start && currentTime <= timelineWord.end);
      const isSpoken = Boolean(timelineWord && currentTime > timelineWord.end);
      const progress = timelineWord ? activeProgress(currentTime, timelineWord.start, timelineWord.end) : 1;
      const motion = wordMotion(animation, index, elapsed, unit);

      // Typewriter is time-driven (not word-driven) so the idle frame is the full phrase.
      let displayText = item.displayWord;
      if (animation === 'typewriter') {
        const revealed = Math.ceil(totalChars * clamp01(elapsed / typeSeconds));
        displayText = item.displayWord.slice(0, Math.max(0, Math.min(item.displayWord.length, revealed - charsBefore)));
      }
      charsBefore += item.displayWord.length;

      const centerX = cursorX + item.slotWidth / 2;
      const centerY = lineY;
      const kineticProgress = progress;
      const scale = animation === 'pop'
        ? kineticProgress < 0.25 ? 1 + (kineticProgress / 0.25) * 0.12 : 1.12 - ((kineticProgress - 0.25) / 0.75) * 0.12
        : animation === 'bounce' ? 1 + Math.sin(kineticProgress * Math.PI) * 0.08
          : animation === 'elastic-punch' ? 1 + Math.sin(kineticProgress * Math.PI) * 0.18
            : animation === 'karaoke-sweep' ? 1 + Math.sin(kineticProgress * Math.PI) * 0.04
              : 1;
      const isKinetic = isActive && timelineWord !== undefined;
      const kineticScale = isKinetic ? scale : 1;
      const offsetY = animation === 'bounce' && isKinetic ? -Math.sin(kineticProgress * Math.PI) * 6 * unit : 0;
      const staticRotation = ((item.rule?.rotation ?? 0) * Math.PI) / 180;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = fontString(item.fontStyle, item.weight, item.size, item.font);
      ctx.globalAlpha = ctx.globalAlpha * motion.alpha;

      // Shared transform: position -> motion -> animation scale -> static tilt, so the
      // word's box, underline, stroke and text all move as one object.
      if (typeof ctx.translate === 'function' && typeof ctx.scale === 'function') {
        ctx.translate(centerX + motion.dx, centerY + offsetY + motion.dy);
        ctx.scale(kineticScale * motion.scale, kineticScale * motion.scale);
        if (typeof ctx.rotate === 'function') {
          const punch = animation === 'elastic-punch' && isKinetic ? -0.04 * Math.sin(kineticProgress * Math.PI) : 0;
          if (staticRotation !== 0 || punch !== 0) ctx.rotate(staticRotation + punch);
        }
      }
      // From here on, (0, 0) is the word's centre.

      // 1) Individual word box / pill / marker.
      if (item.rule?.backgroundColor) {
        ctx.save();
        ctx.fillStyle = item.rule.backgroundColor;
        const boxW = item.slotWidth * motion.boxScaleX;
        const boxH = item.size * 1.05 + item.padY * 2;
        const radius = Math.min((item.rule.borderRadius ?? 4) * unit, boxH / 2, boxW / 2);
        if (boxW > 0.5) {
          if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(-item.slotWidth / 2, -boxH / 2, boxW, boxH, radius);
            ctx.fill();
          } else if (typeof ctx.fillRect === 'function') {
            ctx.fillRect(-item.slotWidth / 2, -boxH / 2, boxW, boxH);
          }
        }
        ctx.restore();
      }

      // 2) Shadows / glow (per-word glow always on, template animations on top).
      if (item.rule?.glowColor) {
        ctx.shadowColor = item.rule.glowColor;
        ctx.shadowBlur = (item.rule.glowBlur ?? 16) * unit;
      }
      if (animation === 'neon-glow' && isActive) {
        ctx.shadowColor = item.rule?.glowColor || settings.shadowColor || settings.highlightColor;
        ctx.shadowBlur = (24 + Math.sin(progress * Math.PI * 2) * 8) * unit;
      }
      if (animation === 'hard-shadow') {
        ctx.shadowColor = settings.shadowColor || '#000000';
        ctx.shadowOffsetX = (settings.shadowOffsetX ?? 6) * unit;
        ctx.shadowOffsetY = (settings.shadowOffsetY ?? 6) * unit;
        ctx.shadowBlur = (settings.shadowBlur ?? 0) * unit;
      }

      // 3) Stroke (per-word outline wins; otherwise the template's outline style).
      const styleOutlineWidth = settings.style === 'outline'
        ? settings.strokeWidth ?? Math.max(1.5, item.size * 0.15)
        : 0;
      const strokeWidth = item.rule?.outlineWidth !== undefined ? item.rule.outlineWidth * unit : styleOutlineWidth;
      const baseFill = item.rule?.textColor || item.rule?.color || settings.textColor;
      const highlightFill = item.rule?.highlightColor || settings.highlightColor;
      let fill: string | CanvasGradient = isActive ? highlightFill : baseFill;
      if (animation === 'karaoke-sweep' && timelineWord) {
        if (isSpoken) {
          fill = highlightFill;
        } else if (isActive && typeof ctx.createLinearGradient === 'function') {
          const sweep = ctx.createLinearGradient(-item.textWidth / 2, 0, item.textWidth / 2, 0);
          sweep.addColorStop(0, highlightFill);
          sweep.addColorStop(progress, highlightFill);
          sweep.addColorStop(Math.min(1, progress + 0.001), baseFill);
          sweep.addColorStop(1, baseFill);
          fill = sweep;
        }
      }

      // Typewriter text is left-anchored inside its slot so letters don't jitter.
      const drawX = animation === 'typewriter' ? -item.textWidth / 2 : 0;
      if (animation === 'typewriter') ctx.textAlign = 'left';
      if (strokeWidth > 0) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = item.rule?.outlineColor || settings.strokeColor || settings.boxColor || '#000000';
        ctx.lineJoin = 'round';
        ctx.strokeText(displayText, drawX, 0);
      }
      ctx.fillStyle = fill;
      ctx.fillText(displayText, drawX, 0);

      // 4) Underline accent (draws itself left-to-right on 'rise').
      if (item.rule?.underlineColor && typeof ctx.fillRect === 'function' && motion.underline > 0) {
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = item.rule.underlineColor;
        ctx.fillRect(-item.textWidth / 2, item.size * 0.46, item.textWidth * motion.underline, Math.max(1.5, item.size * 0.08));
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
