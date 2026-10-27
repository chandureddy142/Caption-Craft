import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  UploadCloud, FolderOpen, Zap, Lock, Sparkles, Check, Play, RotateCcw, Languages,
  MousePointer2, Music, Volume2, VolumeX, Download, Film, FileText, Heart, MessageCircle,
  MessageSquare, Repeat2, Send, Bookmark, Share2, Search, MoreVertical, ArrowLeft, Plus,
  Pencil, FileAudio, Image as ImageIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Caption Craft: hero workflow tour                                  */
/*  - transparent root, adapts to your site's light / dark theme       */
/*  - handwritten callout + arrow on every step                        */
/*  - a different editor-style transition for every step               */
/*  - synthesized SFX + real audio of the exported video (mute button) */
/*  Only React + lucide-react. No animation libraries, no extra files. */
/* ------------------------------------------------------------------ */

const W = 880;
const H = 540;
const TICK = 60;
const CORAL = "#e86343";
const EMERALD = "#10b981";
const SKY = "#60a5fa";
const FONT = "'Inter','Noto Sans Telugu',system-ui,-apple-system,'Segoe UI',sans-serif";
const HAND = "'Caveat','Bradley Hand','Segoe Script','Comic Sans MS',cursive";

const STEPS = [
  { title: "Upload your clip", desc: "Drop or browse an audio or video file. Nothing leaves your device.", dur: 5400 },
  { title: "Choose the language", desc: "Pick the language spoken in your clip.", dur: 4800 },
  { title: "Generate captions", desc: "One click creates word-by-word synced captions.", dur: 7000 },
  { title: "Add backgrounds", desc: "Colors, gradients, patterns or your own photo or video. Add as many as you need.", dur: 7600 },
  { title: "Add music", desc: "Choose a track from your device and set the volume.", dur: 6400 },
  { title: "Check safe areas", desc: "Preview Reels, YT Shorts and YouTube so captions stay clear of app buttons.", dur: 6800 },
  { title: "Click Export", desc: "Everything is in place. Hit Export.", dur: 3800 },
  { title: "Choose export settings", desc: "Pick resolution, aspect ratio, framerate and format, then render.", dur: 7600 },
  { title: "Play your final video", desc: "Your captioned video is ready.", dur: 10800 },
];

const CAPS: [string, number, number][] = [
  ["Create Captions,", 0, 1.5], ["an AI studio", 1.5, 2.6], ["to create", 2.6, 3.4],
  ["animated word", 3.4, 4.6], ["synced captions with", 4.6, 6.0], ["custom styles and", 6.0, 7.1],
  ["instant video", 7.1, 7.9], ["export.", 7.9, 8.7],
];

/* ---------------------------- helpers ------------------------------ */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const prog = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const wave = (n: number, seed: number, amp = 18) =>
  Array.from({ length: n }, (_, i) => 5 + Math.abs(Math.sin(i * 1.7 + seed) * Math.cos(i * 0.31 + seed)) * amp);

const GRID: CSSProperties = {
  backgroundColor: "#161c33",
  backgroundImage:
    "linear-gradient(rgba(255,255,255,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.13) 1px,transparent 1px)",
  backgroundSize: "18px 18px",
};
const BGS: { name: string; style: CSSProperties }[] = [
  { name: "PATTERN-GRID", style: GRID },
  { name: "SUNSET-MESH", style: { background: "linear-gradient(135deg,#ff5a36,#d1306e)" } },
  { name: "MIDNIGHT", style: { background: "linear-gradient(160deg,#0b1020,#1b1f4a)" } },
  { name: "DEEP-BLUE", style: { background: "linear-gradient(135deg,#2a5565,#0f2027)" } },
  { name: "LOCAL-PHOTO", style: { background: "radial-gradient(circle at 30% 30%,#f5b97a,#7a4a8f 60%,#1d1b3a)" } },
];

/* cards stay dark charcoal glass in both themes (like your hero pipeline card);
   the theme only changes opacity, border, shadow and the callout ink */
const glass: CSSProperties = {
  background: "linear-gradient(180deg, var(--wm-g1), var(--wm-g2))",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid var(--wm-gb)",
  borderRadius: 20,
  boxShadow: "var(--wm-gs), inset 0 1px 0 rgba(255,255,255,0.08)",
  color: "var(--wm-card-text)",
  fontFamily: FONT,
};
const center: CSSProperties = { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" };
const muted = "var(--wm-card-sub)";
const pill = (active: boolean, accent = "var(--wm-pill-border)"): CSSProperties => ({
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 40, borderRadius: 10,
  fontSize: 13, fontWeight: 700, fontFamily: FONT, color: active ? "var(--wm-card-text)" : "var(--wm-card-sub)",
  background: active ? "rgba(88,98,125,0.35)" : "var(--wm-pill-bg)",
  border: `1px solid ${active ? accent : "var(--wm-pill-border)"}`,
  transition: "all .35s cubic-bezier(.16,1,.3,1)", transform: active ? "scale(1.02)" : "scale(1)",
});

/* ------------------------------ theme ------------------------------ */
type Mode = "light" | "dark";
const luminance = (css: string): number | null => {
  const m = css.match(/[\d.]+/g);
  if (!m || m.length < 3) return null;
  if (m.length >= 4 && parseFloat(m[3]) === 0) return null;
  const [r, g, b] = m.map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
function detectTheme(): Mode {
  if (typeof document === "undefined") return "dark";
  const root = document.documentElement;
  if (root.classList.contains("dark") || root.getAttribute("data-theme") === "dark") return "dark";
  if (root.classList.contains("light") || root.getAttribute("data-theme") === "light") return "light";
  
  // Read actual app background variable
  const computedBg = getComputedStyle(root).getPropertyValue("--bg-app").trim();
  if (computedBg) {
    if (computedBg.includes("#1") || computedBg.includes("#0") || computedBg.includes("rgb(1") || computedBg.includes("rgb(2")) {
      return "dark";
    }
  }
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const l = luminance(bodyBg);
  if (l !== null) return l < 130 ? "dark" : "light";
  return "light";
}
function useThemeMode(pref: "auto" | Mode): Mode {
  const [mode, setMode] = useState<Mode>(pref === "auto" ? "dark" : pref);
  useEffect(() => {
    if (pref !== "auto") { setMode(pref); return; }
    const read = () => setMode(detectTheme());
    read();
    const later = () => { window.setTimeout(read, 60); window.setTimeout(read, 450); };
    const mo = new MutationObserver(later);
    const opts = { attributes: true, attributeFilter: ["class", "data-theme", "data-mode", "data-color-scheme", "style"] };
    mo.observe(document.documentElement, opts);
    if (document.body) mo.observe(document.body, opts);
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", later);
    return () => { mo.disconnect(); mq?.removeEventListener?.("change", later); };
  }, [pref]);
  return mode;
}
const THEME_VARS: Record<Mode, Record<string, string>> = {
  // When website is in DARK MODE -> Card is LIGHT/CREAM glass (Opposite!)
  dark: {
    "--wm-g1": "rgba(255, 255, 255, 0.96)",
    "--wm-g2": "rgba(246, 244, 238, 0.94)",
    "--wm-gb": "rgba(0, 0, 0, 0.12)",
    "--wm-gs": "0 24px 60px rgba(0,0,0,0.55), 0 0 30px rgba(232, 99, 67, 0.2)",
    "--wm-card-text": "#11141a",
    "--wm-card-sub": "#475569",
    "--wm-lane-bg": "rgba(0, 0, 0, 0.05)",
    "--wm-lane-border": "rgba(0, 0, 0, 0.10)",
    "--wm-chip-bg": "rgba(0, 0, 0, 0.07)",
    "--wm-wave": "rgba(20, 24, 33, 0.65)",
    "--wm-pill-bg": "rgba(0, 0, 0, 0.05)",
    "--wm-pill-border": "rgba(0, 0, 0, 0.14)",
    "--wm-callout": "#c8381b",
    "--wm-callout-glow": "none",
  },
  // When website is in LIGHT MODE (cream body) -> Card is DARK CHARCOAL glass (Opposite!)
  light: {
    "--wm-g1": "rgba(26, 29, 36, 0.94)",
    "--wm-g2": "rgba(16, 18, 24, 0.96)",
    "--wm-gb": "rgba(255, 255, 255, 0.12)",
    "--wm-gs": "0 24px 60px rgba(40,30,20,0.25), 0 4px 16px rgba(0,0,0,0.15)",
    "--wm-card-text": "#ffffff",
    "--wm-card-sub": "rgba(244, 244, 245, 0.65)",
    "--wm-lane-bg": "rgba(255, 255, 255, 0.04)",
    "--wm-lane-border": "rgba(255, 255, 255, 0.08)",
    "--wm-chip-bg": "rgba(255, 255, 255, 0.08)",
    "--wm-wave": "rgba(255, 255, 255, 0.60)",
    "--wm-pill-bg": "rgba(255, 255, 255, 0.05)",
    "--wm-pill-border": "rgba(255, 255, 255, 0.12)",
    "--wm-callout": "#ff8a65",
    "--wm-callout-glow": "0 0 16px rgba(255, 138, 101, 0.55)",
  },
};

/* ------------------------------ SFX -------------------------------- */
type Sound = "whoosh" | "whooshDown" | "swish" | "click" | "tick" | "pop" | "thud" | "ding" | "rise" | "success" | "sparkle";
class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;
  unlocked = false;
  unlock() {
    if (typeof window === "undefined") return;
    const AC: typeof AudioContext | undefined = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.unlocked = true;
  }
  private tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, to?: number) {
    const c = this.ctx!, o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + delay;
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master!);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  private noise(dur: number, f0: number, f1: number, gain: number, q: number, delay = 0) {
    const c = this.ctx!;
    if (!this.noiseBuf) {
      this.noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t0 = c.currentTime + delay;
    src.buffer = this.noiseBuf; src.loop = true;
    f.type = "bandpass"; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0);
    f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.master!);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }
  play(s: Sound) {
    if (!this.ctx || !this.master || !this.unlocked || this.muted) return;
    switch (s) {
      case "whoosh": this.noise(0.6, 250, 3400, 0.5, 1.1); break;
      case "whooshDown": this.noise(0.6, 3400, 250, 0.5, 1.1); break;
      case "swish": this.noise(0.28, 900, 4800, 0.22, 0.9); break;
      case "click": this.tone(1500, 0.05, "square", 0.08, 0, 800); this.noise(0.04, 3000, 3200, 0.1, 0.6); break;
      case "tick": this.tone(1900, 0.04, "triangle", 0.1); break;
      case "pop": this.tone(420, 0.12, "sine", 0.28, 0, 840); break;
      case "thud": this.tone(150, 0.2, "sine", 0.5, 0, 48); break;
      case "ding": this.tone(880, 0.5, "sine", 0.2); this.tone(1318, 0.6, "sine", 0.15, 0.09); break;
      case "rise": this.tone(180, 1.8, "sawtooth", 0.04, 0, 720); this.noise(1.8, 400, 2600, 0.1, 2); break;
      case "success": this.tone(659, 0.5, "sine", 0.2); this.tone(880, 0.55, "sine", 0.16, 0.1); this.tone(1318, 0.8, "sine", 0.16, 0.2); break;
      case "sparkle": [1568, 2093, 2637, 3136, 4186].forEach((f, i) => this.tone(f, 0.28, "sine", 0.07, i * 0.06)); break;
    }
  }
}

