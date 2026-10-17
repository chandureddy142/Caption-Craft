import type {
  CanvasSettings,
  CaptionCategory,
  CaptionTemplateDefinition,
  CaptionTemplateId,
  PreviewToken,
  WordStyleRule,
} from "../types";
import type { CSSProperties } from "react";

export type { CaptionTemplateDefinition, TemplatePreviewSample } from "../types";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

/** Every preset previews (and is tested with) this exact phrase. */
export const PREVIEW_PHRASE = "Caption Craft";
/** Base font size (px) used by the sidebar preview cards. */
export const PREVIEW_FONT_PX = 17;

export const CAPTION_SECTIONS: ReadonlyArray<{ key: CaptionCategory; title: string }> = [
  { key: "trending", title: "trending" },
  { key: "classic", title: "classic (simple)" },
  { key: "animations", title: "animations" },
  { key: "transitions", title: "transitions" },
  { key: "boxes", title: "boxes" },
  { key: "typo", title: "typo" },
];

const FONT = {
  arial: "Arial, Helvetica, sans-serif",
  impact: "Impact, 'Arial Black', sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  comic: "'Comic Sans MS', 'Comic Neue', cursive",
  courier: "'Courier New', Courier, monospace",
  trebuchet: "'Trebuchet MS', Helvetica, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  palatino: "'Palatino Linotype', Palatino, serif",
  times: "'Times New Roman', Times, serif",
} as const;

/* -------------------------------------------------------------------------- */
/*  Template factory                                                          */
/* -------------------------------------------------------------------------- */

interface TemplateSeed {
  id: CaptionTemplateId;
  name: string;
  category: CaptionCategory;
  badge: string;
  description: string;
  /** Base font family (word rules may override it). */
  font: string;
  /** Dual-word rule: [word 0 = base style, word 1 = accent / box / alt font]. */
  words: readonly [WordStyleRule, WordStyleRule];
  settings?: Partial<CanvasSettings>;
}

function withOwnHighlight(rule: WordStyleRule): WordStyleRule {
  // Without this the active-word colour would fall back to the *template*
  // highlight, which turns word 0 invisible on box presets.
  const base = rule.textColor ?? rule.color ?? "#ffffff";
  return { ...rule, textColor: base, highlightColor: rule.highlightColor ?? base };
}

function define(seed: TemplateSeed): CaptionTemplateDefinition {
  const [first, second] = seed.words;
  const wordPatterns: WordStyleRule[] = [withOwnHighlight(first), withOwnHighlight(second)];
  return {
    id: seed.id,
    name: seed.name,
    category: seed.category,
    description: seed.description,
    badge: seed.badge,
    settings: {
      fontFamily: seed.font,
      fontSize: 26,
      fontWeight: "700",
      textColor: wordPatterns[0].textColor,
      highlightColor: wordPatterns[1].textColor,
      boxColor: "#000000",
      style: "outline",
      verticalPosition: 0.8,
      alignment: "center",
      textBackground: false,
      animation: "none",
      ...seed.settings,
    },
    wordPatterns,
  };
}

/* -------------------------------------------------------------------------- */
/*  Catalog: 6 sections x 7 presets                                           */
/* -------------------------------------------------------------------------- */

export const CAPTION_TEMPLATES: CaptionTemplateDefinition[] = [
  /* ---- 1) TRENDING: word 1 muted, word 2 = highlight / glow / tilt ------- */
  define({
    id: "trending-hormozi", name: "hormozi punch", category: "trending", badge: "trending",
    description: "white setup word, yellow punch word.",
    font: FONT.impact,
    words: [
      { uppercase: true, textColor: "#ffffff" },
      { uppercase: true, textColor: "#facc15", fontSizeMultiplier: 1.1 },
    ],
    settings: { animation: "pop" },
  }),
  define({
    id: "trending-blockbuster", name: "blockbuster red", category: "trending", badge: "glow",
    description: "cinematic red glow on the second word.",
    font: FONT.impact,
    words: [
      { uppercase: true, textColor: "#e5e7eb" },
      { uppercase: true, textColor: "#ef4444", glowColor: "#dc2626", glowBlur: 18 },
    ],
    settings: { animation: "neon-glow", shadowColor: "#dc2626" },
  }),
  define({
    id: "trending-purple-aura", name: "purple aura", category: "trending", badge: "neon",
    description: "muted grey, then a purple neon word.",
    font: FONT.arial,
    words: [
      { textColor: "#cbd5e1" },
      { textColor: "#c084fc", glowColor: "#a855f7", glowBlur: 20 },
    ],
    settings: { animation: "neon-glow", shadowColor: "#a855f7" },
  }),
  define({
    id: "trending-beast-green", name: "beast green", category: "trending", badge: "tilt",
    description: "tilted green word with a heavy outline.",
    font: FONT.impact,
    words: [
      { uppercase: true, textColor: "#ffffff" },
      { uppercase: true, textColor: "#22c55e", rotation: -3, fontSizeMultiplier: 1.12 },
    ],
    settings: { animation: "bounce" },
  }),
  define({
    id: "trending-sun-city", name: "sun city", category: "trending", badge: "warm",
    description: "warm cream plus an orange ember word.",
    font: FONT.trebuchet,
    words: [
      { textColor: "#fff7ed" },
      { textColor: "#fb923c", glowColor: "#f97316", glowBlur: 14 },
    ],
    settings: { animation: "fade" },
  }),
  define({
    id: "trending-cyan-neon", name: "cyan neon", category: "trending", badge: "neon",
    description: "slate word, electric cyan glow word.",
    font: FONT.verdana,
    words: [
      { uppercase: true, textColor: "#94a3b8" },
      { uppercase: true, textColor: "#22d3ee", glowColor: "#06b6d4", glowBlur: 18 },
    ],
    settings: { animation: "neon-glow", shadowColor: "#06b6d4", fontSize: 24 },
  }),
  define({
    id: "trending-rose-love", name: "rose love", category: "trending", badge: "cute",
    description: "soft blush word, tilted rose-pink word.",
    font: FONT.comic,
    words: [
      { textColor: "#ffe4e6" },
      { textColor: "#fb7185", rotation: 2.5, glowColor: "#f43f5e", glowBlur: 12 },
    ],
    settings: { animation: "fade" },
  }),

  /* ---- 2) CLASSIC (SIMPLE) ---------------------------------------------- */
  define({
    id: "classic-white", name: "classic white", category: "classic", badge: "clean",
    description: "white text with a dark stroke.",
    font: FONT.arial,
    words: [{ textColor: "#ffffff" }, { textColor: "#ffffff" }],
    settings: { fontSize: 24, verticalPosition: 0.82 },
  }),
  define({
    id: "classic-yellow", name: "classic yellow", category: "classic", badge: "docu",
    description: "documentary yellow with a black outline.",
    font: FONT.arial,
    words: [{ textColor: "#fde047" }, { textColor: "#fde047" }],
    settings: { fontSize: 24, verticalPosition: 0.82 },
  }),
  define({
    id: "classic-cinema-serif", name: "cinema serif", category: "classic", badge: "film",
    description: "film-style serif subtitle.",
    font: FONT.georgia,
    words: [{ textColor: "#f8fafc" }, { textColor: "#f8fafc" }],
    settings: { fontSize: 25, fontWeight: "normal" },
  }),
  define({
    id: "classic-soft-shadow", name: "soft shadow", category: "classic", badge: "soft",
    description: "no stroke, gentle drop shadow.",
    font: FONT.trebuchet,
    words: [{ textColor: "#ffffff" }, { textColor: "#ffffff" }],
    settings: { style: "minimalist", animation: "hard-shadow", shadowColor: "rgba(0,0,0,0.75)", shadowOffsetX: 0, shadowOffsetY: 2, shadowBlur: 8 },
  }),
  define({
    id: "classic-typewriter", name: "typewriter", category: "classic", badge: "mono",
    description: "monospace with a mint second word.",
    font: FONT.courier,
    words: [{ textColor: "#e5e7eb" }, { textColor: "#86efac" }],
    settings: { animation: "typewriter", fontSize: 24 },
  }),
  define({
    id: "classic-two-tone", name: "two tone", category: "classic", badge: "duo",
    description: "white and warm cream, same weight.",
    font: FONT.verdana,
    words: [{ textColor: "#ffffff" }, { textColor: "#fde68a" }],
    settings: { fontSize: 23 },
  }),
  define({
    id: "classic-broadcast", name: "broadcast", category: "classic", badge: "news",
    description: "news-style serif, white then silver.",
    font: FONT.times,
    words: [{ textColor: "#ffffff" }, { textColor: "#cbd5e1" }],
    settings: { fontSize: 26 },
  }),

  /* ---- 3) ANIMATIONS ---------------------------------------------------- */
  define({
    id: "anim-word-bounce", name: "word bounce", category: "animations", badge: "bounce",
    description: "each word hops as it is spoken.",
    font: FONT.comic,
    words: [{ textColor: "#ffffff" }, { textColor: "#fde047", highlightColor: "#fef08a" }],
    settings: { animation: "bounce" },
  }),
  define({
    id: "anim-karaoke-sweep", name: "karaoke sweep", category: "animations", badge: "karaoke",
    description: "words light up as they are said.",
    font: FONT.trebuchet,
    words: [{ textColor: "#e2e8f0", highlightColor: "#ffffff" }, { textColor: "#38bdf8", highlightColor: "#bae6fd" }],
    settings: { animation: "karaoke-sweep" },
  }),
  define({
    id: "anim-elastic-punch", name: "elastic punch", category: "animations", badge: "punch",
    description: "snappy elastic hit with a slight tilt.",
    font: FONT.impact,
    words: [{ uppercase: true, textColor: "#ffffff" }, { uppercase: true, textColor: "#f97316", rotation: -4 }],
    settings: { animation: "elastic-punch" },
  }),
  define({
    id: "anim-typewriter", name: "type on", category: "animations", badge: "type",
    description: "letters type in, green terminal accent.",
    font: FONT.courier,
    words: [{ textColor: "#e5e7eb" }, { textColor: "#4ade80", highlightColor: "#bbf7d0" }],
    settings: { animation: "typewriter", fontSize: 24 },
  }),
  define({
    id: "anim-split-stagger", name: "split stagger", category: "animations", badge: "stagger",
    description: "words stagger in one after another.",
    font: FONT.arial,
    words: [{ textColor: "#f1f5f9" }, { textColor: "#f472b6" }],
    settings: { animation: "split-stagger" },
  }),
  define({
    id: "anim-pulse-glow", name: "pulse glow", category: "animations", badge: "glow",
    description: "violet word breathes with a soft glow.",
    font: FONT.verdana,
    words: [{ textColor: "#cbd5e1" }, { textColor: "#a78bfa", glowColor: "#8b5cf6", glowBlur: 16 }],
    settings: { animation: "neon-glow", shadowColor: "#8b5cf6", fontSize: 24 },
  }),
  define({
    id: "anim-soft-fade", name: "soft fade", category: "animations", badge: "fade",
    description: "elegant serif that eases in, gold accent.",
    font: FONT.georgia,
    words: [{ textColor: "#f8fafc" }, { textColor: "#fcd34d", fontStyle: "italic" }],
    settings: { animation: "fade" },
  }),

  /* ---- 4) TRANSITIONS --------------------------------------------------- */
  define({
    id: "trans-slide-up", name: "slide up", category: "transitions", badge: "slide",
    description: "caption rises into place.",
    font: FONT.trebuchet,
    words: [{ textColor: "#ffffff" }, { textColor: "#67e8f9" }],
    settings: { animation: "slide-up" },
  }),
  define({
    id: "trans-slide-left", name: "slide left", category: "transitions", badge: "slide",
    description: "caption glides in from the right edge.",
    font: FONT.arial,
    words: [{ textColor: "#ffffff" }, { textColor: "#fda4af" }],
    settings: { animation: "slide-left" },
  }),
  define({
    id: "trans-zoom-in", name: "zoom in", category: "transitions", badge: "zoom",
    description: "bold caption zooms to full size.",
    font: FONT.impact,
    words: [{ uppercase: true, textColor: "#ffffff" }, { uppercase: true, textColor: "#fbbf24" }],
    settings: { animation: "zoom-in" },
  }),
  define({
    id: "trans-flip-in", name: "flip in", category: "transitions", badge: "flip",
    description: "caption flips open vertically.",
    font: FONT.verdana,
    words: [{ textColor: "#f1f5f9" }, { textColor: "#86efac" }],
    settings: { animation: "flip-in", fontSize: 24 },
  }),
  define({
    id: "trans-wipe-reveal", name: "wipe reveal", category: "transitions", badge: "wipe",
    description: "left-to-right wipe reveal.",
    font: FONT.georgia,
    words: [{ textColor: "#ffffff" }, { textColor: "#fde68a", fontStyle: "italic" }],
    settings: { animation: "wipe-right" },
  }),
  define({
    id: "trans-cross-fade", name: "cross fade", category: "transitions", badge: "fade",
    description: "quiet fade for interviews and vlogs.",
    font: FONT.comic,
    words: [{ textColor: "#ffffff" }, { textColor: "#c4b5fd" }],
    settings: { animation: "fade" },
  }),
  define({
    id: "trans-stagger-mono", name: "stagger mono", category: "transitions", badge: "stagger",
    description: "monospace words cascade in.",
    font: FONT.courier,
    words: [{ textColor: "#e2e8f0" }, { textColor: "#fb923c" }],
    settings: { animation: "split-stagger", fontSize: 24 },
  }),

  /* ---- 5) BOXES: word 1 clean, word 2 gets its own box ------------------- */
  define({
    id: "boxes-yellow-marker", name: "yellow marker", category: "boxes", badge: "marker",
    description: "clean word, then a yellow highlighter strip.",
    font: FONT.arial,
    words: [
      { textColor: "#ffffff", outlineColor: "#000000", outlineWidth: 4 },
      { textColor: "#111111", backgroundColor: "#ffd000", borderRadius: 6, rotation: -2, paddingX: 10, paddingY: 4 },
    ],
    settings: { style: "minimalist" },
  }),
  define({
    id: "boxes-purple-pill", name: "purple pill", category: "boxes", badge: "pill",
    description: "fully rounded purple pill on word two.",
    font: FONT.trebuchet,
    words: [
      { textColor: "#ffffff", outlineColor: "#000000", outlineWidth: 4 },
      { textColor: "#ffffff", backgroundColor: "#7c3aed", borderRadius: 40, paddingX: 14, paddingY: 4 },
    ],
    settings: { style: "minimalist" },
  }),
  define({
    id: "boxes-crimson-tag", name: "crimson tag", category: "boxes", badge: "breaking",
    description: "breaking-news red tag, impact caps.",
    font: FONT.impact,
    words: [
      { uppercase: true, textColor: "#ffffff", outlineColor: "#000000", outlineWidth: 4 },
      { uppercase: true, textColor: "#ffffff", backgroundColor: "#dc2626", borderRadius: 4, paddingX: 10, paddingY: 4 },
    ],
    settings: { style: "minimalist" },
  }),
  define({
    id: "boxes-mint-label", name: "mint label", category: "boxes", badge: "label",
    description: "fresh mint label with dark text.",
    font: FONT.verdana,
    words: [
      { textColor: "#ffffff", outlineColor: "#000000", outlineWidth: 4 },
      { textColor: "#052e16", backgroundColor: "#34d399", borderRadius: 10, paddingX: 10, paddingY: 4 },
    ],
    settings: { style: "minimalist", fontSize: 24 },
  }),
  define({
    id: "boxes-sky-chip", name: "sky chip", category: "boxes", badge: "chip",
    description: "rounded sky-blue chip.",
    font: FONT.arial,
    words: [
      { textColor: "#ffffff", outlineColor: "#000000", outlineWidth: 4 },
      { textColor: "#082f49", backgroundColor: "#38bdf8", borderRadius: 14, paddingX: 12, paddingY: 4 },
    ],
    settings: { style: "minimalist" },
  }),
  define({
    id: "boxes-paper-card", name: "paper card", category: "boxes", badge: "card",
    description: "white serif card, ink-black text.",
    font: FONT.georgia,
    words: [
      { textColor: "#ffffff", outlineColor: "#000000", outlineWidth: 4 },
      { textColor: "#111111", backgroundColor: "#ffffff", borderRadius: 8, paddingX: 12, paddingY: 4 },
    ],
    settings: { style: "minimalist" },
  }),
  define({
    id: "boxes-pink-bubble", name: "pink bubble", category: "boxes", badge: "bubble",
    description: "playful tilted bubble.",
    font: FONT.comic,
    words: [
      { textColor: "#ffffff", outlineColor: "#000000", outlineWidth: 4 },
      { textColor: "#ffffff", backgroundColor: "#f472b6", borderRadius: 22, rotation: 2, paddingX: 14, paddingY: 4 },
    ],
    settings: { style: "minimalist" },
  }),

  /* ---- 6) TYPO: distinct font pairings per word -------------------------- */
  define({
    id: "typo-rose-petal", name: "rose petal", category: "typo", badge: "serif+sans",
    description: "italic serif paired with bold sans caps.",
    font: FONT.georgia,
    words: [
      { fontFamily: FONT.georgia, fontStyle: "italic", fontWeight: "normal", textColor: "#fecdd3" },
      { fontFamily: FONT.arial, fontWeight: "900", uppercase: true, textColor: "#fb7185", fontSizeMultiplier: 0.95 },
    ],
  }),
  define({
    id: "typo-scribble", name: "scribble", category: "typo", badge: "hand+impact",
    description: "casual hand-written word, tilted impact word.",
    font: FONT.comic,
    words: [
      { fontFamily: FONT.comic, textColor: "#ffffff" },
      { fontFamily: FONT.impact, uppercase: true, textColor: "#fde047", rotation: -3, fontSizeMultiplier: 1.1 },
    ],
  }),
  define({
    id: "typo-editorial", name: "editorial", category: "typo", badge: "magazine",
    description: "palatino italic and underlined black-weight sans.",
    font: FONT.palatino,
    words: [
      { fontFamily: FONT.palatino, fontStyle: "italic", fontWeight: "normal", textColor: "#fef9c3" },
      { fontFamily: FONT.arial, fontWeight: "900", uppercase: true, textColor: "#ffffff", underlineColor: "#ef4444", fontSizeMultiplier: 0.95 },
    ],
  }),
  define({
    id: "typo-code-clean", name: "code clean", category: "typo", badge: "mono+sans",
    description: "green monospace beside a clean sans word.",
    font: FONT.courier,
    words: [
      { fontFamily: FONT.courier, textColor: "#86efac" },
      { fontFamily: FONT.trebuchet, textColor: "#ffffff" },
    ],
    settings: { fontSize: 24 },
  }),
  define({
    id: "typo-retro-ad", name: "retro ad", category: "typo", badge: "impact+serif",
    description: "impact caps with a warm italic serif.",
    font: FONT.impact,
    words: [
      { fontFamily: FONT.impact, uppercase: true, textColor: "#fde047" },
      { fontFamily: FONT.georgia, fontStyle: "italic", fontWeight: "700", textColor: "#fb923c" },
    ],
  }),
  define({
    id: "typo-mono-sans", name: "tech label", category: "typo", badge: "mono+sans",
    description: "uppercase mono then cyan verdana.",
    font: FONT.courier,
    words: [
      { fontFamily: FONT.courier, uppercase: true, textColor: "#cbd5e1" },
      { fontFamily: FONT.verdana, textColor: "#22d3ee" },
    ],
    settings: { fontSize: 24 },
  }),
  define({
    id: "typo-serif-bold", name: "serif & slam", category: "typo", badge: "serif+impact",
    description: "italic times beside a rose impact slam.",
    font: FONT.times,
    words: [
      { fontFamily: FONT.times, fontStyle: "italic", textColor: "#e2e8f0" },
      { fontFamily: FONT.impact, uppercase: true, textColor: "#f43f5e", fontSizeMultiplier: 1.08 },
    ],
  }),
];