const CUES: Record<number, { at: number; s: Sound }[]> = {
  0: [{ at: 400, s: "pop" }, { at: 2700, s: "swish" }, { at: 3500, s: "thud" }, { at: 3600, s: "ding" }],
  1: [{ at: 400, s: "pop" }, { at: 1550, s: "click" }, { at: 1750, s: "pop" }, { at: 2500, s: "ding" }],
  2: [{ at: 300, s: "pop" }, { at: 1100, s: "click" }, { at: 1300, s: "rise" }, { at: 3300, s: "success" },
    ...Array.from({ length: 8 }, (_, i) => ({ at: 3600 + i * 150, s: "tick" as Sound }))],
  3: [{ at: 300, s: "pop" }, ...[900, 2400, 3900, 5400].flatMap((a) => [{ at: a, s: "click" as Sound }, { at: a + 120, s: "pop" as Sound }])],
  4: [{ at: 300, s: "pop" }, { at: 1250, s: "click" }, { at: 1500, s: "swish" }, ...[3200, 3600, 4000, 4400, 4800].map((a) => ({ at: a, s: "tick" as Sound }))],
  5: [{ at: 300, s: "pop" }, { at: 800, s: "click" }, { at: 3000, s: "click" }, { at: 4600, s: "click" }],
  6: [{ at: 200, s: "pop" }, ...Array.from({ length: 5 }, (_, i) => ({ at: 500 + i * 300, s: "tick" as Sound })), { at: 2200, s: "click" }, { at: 2300, s: "swish" }, { at: 2500, s: "success" }],
  7: [{ at: 300, s: "pop" }, { at: 700, s: "click" }, { at: 1500, s: "click" }, { at: 2300, s: "click" }, { at: 3000, s: "click" }, { at: 3900, s: "click" }, { at: 4200, s: "rise" }, { at: 6000, s: "success" }, { at: 6000, s: "sparkle" }],
  8: [{ at: 300, s: "pop" }, { at: 600, s: "success" }],
};

/* ---------------------------- callouts ----------------------------- */
type Dir = "dr" | "dl" | "d" | "u" | "r" | "l";
const ARROWS: Record<Dir, { w: number; h: number; ox: number; oy: number; line: string; head: string }> = {
  dr: { w: 90, h: 70, ox: 84, oy: 64, line: "M6 10 C 54 0, 86 22, 84 62", head: "M72 50 L84 64 L94 48" },
  dl: { w: 90, h: 70, ox: 6, oy: 64, line: "M84 10 C 36 0, 4 22, 6 62", head: "M18 50 L6 64 L-4 48" },
  d: { w: 50, h: 60, ox: 25, oy: 56, line: "M30 2 C 8 18, 42 34, 25 52", head: "M13 44 L25 57 L37 44" },
  u: { w: 50, h: 60, ox: 25, oy: 4, line: "M20 58 C 42 42, 8 26, 25 8", head: "M13 18 L25 4 L37 18" },
  r: { w: 84, h: 44, ox: 80, oy: 22, line: "M4 36 C 24 4, 58 6, 77 22", head: "M63 12 L79 22 L66 34" },
  l: { w: 84, h: 44, ox: 4, oy: 22, line: "M80 36 C 60 4, 26 6, 7 22", head: "M21 12 L5 22 L18 34" },
};
const textPos = (d: Dir): CSSProperties => {
  switch (d) {
    case "dr": return { right: 88, top: -54, transform: "translateY(-50%)", textAlign: "right" };
    case "dl": return { left: 90, top: -54, transform: "translateY(-50%)", textAlign: "left" };
    case "d": return { left: 0, bottom: 62, transform: "translateX(-50%)", textAlign: "center" };
    case "u": return { left: 0, top: 62, transform: "translateX(-50%)", textAlign: "center" };
    case "r": return { right: 84, top: 14, transform: "translateY(-50%)", textAlign: "right" };
    default: return { left: 84, top: 14, transform: "translateY(-50%)", textAlign: "left" };
  }
};
/* x,y = where the arrow tip lands (stage coordinates). The text always sits at the tail of the arrow. */
const Callout = ({ t, a, b, dir, x, y, text, size = 30 }: { t: number; a: number; b: number; dir: Dir; x: number; y: number; text: string; size?: number }) => {
  const A = ARROWS[dir];
  const tp = prog(t, a, a + 500);
  const ap = prog(t, a + 150, a + 850);
  const out = 1 - prog(t, b, b + 400);
  if (t < a || out <= 0) return null;
  const ink: CSSProperties = { stroke: "var(--wm-callout)", strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, zIndex: 25, pointerEvents: "none", opacity: out }}>
      <svg width={A.w} height={A.h} viewBox={`0 0 ${A.w} ${A.h}`} style={{ position: "absolute", left: -A.ox, top: -A.oy, overflow: "visible" }}>
        <path d={A.line} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ap} style={{ ...ink, opacity: ap > 0 ? 1 : 0 }} />
        <path d={A.head} style={{ ...ink, opacity: prog(t, a + 700, a + 900) }} />
      </svg>
      <div style={{ position: "absolute", whiteSpace: "pre", ...textPos(dir) }}>
        <div style={{
          fontFamily: HAND, fontSize: size, fontWeight: 600, lineHeight: 1.05, color: "var(--wm-callout)", textShadow: "var(--wm-callout-glow)",
          opacity: tp, transform: `translateY(${(1 - tp) * 10}px)`,
        }}>{text}</div>
      </div>
    </div>
  );
};