export const DEFAULT_TEMPLATE_ID: CaptionTemplateId = "trending-hormozi";

/* -------------------------------------------------------------------------- */
/*  Lookups & application                                                     */
/* -------------------------------------------------------------------------- */

export function getTemplateById(id: CaptionTemplateId): CaptionTemplateDefinition | undefined {
  return CAPTION_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: CaptionCategory): CaptionTemplateDefinition[] {
  return CAPTION_TEMPLATES.filter(template => template.category === category);
}

export function applyTemplateToSettings(
  current: CanvasSettings,
  templateId: CaptionTemplateId,
): CanvasSettings {
  const template = getTemplateById(templateId);
  if (!template) {
    return { ...current, selectedTemplateId: templateId };
  }
  return {
    ...current,
    // Reset per-template extras so switching presets never leaks old shadows/animations.
    animation: undefined,
    textTransform: undefined,
    fontWeight: undefined,
    strokeColor: undefined,
    strokeWidth: undefined,
    shadowColor: undefined,
    shadowBlur: undefined,
    shadowOffsetX: undefined,
    shadowOffsetY: undefined,
    ...template.settings,
    wordPatterns: template.wordPatterns ?? template.styleRules,
    selectedTemplateId: templateId,
  };
}

/* -------------------------------------------------------------------------- */
/*  Preview tokens (derived from the SAME wordPatterns the canvas uses)       */
/* -------------------------------------------------------------------------- */