/* ---------------------------- shared bits -------------------------- */
const Cursor = ({ x, y, click, opacity = 1 }: { x: number; y: number; click?: boolean; opacity?: number }) => (
  <div style={{
    position: "absolute", left: x, top: y, zIndex: 30, pointerEvents: "none", opacity,
    transition: "left .9s cubic-bezier(.16,1,.3,1), top .9s cubic-bezier(.16,1,.3,1), opacity .3s",
  }}>
    <MousePointer2 size={24} fill="#fff" color="#111" style={{ transform: click ? "scale(.8)" : "scale(1)", transition: "transform .15s", filter: "drop-shadow(0 3px 6px rgba(0,0,0,.5))" }} />
    {click && <span style={{ position: "absolute", left: -8, top: -8, width: 32, height: 32, borderRadius: "50%", border: `2px solid ${CORAL}`, animation: "wmRipple .6s ease-out both" }} />}
  </div>
);

const Phone = ({ w, h, bg, children }: { w: number; h: number; bg: CSSProperties; children?: ReactNode }) => (
  <div style={{
    width: w, height: h, borderRadius: 18, padding: 4, background: "#0a0a0c", border: "1px solid rgba(255,255,255,.18)",
    boxShadow: "0 18px 40px rgba(0,0,0,.45)", transition: "all .55s cubic-bezier(.16,1,.3,1)", flexShrink: 0,
  }}>
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 14, overflow: "hidden", transition: "background .6s", ...bg }}>{children}</div>
  </div>
);

const Wave = ({ bars, color, h = 26, style }: { bars: number[]; color: string; h?: number; style?: CSSProperties }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 2, height: h, ...style }}>
    {bars.map((b, i) => <span key={i} style={{ flex: 1, minWidth: 1, height: Math.min(h, b), background: color, borderRadius: 2 }} />)}
  </div>
);

const Label = ({ children }: { children: ReactNode }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--wm-card-text)", marginBottom: 8 }}>{children}</div>
);

const Spark = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" style={{ position: "absolute", top: "50%", left: 0, marginTop: -17, pointerEvents: "none", animation: "wmFlare 1.1s cubic-bezier(.16,1,.3,1) both", filter: "drop-shadow(0 0 8px #fff)" }}>
    <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="#fff" />
  </svg>
);

/* ---------------------------- STEP 1 ------------------------------- */
const S1 = ({ t }: { t: number }) => {
  const drop = prog(t, 2700, 3500);
  const landed = t > 3500;
  const hot = t > 2400;
  return (
    <div style={center}>
      <Callout t={t} a={350} b={5000} dir="dr" x={480} y={116} text="Upload audio / video files" size={34} />
      <div style={{ position: "relative", width: 740, marginTop: 40 }}>
        <div style={{
          ...glass, padding: "40px 40px 34px", textAlign: "center",
          outline: hot ? `1.5px dashed ${CORAL}` : "1.5px dashed transparent", outlineOffset: -10, transition: "outline-color .4s, box-shadow .4s",
          ...(hot ? { boxShadow: `0 20px 50px rgba(0,0,0,.35), 0 0 40px rgba(232,99,67,.25)` } : null),
        }}>
          <div style={{ width: 58, height: 58, margin: "0 auto 16px", borderRadius: 15, display: "grid", placeItems: "center", background: "rgba(40,48,90,.35)", border: "1px solid rgba(99,102,241,.35)", boxShadow: `0 0 24px rgba(232,99,67,.22)` }}>
            <UploadCloud size={28} color={CORAL} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.3 }}>Drop your video or audio clip here</div>
          <div style={{ fontSize: 14, color: muted, margin: "10px auto 22px", maxWidth: 470, lineHeight: 1.5 }}>
            Auto-generate word-by-word synced Telugu or Tenglish subtitles without server uploads.
          </div>
          <div style={{ display: "flex", justifyContent: "center", height: 44 }}>
            {!landed ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 20px", borderRadius: 12, background: "var(--wm-lane-bg)", border: "1px solid var(--wm-lane-border)", fontSize: 13 }}>
                <FolderOpen size={16} color={CORAL} /><b>browse media file</b>
                <span style={{ color: muted, fontSize: 12 }}>MP4, MOV, WEBM, WAV, MP3</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderRadius: 12, background: "rgba(16,185,129,.12)", border: "1px solid rgba(16,185,129,.5)", fontSize: 13, animation: "wmPop .5s cubic-bezier(.16,1,.3,1) both" }}>
                <FileAudio size={16} color={EMERALD} /><b>Create Captions.wav</b><span style={{ color: muted }}>0:08</span><Check size={16} color={EMERALD} />
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 24, fontSize: 12, color: muted }}>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Zap size={13} color="#f59e0b" />High-Speed AI</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Lock size={13} color={EMERALD} />100% Private (Runs In-Browser)</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Sparkles size={13} color={CORAL} />Telugu &amp; Tenglish Dual Engine</span>
          </div>
        </div>
        {drop > 0 && drop < 1 && (
          <div style={{
            position: "absolute", left: "50%", top: 150, zIndex: 6, display: "flex", gap: 8, alignItems: "center", padding: "10px 16px", borderRadius: 12,
            background: "rgba(28,32,40,.95)", border: `1px solid ${CORAL}`, fontSize: 13, fontWeight: 700, color: "#fff",
            transform: `translate(-50%, ${(drop - 1) * 190}px) scale(${1 - drop * 0.1})`, opacity: 1 - drop * 0.6, boxShadow: `0 0 30px rgba(232,99,67,.45)`,
          }}>
            <FileAudio size={16} color={CORAL} />Create Captions.wav
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------------------- STEP 2 ------------------------------- */
const S2 = ({ t }: { t: number }) => {
  const eng = t > 1700;
  return (
    <div style={center}>
      <Callout t={t} a={350} b={4300} dir="d" x={337} y={160} text={"Pick the language\nspoken in your clip"} />
      <div style={{ position: "relative" }}>
        <div style={{ ...glass, width: 440, padding: 20, position: "relative" }}>
          <Label>Source language</Label>
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <div style={{ ...pill(eng, CORAL), flex: 1, height: 46, boxShadow: eng ? "0 0 24px rgba(232,99,67,.3)" : "none" }}>English</div>
            <div style={{ ...pill(false), flex: 1, height: 46 }}>తెలుగు</div>
          </div>
          <Label>Output format</Label>
          <div style={{ ...pill(true), height: 46 }}>English</div>
          <Cursor x={t < 600 ? 430 : 100} y={t < 600 ? 230 : 58} click={t > 1500 && t < 1800} opacity={t > 2600 ? 0 : 1} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: "100%", marginTop: 18, display: "flex", justifyContent: "center", gap: 8, alignItems: "center", fontSize: 13, color: "var(--wm-callout)", fontWeight: 600, opacity: prog(t, 2400, 3000), transform: `translateY(${(1 - prog(t, 2400, 3000)) * 10}px)` }}>
          <Languages size={16} color={EMERALD} />Language set. Captions will follow the voice in your clip.
        </div>
      </div>
    </div>
  );
};

/* ---------------------------- STEP 3 ------------------------------- */
const S3 = ({ t }: { t: number }) => {
  const p = prog(t, 1500, 3300);
  const done = t >= 3300;
  const working = t > 1300 && !done;
  const status = done ? { c: EMERALD, l: "Done" } : working ? { c: "#f59e0b", l: "Working" } : { c: SKY, l: "Ready" };
  const v = prog(t, 3800, 6800) * 8.7;
  const total = 8.7;
  const bars = useMemo(() => wave(110, 2, 20), []);
  return (
    <div style={center}>
      <Callout t={t} a={300} b={3100} dir="l" x={456} y={233} text={"Click Generate\ncaptions"} />
      <Callout t={t} a={3500} b={6700} dir="d" x={700} y={289} text={"Your captions appear\non the timeline"} />
      <div style={{ width: 780, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ ...glass, width: 400, height: 180, padding: 16, position: "relative", alignSelf: "flex-start" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            <span>Generate captions</span>
            <span style={{ fontWeight: 500, fontSize: 11, color: muted, display: "flex", alignItems: "center", gap: 6 }}>
              <i style={{ width: 7, height: 7, borderRadius: 7, background: status.c, boxShadow: `0 0 8px ${status.c}` }} />{status.l}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 8, background: "rgba(255,255,255,.07)", overflow: "hidden", marginBottom: 12 }}>
            <div style={{ width: `${p * 100}%`, height: "100%", borderRadius: 8, background: `linear-gradient(90deg, ${CORAL}, #ff9d7a)`, boxShadow: `0 0 16px ${CORAL}`, transition: "width .1s linear" }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ ...pill(false), flex: 1 }}>Standard</div>
            <div style={{ ...pill(true), flex: 1 }}>High Accuracy</div>
          </div>
          <div style={{ ...pill(true), height: 48, fontSize: 15, background: "rgba(88,98,125,.5)", transform: t > 1100 && t < 1400 ? "scale(.97)" : "scale(1)" }}>
            <RotateCcw size={16} style={{ animation: working ? "wmSpin 1s linear infinite" : "none" }} />
            {done ? "Captions ready" : working ? "Generating…" : "Generate captions"}
            {done && <Check size={16} color={EMERALD} />}
          </div>
          <Cursor x={t < 500 ? 420 : 190} y={t < 500 ? 150 : 120} click={t > 1100 && t < 1400} opacity={t > 2200 ? 0 : 1} />
        </div>

        <div style={{ ...glass, height: 150, padding: "14px 16px 16px", opacity: prog(t, 3200, 3800), transform: `translateY(${(1 - prog(t, 3200, 3800)) * 24}px)`, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--wm-card-sub)", marginBottom: 6, padding: "0 2px" }}>
            {Array.from({ length: 9 }, (_, i) => <span key={i}>{`00:0${i}`}</span>)}
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ height: 36, borderRadius: 8, background: "var(--wm-lane-bg)", border: "1px solid var(--wm-lane-border)", padding: "5px 8px", marginBottom: 8 }}>
              <Wave bars={bars} color="var(--wm-wave)" h={24} />
            </div>
            <div style={{ position: "relative", height: 36 }}>
              {CAPS.map(([txt, a, b], i) => {
                const show = prog(t, 3500 + i * 150, 3900 + i * 150);
                const active = v >= a && v < b && t > 3800;
                return (
                  <div key={txt} style={{
                    position: "absolute", left: `${(a / total) * 100}%`, width: `calc(${((b - a) / total) * 100}% - 3px)`, top: 0, bottom: 0,
                    borderRadius: 6, padding: "0 7px", display: "flex", alignItems: "center", fontSize: 10.5, fontWeight: 700, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", color: "#fff",
                    background: active ? `linear-gradient(180deg, ${CORAL}, #c94a2c)` : "linear-gradient(180deg,#2f5fe0,#2447b8)",
                    border: "1px solid var(--wm-lane-border)", opacity: show, transform: `translateY(${(1 - show) * 12}px) scale(${active ? 1.04 : 1})`,
                    boxShadow: active ? `0 0 18px rgba(232,99,67,.7)` : "none", transition: "background .25s, box-shadow .25s, transform .25s",
                  }}>{txt}</div>
                );
              })}
            </div>
            <div style={{ position: "absolute", top: -4, bottom: -4, left: `${(v / total) * 100}%`, width: 2, background: "#fff", boxShadow: "0 0 10px #fff", opacity: t > 3800 ? 1 : 0, transition: "left .1s linear" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------- STEP 4 ------------------------------- */
const S4 = ({ t }: { t: number }) => {
  const seq = [0, 1, 3, 4];
  const sel = t < 900 ? -1 : t < 2400 ? 0 : t < 3900 ? 1 : t < 5400 ? 2 : 3;
  const ring = (i: number): CSSProperties => ({
    border: `2px solid ${sel === i ? CORAL : "rgba(255,255,255,.1)"}`, boxShadow: sel === i ? `0 0 18px rgba(232,99,67,.55)` : "none",
    transition: "all .35s cubic-bezier(.16,1,.3,1)", transform: sel === i ? "scale(1.05)" : "scale(1)",
  });
  const cur = sel >= 0 ? BGS[seq[sel]].style : { background: "#0d0f14" };
  const items = seq.slice(0, Math.max(0, sel + 1));
  const tile = (style: CSSProperties, name: string, i: number, check = false) => (
    <div style={{ flex: 1, textAlign: "center", fontSize: 10, color: muted }}>
      <div style={{ height: 40, borderRadius: 8, marginBottom: 4, display: "grid", placeItems: "center", ...style, ...(i >= 0 ? ring(i) : { border: "1px solid rgba(255,255,255,.1)" }) }}>
        {check && sel === i && <Check size={14} color="#fff" />}
      </div>{name}
    </div>
  );
  return (
    <div style={{ ...center, gap: 18 }}>
      <Callout t={t} a={300} b={7000} dir="d" x={683} y={146} text={"Pick a background.\nAdd as many as you need"} />
      <div style={{ ...glass, width: 300, padding: 14, fontSize: 11 }}>
        <div style={{ fontWeight: 800, fontSize: 11, color: muted, marginBottom: 8 }}>Style &amp; Appearance</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
          <div style={{ ...pill(true), height: 30, fontSize: 11, background: CORAL, border: `1px solid ${CORAL}`, gap: 5 }}><ImageIcon size={12} />Backgrounds</div>
          <div style={{ ...pill(false), height: 30, fontSize: 11 }}>Templates</div>
        </div>
        <div style={{ fontWeight: 700, color: "var(--wm-card-sub)", marginBottom: 6 }}>Plain colors</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["#fff", "#ef4444", "#22c55e", "#f26b4f", "#000"].map((c) => <i key={c} style={{ width: 22, height: 22, borderRadius: 22, background: c, border: "1px solid var(--wm-lane-border)" }} />)}
          <i style={{ width: 22, height: 22, borderRadius: 22, border: "1px dashed rgba(255,255,255,.4)", display: "grid", placeItems: "center" }}><Plus size={12} /></i>
        </div>
        <div style={{ fontWeight: 700, color: "var(--wm-card-sub)", marginBottom: 6 }}>Gradients</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {tile(BGS[1].style, "Sunset", 1)}
          {tile(BGS[3].style, "Deep Blue", 2)}
          {tile({ background: "linear-gradient(135deg,#7c3aed,#d946ef)" }, "Purple Haze", -1)}
        </div>
        <div style={{ fontWeight: 700, color: "var(--wm-card-sub)", marginBottom: 6 }}>Patterns</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {tile({ ...GRID, backgroundSize: "10px 10px" }, "Grid", 0, true)}
          {tile({ background: "radial-gradient(rgba(255,255,255,.35) 1px,#1b1a3d 1.5px) 0 0/10px 10px" }, "Dots", -1)}
          {tile({ background: "repeating-linear-gradient(135deg,#1c2030 0 4px,#262b40 4px 5px)" }, "Lines", -1)}
        </div>
        <div style={{ height: 46, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 700, background: "var(--wm-lane-bg)", color: "var(--wm-card-text)", ...(sel === 3 ? { border: `2px solid ${CORAL}`, boxShadow: `0 0 18px rgba(232,99,67,.5)` } : { border: "1.5px dashed var(--wm-lane-border)" }), transition: "all .35s" }}>
          <FolderOpen size={14} color={CORAL} />Choose Photo or Video
        </div>
      </div>

      <Phone w={150} h={266} bg={cur}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,.6)" }}>
          Create <b style={{ fontStyle: "normal", fontFamily: FONT, borderBottom: "2px solid #ef4444" }}>CAPTIONS,</b>
        </div>
      </Phone>

      <div style={{ ...glass, width: 250, padding: 14, fontSize: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Background track</div>
        <div style={{ display: "flex", gap: 3, height: 26, marginBottom: 12 }}>
          {items.map((k, i) => <div key={i} style={{ flex: 1, borderRadius: 6, ...BGS[k].style, border: "1px solid rgba(255,255,255,.3)", animation: "wmPop .5s cubic-bezier(.16,1,.3,1) both" }} />)}
          {items.length === 0 && <div style={{ flex: 1, borderRadius: 6, border: "1px dashed rgba(255,255,255,.2)" }} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 124 }}>
          {items.map((k, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, background: "rgba(167,139,250,.14)", border: "1px solid rgba(167,139,250,.35)", fontSize: 11, fontWeight: 700, animation: "wmPop .5s cubic-bezier(.16,1,.3,1) both" }}>
              <span style={{ color: "#c4b5fd" }}>{i + 1}</span>Theme: {BGS[k].name}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 6, alignItems: "center", fontSize: 11, color: muted }}><Plus size={13} color={CORAL} />Add as many as you need</div>
      </div>
    </div>
  );
};