function wordPreviewStyle(
  settings: Partial<CanvasSettings>,
  rule: WordStyleRule | undefined,
): CSSProperties {
  const canvasSize = (settings.fontSize ?? 26) * (rule?.fontSizeMultiplier ?? 1);
  const k = PREVIEW_FONT_PX / (settings.fontSize ?? 26);
  const style: CSSProperties = {
    display: "inline-block",
    whiteSpace: "nowrap",
    lineHeight: 1.25,
    fontFamily: rule?.fontFamily ?? settings.fontFamily ?? FONT.arial,
    fontStyle: rule?.fontStyle ?? "normal",
    fontWeight: rule?.fontWeight ?? settings.fontWeight ?? "700",
    fontSize: `${PREVIEW_FONT_PX * (rule?.fontSizeMultiplier ?? 1)}px`,
    color: rule?.textColor ?? rule?.color ?? settings.textColor ?? "#ffffff",
  };

  // Stroke: mirrors the canvas (centred stroke painted under the fill).
  const strokeWidth =
    rule?.outlineWidth ??
    (settings.style === "outline"
      ? settings.strokeWidth ?? Math.max(4, Math.round(canvasSize * 0.12))
      : 0);
  if (strokeWidth > 0) {
    style.WebkitTextStroke = `${(strokeWidth * k).toFixed(2)}px ${rule?.outlineColor ?? settings.strokeColor ?? settings.boxColor ?? "#000000"}`;
    style.paintOrder = "stroke fill";
  }

  // Shadows: per-word glow + template-level hard/soft shadow.
  const shadows: string[] = [];
  if (rule?.glowColor) {
    const blur = (rule.glowBlur ?? 16) * k;
    shadows.push(`0 0 ${blur.toFixed(1)}px ${rule.glowColor}`, `0 0 ${(blur * 0.5).toFixed(1)}px ${rule.glowColor}`);
  }
  if (settings.animation === "hard-shadow") {
    shadows.push(
      `${((settings.shadowOffsetX ?? 6) * k).toFixed(1)}px ${((settings.shadowOffsetY ?? 6) * k).toFixed(1)}px ${((settings.shadowBlur ?? 0) * k).toFixed(1)}px ${settings.shadowColor ?? "#000000"}`,
    );
  }
  if (shadows.length > 0) style.textShadow = shadows.join(", ");

  if (rule?.backgroundColor) {
    style.background = rule.backgroundColor;
    style.borderRadius = `${((rule.borderRadius ?? 6) * k).toFixed(1)}px`;
    style.padding = `${((rule.paddingY ?? 4) * k).toFixed(1)}px ${((rule.paddingX ?? 10) * k).toFixed(1)}px`;
  }
  if (rule?.underlineColor) {
    style.textDecoration = "underline";
    style.textDecorationColor = rule.underlineColor;
    style.textDecorationThickness = "2px";
    style.textUnderlineOffset = "3px";
  }
  if (rule?.rotation) style.transform = `rotate(${rule.rotation}deg)`;
  return style;
}