/* ---------------------------- STEP 5 ------------------------------- */
const S5 = ({ t }: { t: number }) => {
  const reveal = prog(t, 1500, 2600);
  const vol = t < 3000 ? 21 : t < 4000 ? 21 + 34 * prog(t, 3000, 4000) : 55 - 20 * prog(t, 4000, 5000);
  const v = prog(t, 2200, 5600) * 6;
  const audio = useMemo(() => wave(80, 1, 16), []);
  const music = useMemo(() => wave(120, 4, 26), []);
  const lane: CSSProperties = { position: "relative", height: 36, borderRadius: 8, background: "var(--wm-lane-bg)", border: "1px solid var(--wm-lane-border)", overflow: "hidden" };
  const row = (label: string, color: string, content: ReactNode) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
      <div style={{ width: 90, fontSize: 11, fontWeight: 800, color }}>{label}</div>
      <div style={{ flex: 1, ...lane }}>{content}</div>
    </div>
  );
  return (
    <div style={center}>
      <Callout t={t} a={300} b={2700} dir="l" x={482} y={360} text={"Add music from\nyour device"} />
      <Callout t={t} a={3000} b={5900} dir="l" x={482} y={403} text={"Drag to set\nthe volume"} />
      <div style={{ width: 780, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ ...glass, padding: "14px 16px 6px", position: "relative" }}>
          {row("Audio", "#38bdf8", <div style={{ padding: "5px 8px", width: "96%" }}><Wave bars={audio} color="var(--wm-wave)" h={24} /></div>)}
          {row("Background", "#a78bfa", <div style={{ display: "flex", height: "100%", fontSize: 10, color: muted }}>{["PATTERN-GRID", "SUNSET-MESH", "DEEP-BLUE", "LOCAL-PHOTO"].map((n) => <div key={n} style={{ flex: 1, padding: "0 8px", display: "flex", alignItems: "center", borderRight: "1px solid var(--wm-lane-border)" }}>Theme: {n}</div>)}</div>)}
          {row("Caption", "#e5e7eb", <div style={{ display: "flex", height: "100%", gap: 3, padding: 3 }}>{CAPS.map(([c, a, b]) => <div key={c} style={{ flex: b - a, borderRadius: 5, background: "var(--wm-chip-bg)", border: "1px solid var(--wm-lane-border)", fontSize: 9.5, fontWeight: 700, color: muted, padding: "0 6px", display: "flex", alignItems: "center", overflow: "hidden", whiteSpace: "nowrap" }}>{c}</div>)}</div>)}
          {row("Music", EMERALD,
            <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - reveal * 100}% 0 0)`, background: "rgba(16,185,129,.2)", border: `1px solid ${EMERALD}`, borderRadius: 8, padding: "5px 8px", boxShadow: `0 0 20px rgba(16,185,129,.35)` }}>
              <Wave bars={music} color={EMERALD} h={24} />
              <span style={{ position: "absolute", left: 10, top: 9, fontSize: 10, fontWeight: 800, color: "#fff", textShadow: "0 1px 4px #000" }}>ncprime-nc-5-617584.mp3</span>
            </div>)}
          <div style={{ position: "absolute", top: 12, bottom: 12, left: `calc(118px + ${(v / 8.7) * (780 - 32 - 102)}px)`, width: 2, background: "#fff", boxShadow: "0 0 10px #fff", opacity: reveal > 0.9 ? 1 : 0, transition: "left .1s linear" }} />
        </div>

        <div style={{ ...glass, width: 440, padding: 16, position: "relative", alignSelf: "flex-start" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ ...pill(false), flex: 1, gap: 8 }}><Play size={13} fill="currentColor" />play</div>
            <div style={{ ...pill(t > 1300, EMERALD), flex: 1, boxShadow: t > 1300 ? `0 0 20px rgba(16,185,129,.35)` : "none", transform: t > 1250 && t < 1450 ? "scale(.96)" : undefined }}><Music size={13} />music</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
            <b style={{ fontVariantNumeric: "tabular-nums" }}>0:00 / 0:08</b>
            <Volume2 size={15} color={muted} />
            <div style={{ flex: 1, height: 4, borderRadius: 4, background: "var(--wm-lane-border)", position: "relative" }}>
              <div style={{ width: `${vol}%`, height: "100%", borderRadius: 4, background: "#fff", transition: "width .1s linear" }} />
              <i style={{ position: "absolute", left: `${vol}%`, top: -6, marginLeft: -8, width: 16, height: 16, borderRadius: 16, background: "#fff", boxShadow: `0 0 12px rgba(255,255,255,.6)` }} />
            </div>
            <b style={{ width: 36, textAlign: "right", color: muted, fontVariantNumeric: "tabular-nums" }}>{Math.round(vol)}%</b>
          </div>
          <Cursor x={t < 500 ? 420 : 300} y={t < 500 ? 120 : 26} click={t > 1250 && t < 1550} opacity={t > 2100 ? 0 : 1} />
        </div>
      </div>
    </div>
  );
};

/* ---------------------------- STEP 6 ------------------------------- */
type View = "reels" | "shorts" | "yt";
const SafePreview = ({ mode }: { mode: View }) => {
  const wide = mode === "yt";
  const icon = (n: ReactNode, l?: string) => <div style={{ textAlign: "center", fontSize: 8, lineHeight: 1 }}>{n}{l && <div style={{ marginTop: 2 }}>{l}</div>}</div>;
  const side: CSSProperties = { position: "absolute", right: 8, bottom: 62, display: "flex", flexDirection: "column", gap: 14, alignItems: "center", color: "#fff" };
  return (
    <Phone w={wide ? 440 : 214} h={wide ? 248 : 380} bg={GRID}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,.25),transparent 25%,transparent 60%,rgba(0,0,0,.5))" }} />
      {!wide && <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 38, background: "rgba(239,68,68,.12)", borderLeft: "1px dashed rgba(239,68,68,.6)" }} />}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: wide ? 46 : 56, background: "rgba(239,68,68,.12)", borderTop: "1px dashed rgba(239,68,68,.6)" }} />
      <div style={{ position: "absolute", left: 0, right: wide ? 0 : 40, bottom: wide ? 64 : 76, textAlign: "center", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: wide ? 22 : 17, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,.6)", transition: "all .5s" }}>
        Create <b style={{ fontStyle: "normal", fontFamily: FONT, borderBottom: "2px solid #ef4444" }}>CAPTIONS,</b>
      </div>
      {mode === "reels" && <>
        <div style={{ position: "absolute", top: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 10, fontSize: 10, fontWeight: 700, color: "#fff" }}>Reels <span style={{ opacity: 0.6 }}>Friends</span></div>
        <div style={side}>{icon(<Heart size={18} />)}{icon(<MessageCircle size={18} />)}{icon(<Repeat2 size={18} />)}{icon(<Send size={18} />)}{icon(<Bookmark size={18} />)}</div>
        <div style={{ position: "absolute", left: 8, bottom: 14, display: "flex", gap: 6, alignItems: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
          <i style={{ width: 20, height: 20, borderRadius: 20, background: CORAL }} />Insta reel Safe zone<span style={{ border: "1px solid #fff", borderRadius: 4, padding: "1px 5px" }}>Follow</span>
        </div>
      </>}
      {mode === "shorts" && <>
        <div style={{ position: "absolute", top: 8, left: 8, right: 8, display: "flex", justifyContent: "space-between", color: "#fff" }}><ArrowLeft size={15} /><span style={{ display: "flex", gap: 8 }}><Search size={15} /><MoreVertical size={15} /></span></div>
        <div style={side}>{icon(<Heart size={18} />)}{icon(<MessageSquare size={18} />)}{icon(<Bookmark size={18} />, "Save")}{icon(<Share2 size={18} />, "Share")}</div>
        <div style={{ position: "absolute", left: 8, bottom: 14, display: "flex", gap: 6, alignItems: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
          <i style={{ width: 20, height: 20, borderRadius: 20, background: "#ef4444" }} />YT short Safe zone<span style={{ background: "#fff", color: "#000", borderRadius: 10, padding: "2px 7px" }}>Subscribe</span>
        </div>
      </>}
      {mode === "yt" && <>
        <div style={{ position: "absolute", top: 8, left: 10, display: "flex", gap: 7, alignItems: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}><i style={{ width: 16, height: 16, borderRadius: 16, background: "#3b82f6" }} />Video Title, YouTube Long-Form Player</div>
        <div style={{ position: "absolute", left: 10, right: 10, bottom: 30, height: 3, background: "rgba(255,255,255,.3)", borderRadius: 3 }}><div style={{ width: "30%", height: "100%", background: "#ef4444" }} /></div>
        <div style={{ position: "absolute", left: 10, bottom: 8, display: "flex", gap: 8, alignItems: "center", fontSize: 9, color: "#fff" }}><Play size={12} fill="#fff" />03:45 / 12:30</div>
      </>}
    </Phone>
  );
};

const S6 = ({ t }: { t: number }) => {
  const on = t > 800;
  const mode: View = t < 3000 ? "reels" : t < 4600 ? "shorts" : "yt";
  const tabs: [View, string][] = [["reels", "Reels"], ["shorts", "YT Shorts"], ["yt", "YouTube (16:9)"]];
  return (
    <div style={{ ...center, gap: 24 }}>
      <Callout t={t} a={300} b={6300} dir="d" x={198} y={165} text={"Turn on Safe Area,\nthen check each app"} />
      <div style={{ ...glass, width: 290, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 12, background: "var(--wm-lane-bg)", border: "1px solid var(--wm-lane-border)", fontSize: 13, fontWeight: 800, marginBottom: 12 }}>
          Safe Area Overlays
          <span style={{ width: 20, height: 20, borderRadius: 5, display: "grid", placeItems: "center", background: on ? CORAL : "transparent", border: `1.5px solid ${on ? CORAL : "var(--wm-lane-border)"}`, transition: "all .3s cubic-bezier(.16,1,.3,1)", transform: on ? "scale(1.1)" : "scale(1)" }}>{on && <Check size={13} color="#fff" strokeWidth={3} />}</span>
        </div>
        <div style={{ display: "flex", padding: 4, borderRadius: 12, background: "var(--wm-lane-bg)", border: "1px solid var(--wm-lane-border)" }}>
          {tabs.map(([k, l]) => (
            <div key={k} style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: 700, padding: "9px 4px", borderRadius: 9, color: mode === k && on ? "#fff" : muted, background: mode === k && on ? "rgba(88,98,125,.55)" : "transparent", transition: "all .35s" }}>{l}</div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 12, color: muted, lineHeight: 1.6 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}><i style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(239,68,68,.35)", border: "1px dashed rgba(239,68,68,.8)" }} />App buttons and profile bar</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Check size={14} color={EMERALD} />Keep captions inside the clear area</div>
        </div>
      </div>
      <div style={{ width: 460, height: 400, display: "flex", alignItems: "center", justifyContent: "center", opacity: on ? 1 : 0.35, transition: "opacity .5s" }}>
        <SafePreview mode={mode} />
      </div>
    </div>
  );
};

/* ---------------------------- STEP 7 ------------------------------- */
const S7 = ({ t }: { t: number }) => {
  const checks = ["Voiceover audio, 0:08", "Captions, 8 phrases", "Backgrounds, 4 added", "Music, volume 35%", "Safe areas checked"];
  const clicked = t > 2200;
  return (
    <div style={center}>
      <Callout t={t} a={250} b={3300} dir="d" x={686} y={160} text="Click Export" size={34} />
      <div style={{ ...glass, width: 640, padding: 18, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40, padding: "11px 14px", borderRadius: 10, background: "var(--wm-lane-bg)", border: "1px solid var(--wm-lane-border)", fontSize: 13, fontWeight: 700 }}>Create Captions<Pencil size={13} color={muted} /></div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 12, fontWeight: 800, fontSize: 14, color: "#fff", background: `linear-gradient(135deg, ${CORAL}, #f08a5d)`,
            boxShadow: t > 1800 ? `0 0 34px rgba(232,99,67,.7)` : `0 6px 18px rgba(232,99,67,.3)`, transform: clicked && t < 2500 ? "scale(.94)" : t > 1800 ? "scale(1.05)" : "scale(1)", transition: "all .25s cubic-bezier(.16,1,.3,1)",
          }}><Download size={16} />Export</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {checks.map((c, i) => {
            const p = prog(t, 300 + i * 300, 700 + i * 300);
            return (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: "var(--wm-lane-bg)", border: "1px solid var(--wm-lane-border)", fontSize: 13, opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
                <span style={{ width: 20, height: 20, borderRadius: 20, display: "grid", placeItems: "center", background: "rgba(16,185,129,.2)", border: `1px solid ${EMERALD}` }}><Check size={12} color={EMERALD} strokeWidth={3} /></span>{c}
              </div>
            );
          })}
        </div>
        <Cursor x={t < 800 ? 300 : 546} y={t < 800 ? 220 : 30} click={t > 2200 && t < 2500} opacity={t > 3000 ? 0 : 1} />
      </div>
    </div>
  );
};

/* ---------------------------- STEP 8 ------------------------------- */
const S8 = ({ t }: { t: number }) => {
  const res = t < 700 ? "720p" : "1080p";
  const ratio = t < 1500 ? "1:1" : "9:16";
  const fps = t < 2300 ? "24" : "30";
  const fmt = t < 3000 ? "WEBM" : "MP4";
  const rp = prog(t, 4200, 6000);
  const rendering = t >= 4200 && rp < 1;
  const done = rp >= 1;
  const dims = ratio === "9:16" ? [76, 136] : [120, 120];
  const opt = (label: string, active: boolean, tag?: string) => (
    <div style={{ ...pill(active, active ? CORAL : undefined), height: 32, fontSize: 12, justifyContent: tag ? "space-between" : "center", padding: "0 10px", background: active ? "rgba(232,99,67,.2)" : "rgba(255,255,255,.04)" }}>
      {label}{tag && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 5, background: "var(--wm-chip-bg)", color: "var(--wm-card-sub)" }}>{tag}</span>}
    </div>
  );
  const grp = (title: string, kids: ReactNode, cols: number) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--wm-card-sub)", marginBottom: 6 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>{kids}</div>
    </div>
  );
  return (
    <div style={{ ...center, gap: 18 }}>
      <Callout t={t} a={250} b={3800} dir="dl" x={230} y={78} text="Pick resolution, format and more" />
      <Callout t={t} a={4000} b={7300} dir="dr" x={674} y={78} text="Render and download" />
      <div style={{ ...glass, width: 450, padding: "12px 18px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--wm-lane-border)" }}><Film size={14} color={CORAL} />Render Settings</div>
        {grp("Target Resolution", ["720p", "1080p", "2K", "4K"].map((r) => <React.Fragment key={r}>{opt(r, r === res)}</React.Fragment>), 4)}
        {grp("Canvas Aspect Ratio", <>
          {opt("9:16 Reels", ratio === "9:16", "Portrait")}{opt("16:9 YouTube", false, "Landscape")}
          {opt("1:1 Square", ratio === "1:1", "Square")}{opt("4:5 Feed", false, "Feed")}</>, 2)}
        {grp("Framerate", ["24", "30", "60"].map((f) => <React.Fragment key={f}>{opt(`${f} fps`, f === fps)}</React.Fragment>), 3)}
        {grp("Format & Codec", ["WEBM", "MP4", "MOV", "MKV"].map((f) => <React.Fragment key={f}>{opt(f, f === fmt)}</React.Fragment>), 4)}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", borderRadius: 10, background: "var(--wm-lane-bg)", border: "1px solid var(--wm-lane-border)", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
          Create Captions<span style={{ color: muted, fontWeight: 500 }}>.{fmt.toLowerCase()}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 330 }}>
        <div style={{ ...glass, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, marginBottom: 10 }}>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Film size={13} color={CORAL} />Master Preview</span>
            <span style={{ color: muted, fontWeight: 500, fontSize: 11 }}>{ratio} • {res}</span>
          </div>
          <div style={{ height: 150, borderRadius: 12, background: "rgba(0,0,0,.35)", display: "grid", placeItems: "center", marginBottom: 12 }}>
            <Phone w={dims[0]} h={dims[1]} bg={GRID}>
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", background: "#000", color: "#fff", fontSize: 8, padding: "3px 7px", borderRadius: 5, whiteSpace: "nowrap" }}>Create Captions,</div>
            </Phone>
          </div>
          <div style={{
            position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 12, fontSize: 13, fontWeight: 800, color: "#fff",
            background: done ? `linear-gradient(135deg, ${EMERALD}, #34d399)` : `linear-gradient(90deg, ${CORAL}, #8b9cf0 60%, #5b9cf6)`,
            boxShadow: done ? `0 0 30px rgba(16,185,129,.55)` : `0 8px 22px rgba(232,99,67,.3)`, transform: t > 3900 && t < 4150 ? "scale(.96)" : "scale(1)", transition: "all .3s",
          }}>
            {rendering && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${rp * 100}%`, background: "rgba(255,255,255,.22)" }} />}
            <span style={{ position: "relative", display: "flex", gap: 8, alignItems: "center" }}>
              {done ? <><Check size={16} />Video ready, downloading</> : rendering ? <>Rendering {Math.round(rp * 100)}%</> : <><Film size={15} />Render and Download Video<Download size={14} /></>}
            </span>
            {done && <Spark />}
          </div>
        </div>
        <div style={{ ...glass, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, marginBottom: 10 }}><FileText size={13} color={CORAL} />Subtitle Interchanges</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["Download SRT", "SubRip interchange"], ["Download VTT", "Web & HTML5 standard"]].map(([a, b]) => (
              <div key={a} style={{ flex: 1, padding: "9px 10px", borderRadius: 10, background: "var(--wm-lane-bg)", border: `1px solid ${t > 6200 ? "rgba(232,99,67,.6)" : "var(--wm-lane-border)"}`, fontSize: 11, fontWeight: 700, transition: "border-color .4s" }}>
                {a}<div style={{ fontWeight: 500, color: muted, fontSize: 9.5, marginTop: 2 }}>{b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------- STEP 9 ------------------------------- */
const S9 = ({ t }: { t: number }) => {
  const v = clamp01((t - 700) / 8700) * 8.7;   // real time: matches the audio
  const idx = Math.max(0, CAPS.findIndex(([, a, b]) => v >= a && v < b));
  const [txt, a, b] = v >= 8.7 ? CAPS[CAPS.length - 1] : CAPS[idx];
  const words = txt.split(" ");
  const wp = clamp01((v - a) / (b - a));
  const activeW = Math.min(words.length - 1, Math.floor(wp * words.length));
  const bg = BGS[[0, 1, 2, 3][Math.min(3, Math.floor(v / 2.2))]].style;
  const playing = t > 700 && v < 8.7;
  return (
    <div style={{ ...center, gap: 40 }}>
      <Callout t={t} a={1500} b={10000} dir="u" x={578} y={402} text={"Your final video,\nwith sound!"} />
      <Phone w={236} h={420} bg={bg}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 55%,rgba(0,0,0,.4))" }} />
        <div style={{ position: "absolute", left: 10, right: 10, bottom: 70, textAlign: "center", fontSize: 21, lineHeight: 1.25, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.6)" }}>
          {words.map((w, i) => (
            <span key={`${idx}-${i}`} style={{
              display: "inline-block", margin: "0 3px", opacity: i <= activeW ? 1 : 0.35, transform: i === activeW ? "scale(1.12)" : "scale(1)", transition: "all .2s",
              ...(i === 0 ? { fontFamily: "Georgia, serif", fontStyle: "italic" } : { fontFamily: FONT, fontWeight: 800, textTransform: "uppercase" as const }),
              borderBottom: i === activeW ? "3px solid #ef4444" : "3px solid transparent",
            }}>{w}</span>
          ))}
        </div>
        <div style={{ position: "absolute", left: 12, bottom: 38, display: "flex", gap: 6, alignItems: "center", fontSize: 10, color: "#fff" }}>
          <Music size={11} />
          <span style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 12 }}>
            {[0, 1, 2, 3].map((i) => <i key={i} style={{ width: 2.5, background: EMERALD, borderRadius: 2, height: 12, transformOrigin: "bottom", animation: playing ? `wmEq ${0.5 + i * 0.13}s ease-in-out ${i * 0.07}s infinite alternate` : "none" }} />)}
          </span>
        </div>
        <div style={{ position: "absolute", left: 10, right: 10, bottom: 14, height: 3, borderRadius: 3, background: "rgba(255,255,255,.25)" }}>
          <div style={{ width: `${(v / 8.7) * 100}%`, height: "100%", background: "#fff", borderRadius: 3, transition: "width .1s linear" }} />
        </div>
        {t <= 700 && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><span style={{ width: 54, height: 54, borderRadius: 54, background: "rgba(0,0,0,.55)", display: "grid", placeItems: "center" }}><Play size={24} fill="#fff" color="#fff" /></span></div>}
      </Phone>

      <div style={{ ...glass, width: 360, padding: 22, opacity: prog(t, 300, 900), transform: `translateY(${(1 - prog(t, 300, 900)) * 20}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ width: 30, height: 30, borderRadius: 30, display: "grid", placeItems: "center", background: "rgba(16,185,129,.2)", border: `1px solid ${EMERALD}`, boxShadow: `0 0 20px rgba(16,185,129,.5)`, animation: "wmPulse 1.8s ease-in-out infinite" }}><Check size={16} color={EMERALD} strokeWidth={3} /></span>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Your video is ready</div>
        </div>
        <div style={{ fontSize: 13, color: muted, marginBottom: 16 }}>Captions, backgrounds and music, rendered in your browser.</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, background: "var(--wm-lane-bg)", border: "1px solid var(--wm-lane-border)", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
          <Film size={16} color={CORAL} />Create Captions.mp4
          <span style={{ marginLeft: "auto", fontWeight: 500, color: muted, fontSize: 11 }}>1080 × 1920, 30 fps</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["SRT", "VTT"].map((x) => <div key={x} style={{ flex: 1, display: "flex", gap: 6, alignItems: "center", justifyContent: "center", padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "rgba(232,99,67,.12)", border: "1px solid rgba(232,99,67,.4)" }}><FileText size={13} color={CORAL} />{x}</div>)}
        </div>
      </div>
    </div>
  );
};