/**
 * Builds preview tokens for "Caption Craft". Uses manual `previewTokens` when a
 * template provides them; otherwise derives them from `wordPatterns`, so the
 * sidebar card and the canvas can never drift apart.
 */
export function getPreviewTokens(
  template: CaptionTemplateDefinition,
  phrase: string = PREVIEW_PHRASE,
): PreviewToken[] {
  if (template.previewTokens && template.previewTokens.length > 0) return template.previewTokens;
  const rules = template.wordPatterns ?? template.styleRules ?? [];
  return phrase.split(/\s+/).filter(Boolean).map((word, index) => {
    const rule = rules.length > 0 ? rules[index % rules.length] : undefined;
    const upper = Boolean(rule?.uppercase) || template.settings.textTransform === "uppercase";
    return {
      text: upper ? word.toUpperCase() : word,
      style: wordPreviewStyle(template.settings, rule),
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Supabase `caption_templates` mirror                                        */
/* -------------------------------------------------------------------------- */

export interface CaptionTemplateRow {
  id: string;
  name: string;
  category: CaptionCategory | null;
  description: string | null;
  badge: string | null;
  settings: Partial<CanvasSettings>;
  word_patterns: WordStyleRule[];
  is_custom: boolean;
}

export function templateToRow(template: CaptionTemplateDefinition): CaptionTemplateRow {
  return {
    id: template.id,
    name: template.name,
    category: template.category ?? null,
    description: template.description ?? null,
    badge: template.badge ?? null,
    settings: template.settings,
    word_patterns: template.wordPatterns ?? template.styleRules ?? [],
    is_custom: Boolean(template.isCustom),
  };
}

export function rowToTemplate(row: CaptionTemplateRow): CaptionTemplateDefinition {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? undefined,
    description: row.description ?? undefined,
    badge: row.badge ?? undefined,
    settings: row.settings,
    wordPatterns: row.word_patterns,
    isCustom: row.is_custom,
  };
}

/** Remote rows win over local presets that share an id; new ids are appended. */
export function mergeRemoteTemplates(
  local: CaptionTemplateDefinition[],
  remote: CaptionTemplateRow[],
): CaptionTemplateDefinition[] {
  const byId = new Map<string, CaptionTemplateDefinition>(local.map(t => [t.id, t]));
  remote.forEach(row => byId.set(row.id, rowToTemplate(row)));
  return Array.from(byId.values());
}