const STAGES = [S1, S2, S3, S4, S5, S6, S7, S8, S9];

/* ------------------- one editor-style transition per step ---------- */
const TRANSITION_CSS = `
@keyframes wmIn0{from{opacity:0;transform:scale(1.3);filter:blur(18px)}to{opacity:1;transform:none;filter:blur(0)}}
@keyframes wmOut0{to{opacity:0;transform:translateY(-24px) scale(.85);filter:grayscale(1) blur(4px)}}
@keyframes wmIn1{from{opacity:0;transform:translateX(170px) skewX(-10deg);filter:blur(12px)}to{opacity:1;transform:none;filter:blur(0)}}
@keyframes wmOut1{to{opacity:0;transform:translateX(-170px) skewX(10deg);filter:blur(12px)}}
@keyframes wmIn2{from{opacity:0;transform:perspective(900px) rotateX(70deg) translateY(80px);transform-origin:50% 100%}to{opacity:1;transform:perspective(900px) rotateX(0) translateY(0);transform-origin:50% 100%}}
@keyframes wmOut2{to{opacity:0;transform:perspective(900px) rotateX(-55deg) translateY(-50px);transform-origin:50% 0%}}
@keyframes wmIn3{from{clip-path:circle(0% at 50% 50%)}to{clip-path:circle(110% at 50% 50%)}}
@keyframes wmOut3{from{clip-path:circle(110% at 50% 50%);transform:scale(1)}to{clip-path:circle(0% at 50% 50%);transform:scale(.9)}}
@keyframes wmIn4{from{opacity:.2;transform:translateY(105%) scale(1.05);filter:blur(14px)}65%{opacity:1;transform:translateY(-3%) scale(1)}to{opacity:1;transform:none;filter:blur(0)}}
@keyframes wmOut4{to{opacity:.2;transform:translateY(-105%) scale(1.05);filter:blur(14px)}}
@keyframes wmIn5{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes wmOut5{from{clip-path:inset(0 0 0 0)}to{clip-path:inset(0 0 0 100%)}}
@keyframes wmIn6{0%{opacity:0;transform:translateX(-30px) skewX(20deg);filter:hue-rotate(90deg) saturate(3)}20%{opacity:1;transform:translateX(22px) skewX(-14deg);filter:hue-rotate(-60deg) saturate(3)}35%{opacity:.4;transform:translateX(-12px)}50%{opacity:1;transform:translateX(8px) skewX(6deg);filter:hue-rotate(40deg)}70%{transform:translateX(-3px);filter:none}100%{opacity:1;transform:none;filter:none}}
@keyframes wmOut6{to{opacity:0;transform:scale(1.7);filter:blur(16px) brightness(1.8)}}
@keyframes wmIn7{from{opacity:0;transform:rotate(-14deg) scale(.55);filter:blur(10px)}to{opacity:1;transform:none;filter:blur(0)}}
@keyframes wmOut7{to{opacity:0;transform:rotate(12deg) scale(.6);filter:blur(10px)}}
@keyframes wmIn8{from{opacity:0;transform:scale(.82);filter:brightness(2.4) blur(8px)}to{opacity:1;transform:none;filter:none}}
@keyframes wmOut8{to{opacity:0;transform:translateY(-24px) scale(.85);filter:grayscale(1) blur(4px)}}
${Array.from({ length: 9 }, (_, i) => `.wm-in-${i}{animation-name:wmIn${i}}.wm-out-${i}{animation-name:wmOut${i}}`).join("")}
.wm-in-6{animation-timing-function:linear;animation-duration:.75s}
`;

/* ------------------------------ MAIN ------------------------------- */
export interface WorkflowMotionGraphicProps {
  /** "auto" follows your site's light/dark toggle (class, data-theme, or page background). */
  theme?: "auto" | "light" | "dark";
  /** Audio played with the final video (defaults to the voice + music of your exported video). */
  audioSrc?: string;
  className?: string;
}

export default function WorkflowMotionGraphic({ theme = "auto", audioSrc, className }: WorkflowMotionGraphicProps) {
  const mode = useThemeMode(theme);
  const [step, setStep] = useState(0);
  const [t, setT] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [leaving, setLeaving] = useState<{ step: number; t: number; id: number } | null>(null);
  const [scale, setScale] = useState(0.68);
  const [visible, setVisible] = useState(true);
  const [muted, setMuted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const live = useRef({ step: 0, t: 0 });
  const prevT = useRef(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressWhileLocked = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [sfx] = useState(() => new Sfx());
  live.current = { step, t };

  /* fit stage to container + pause when scrolled out of view */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1.15, Math.max(0.85, (el.clientWidth / W) * 1.08))));
    ro.observe(el);
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 }) : null;
    io?.observe(el);
    return () => { ro.disconnect(); io?.disconnect(); };
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /* sound: remember mute, unlock audio on the first user gesture */
  useEffect(() => { try { setMuted(localStorage.getItem("wm-muted") === "1"); } catch { /* ignore */ } }, []);
  useEffect(() => {
    sfx.muted = muted;
    try { localStorage.setItem("wm-muted", muted ? "1" : "0"); } catch { /* ignore */ }
  }, [muted, sfx]);
  useEffect(() => {
    const evs = ["pointerdown", "keydown", "touchend"] as const;
    const un = () => { sfx.unlock(); setUnlocked(true); evs.forEach((e) => window.removeEventListener(e, un)); };
    evs.forEach((e) => window.addEventListener(e, un));
    return () => evs.forEach((e) => window.removeEventListener(e, un));
  }, [sfx]);

  /* the real audio of the exported video */
  useEffect(() => {
    const a = new Audio(audioSrc ?? DEFAULT_AUDIO);
    a.preload = "auto";
    audioRef.current = a;
    return () => { a.pause(); audioRef.current = null; };
  }, [audioSrc]);

  const goTo = useCallback((i: number) => {
    const n = (i + STEPS.length) % STEPS.length;
    const { step: s, t: lt } = live.current;
    const id = Date.now();
    setLeaving({ step: s, t: lt, id });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLeaving((l) => (l && l.id === id ? null : l)), 800);
    prevT.current = -1;
    sfx.play(n % 2 ? "whoosh" : "whooshDown");
    setStep(n); setT(0); setNonce((x) => x + 1);
  }, [sfx]);

  /* clock */
  const running = visible;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setT((p) => p + TICK), TICK);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => { if (t >= STEPS[step].dur) goTo(step + 1); }, [t, step, goTo]);

  /* sfx cues */
  useEffect(() => {
    const prev = prevT.current;
    prevT.current = t;
    (CUES[step] || []).forEach((c) => { if (c.at > prev && c.at <= t) sfx.play(c.s); });
  }, [t, step, sfx]);

  /* audio sync for step 9 */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const target = (t - 700) / 1000;
    const want = step === 8 && target >= 0 && target < 8.6 && running && unlocked && !muted;
    if (!want) { if (!a.paused) a.pause(); return; }
    if (a.paused) { a.currentTime = target; a.play().catch(() => { /* blocked or missing file */ }); }
    else if (Math.abs(a.currentTime - target) > 0.4) a.currentTime = target;
  }, [t, step, running, unlocked, muted]);

  const Cur = STAGES[step];
  const Out = leaving ? STAGES[leaving.step] : null;

  const vars = { ...THEME_VARS[mode], background: "transparent", boxShadow: "none" } as CSSProperties;

  return (
    <section
      className={`wm-root ${className ?? ""}`}
      aria-label="Caption Craft workflow tour"
      style={{ ...vars, position: "relative", width: "100%", maxWidth: "100%", margin: "0 0 0 auto", fontFamily: FONT, color: "#f4f4f5" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
        .wm-root, .wm-root *, .wm-root *::before, .wm-root *::after { box-sizing: border-box; }
        @keyframes wmPop { 0%{opacity:0;transform:scale(.8)} 100%{opacity:1;transform:scale(1)} }
        @keyframes wmSpin { to{transform:rotate(360deg)} }
        @keyframes wmRipple { 0%{opacity:.9;transform:scale(.4)} 100%{opacity:0;transform:scale(1.8)} }
        @keyframes wmFlare { 0%{left:-10%;opacity:0;transform:scale(.3) rotate(0)} 30%{opacity:1;transform:scale(1.2) rotate(45deg)} 100%{left:100%;opacity:0;transform:scale(.4) rotate(120deg)} }
        @keyframes wmEq { from{transform:scaleY(.25)} to{transform:scaleY(1)} }
        @keyframes wmPulse { 0%,100%{box-shadow:0 0 12px rgba(16,185,129,.35)} 50%{box-shadow:0 0 28px rgba(16,185,129,.8)} }
        @keyframes wmHint { 0%,100%{opacity:.55} 50%{opacity:1} }
        .wm-in{animation-duration:.95s;animation-timing-function:cubic-bezier(.16,1,.3,1);animation-fill-mode:both;animation-delay:.16s}
        .wm-out{animation-duration:.7s;animation-timing-function:cubic-bezier(.5,0,.75,0);animation-fill-mode:both;pointer-events:none}
        ${TRANSITION_CSS}
        .wm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
        .wm-snd:focus-visible{outline:2px solid ${CORAL};outline-offset:2px}
        @media (prefers-reduced-motion: reduce){ .wm-in,.wm-out{animation-duration:.01s !important;animation-delay:0s !important} }
      `}</style>

      <span className="wm-sr" aria-live="polite">{STEPS[step].title}. {STEPS[step].desc}</span>

      <div ref={wrapRef} style={{ position: "relative", width: "100%", height: H * scale, overflow: "visible", background: "transparent", boxShadow: "none" }}>
        <div style={{ position: "absolute", right: 0, top: 0, width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top right" }}>
          {Out && leaving && (
            <div key={`o${leaving.id}`} className={`wm-out wm-out-${leaving.step}`} style={{ position: "absolute", inset: 0 }}><Out t={leaving.t} /></div>
          )}
          <div key={`${step}-${nonce}`} className={`wm-in wm-in-${step}`} style={{ position: "absolute", inset: 0 }}><Cur t={t} /></div>
        </div>

        {/* the only control: sound on / mute */}
        <div style={{ position: "absolute", right: 6, bottom: 6, zIndex: 50, display: "flex", alignItems: "center", gap: 8 }}>
          {!unlocked && !muted && (
            <span style={{ fontFamily: HAND, fontSize: 22, color: "var(--wm-callout)", animation: "wmHint 1.6s ease-in-out infinite", pointerEvents: "none" }}>click for sound</span>
          )}
          <button
            className="wm-snd"
            type="button"
            aria-pressed={muted}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            title={muted ? "Unmute" : "Mute"}
            onPointerDown={() => { pressWhileLocked.current = !sfx.unlocked; }}
            onKeyDown={() => { pressWhileLocked.current = !sfx.unlocked; }}
            onClick={() => {
              if (pressWhileLocked.current) { pressWhileLocked.current = false; if (muted) setMuted(false); return; }
              setMuted((m) => !m);
            }}
            style={{ ...glass, width: 40, height: 40, borderRadius: 14, display: "grid", placeItems: "center", cursor: "pointer", padding: 0, color: muted ? "rgba(255,255,255,.55)" : "#fff" }}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} color={CORAL} />}
          </button>
        </div>
      </div>
    </section>
  );
}

/* voice + music from your exported "Create Captions.mp4" (8.7s, mono mp3) */
const DEFAULT_AUDIO = "data:audio/mpeg;base64,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";
