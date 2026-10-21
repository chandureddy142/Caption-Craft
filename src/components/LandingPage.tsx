import { useNavigate } from "react-router-dom";
import React, {  useState  } from "react";
import {
  ShieldCheck,
  Languages,
  Zap,
  ArrowRight,
  Sliders,
  Type,
  Eye,
  Film,
  Check,
  Upload,
  Volume2,
  Video
} from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const routerNavigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"tenglish" | "telugu" | "english">("tenglish");

  
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <div className="cc-page">
      <style>{`
        :root {
          color-scheme: dark;
          --bg-page: var(--bg-app);
          --surface: var(--bg-surface);
          --surface-elevated: #1a202c;
          --border: #252b39;
          --accent: var(--accent-primary, var(--accent-primary));
          --accent-hover: var(--accent-hover, var(--accent-primary-hover));
          --text-primary: #F3F6F4;
          --text-secondary: #A0AAA5;
          --text-muted: #737F79;
        }

        .cc-page {
          background-color: var(--bg-page);
          color: var(--text-primary);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
          line-height: 1.5;
          min-height: 100vh;
        }

        .cc-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .cc-section {
          padding: 88px 0;
          position: relative;
        }

        /* typography */
        .cc-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--accent);
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.25);
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 20px;
          letter-spacing: 0.02em;
        }

        .cc-h1 {
          font-size: clamp(48px, 6.5vw, 84px);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.04em;
          margin: 0 0 24px;
          color: var(--text-primary);
        }

        .cc-h1-accent {
          color: var(--accent-primary, var(--accent-primary));
        }

        .cc-lead {
          font-size: clamp(18px, 1.6vw, 22px);
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0 auto 40px;
          max-width: 760px;
        }

        .cc-section-title {
          font-size: clamp(28px, 3.4vw, 40px);
          font-weight: 800;
          letter-spacing: -0.025em;
          margin: 0 0 12px;
          color: var(--text-primary);
        }

        .cc-section-sub {
          font-size: 15px;
          color: var(--text-secondary);
          max-width: 580px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* button system */
        .cc-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--accent-primary, var(--accent-primary));
          color: #ffffff !important;
          font-weight: 700;
          font-size: 14px;
          padding: 12px 22px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: background-color 0.15s ease;
          text-decoration: none;
        }
        .cc-btn-primary:hover {
          background: var(--accent-hover);
        }

        .cc-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          color: var(--text-primary);
          font-weight: 600;
          font-size: 14px;
          padding: 12px 22px;
          border-radius: 10px;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }
        .cc-btn-secondary:hover {
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.03);
        }

        /* hero grid */
        .cc-hero-grid {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 960px;
          margin: 0 auto;
        }

        .cc-hero-proof {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
          margin-top: 40px;
        }

        .cc-proof-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-secondary, #94a3b8);
        }

        /* mockup */
        .cc-mockup-frame {
          width: 100%;
          max-width: 330px;
          margin: 0 auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 28px;
          padding: 12px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
        }

        .cc-mockup-screen {
          border-radius: 20px;
          background: #070B09;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .cc-mockup-video {
          height: 380px;
          position: relative;
          background: linear-gradient(180deg, #121A16 0%, #080D0B 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 24px 16px;
        }

        .cc-mockup-caption {
          background: rgba(11, 15, 14, 0.92);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px;
          text-align: center;
          backdrop-filter: blur(8px);
        }

        .cc-caption-text {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }

        .cc-caption-highlight {
          background: var(--accent);
          color: var(--bg-app);
          padding: 2px 8px;
          border-radius: 6px;
          display: inline-block;
          margin: 0 4px;
        }

        /* demo section */
        .cc-demo-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px;
          max-width: 840px;
          margin: 36px auto 0;
          text-align: center;
        }

        .cc-tab-bar {
          display: inline-flex;
          background: var(--bg-page);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 32px;
        }

        .cc-tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          padding: 8px 18px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .cc-tab-btn.active {
          background: var(--accent);
          color: var(--bg-app);
        }

        .cc-preview-box {
          min-height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #070B09;
          border: 1px solid var(--border);
          border-radius: 12px;
        }

        /* grid cards */
        .cc-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          margin-top: 48px;
        }

        .cc-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px;
          transition: border-color 0.15s ease;
        }
        .cc-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .cc-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--surface-elevated);
          border: 1px solid var(--border);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        /* workflow numbers */
        .cc-step-num {
          font-size: 13px;
          font-weight: 800;
          color: var(--accent);
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.25);
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        /* pricing */
        .cc-pricing-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 4px 6px;
          border-radius: 999px;
          margin-top: 24px;
        }

        .cc-plan-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .cc-plan-card.recommended {
          border-color: var(--accent);
          background: var(--surface-elevated);
        }

        .cc-plan-badge {
          position: absolute;
          top: -10px;
          right: 20px;
          background: var(--accent);
          color: var(--bg-app);
          font-size: 11px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 999px;
        }

        /* signup */
        .cc-cta-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 56px 32px;
          text-align: center;
          max-width: 820px;
          margin: 0 auto;
        }

        @media (max-width: 900px) {
          .cc-hero-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 48px;
          }
          .cc-grid-3 {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>

      {/* 1. Hero */}
      <section id="home" className="cc-section" style={{ paddingTop: "64px" }}>
        <div className="cc-container">
          <div className="cc-hero-grid">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div className="cc-eyebrow">
                <span>Designed for Telugu, Tenglish & English Creators</span>
              </div>

              <h1 className="cc-h1">
                Captions that speak <br />
                <span className="cc-h1-accent">your language.</span>
              </h1>

              <p className="cc-lead">
                Create stylish, editable captions for your videos. Switch between Telugu script, Tenglish, and English, refine your subtitles, and export content ready for your next Reel or Short.
              </p>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                <button onClick={onStart} className="cc-btn-primary" style={{ padding: "14px 28px", fontSize: "16px" }}>
                  <Upload size={18} />
                  <span>Start Captioning Free</span>
                </button>
                <button onClick={() => scrollTo("demo")} className="cc-btn-secondary" style={{ padding: "14px 26px", fontSize: "16px" }}>
                  <span>Explore the Demo</span>
                </button>
              </div>

              <div className="cc-hero-proof">
                <div className="cc-proof-item" style={{ fontSize: "14px" }}>
                  <ShieldCheck size={18} color="var(--accent)" />
                  <span>100% Private in Browser</span>
                </div>
                <div className="cc-proof-item" style={{ fontSize: "14px" }}>
                  <Languages size={18} color="var(--accent)" />
                  <span>Native Lipi & Phonetic</span>
                </div>
                <div className="cc-proof-item" style={{ fontSize: "14px" }}>
                  <Zap size={18} color="var(--accent)" />
                  <span>Word-by-Word Kinetic Sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Demo Section */}
      <section id="demo" className="cc-section">
        <div className="cc-container">
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div className="cc-eyebrow">
              <span>interactive product tour</span>
            </div>
            <h2 className="cc-section-title">see CaptionCraft in action</h2>
            <p className="cc-section-sub">preview how word-level sync and typography adapt effortlessly across english, telugu, and tenglish.</p>

            {/* Language Switcher Buttons */}
            <div className="cc-tab-bar" style={{ marginTop: "24px" }}>
              {(["english", "telugu", "tenglish"] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`cc-tab-btn ${activeTab === tab ? "active" : ""}`}
                  style={{ textTransform: "capitalize" }}
                >
                  {tab === "english" && "english"}
                  {tab === "telugu" && "తెలుగు (telugu)"}
                  {tab === "tenglish" && "tenglish"}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Computer Monitor Frame */}
          <div style={{
            maxWidth: "960px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            {/* Monitor Outer Bezel */}
            <div style={{
              width: "100%",
              background: "#161d19",
              border: "2px solid #2d3b34",
              borderRadius: "18px 18px 6px 6px",
              padding: "12px 12px 18px 12px",
              boxShadow: "0 28px 70px rgba(0, 0, 0, 0.7)",
              position: "relative"
            }}>
              {/* Webcam Dot */}
              <div style={{
                position: "absolute",
                top: "6px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "#252b39"
              }} />

              {/* Inner Screen Display */}
              <div style={{
                width: "100%",
                aspectRatio: "16 / 9",
                background: "var(--bg-app)",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid #252b39",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}>
                <video
                  key={activeTab}
                  src={`/media/demo-${activeTab}.mp4`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block"
                  }}
                >
                  your browser does not support the video tag.
                </video>

                {/* Script Indicator Pill */}
                <div style={{
                  position: "absolute",
                  bottom: "16px",
                  right: "16px",
                  background: "rgba(5, 8, 7, 0.85)",
                  border: "1px solid #252b39",
                  borderRadius: "999px",
                  padding: "5px 14px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backdropFilter: "blur(8px)"
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-primary)" }} />
                  <span>playing: {activeTab} workspace</span>
                </div>
              </div>

              {/* Monitor Bottom Chin Logo */}
              <div style={{
                textAlign: "center",
                fontSize: "10px",
                color: "#737F79",
                fontWeight: 800,
                letterSpacing: "0.15em",
                marginTop: "8px",
                textTransform: "uppercase"
              }}>
                CaptionCraft Display
              </div>
            </div>

            {/* Monitor Stand Neck */}
            <div style={{
              width: "120px",
              height: "44px",
              background: "linear-gradient(180deg, #161d19 0%, #0d1210 100%)",
              borderLeft: "1px solid #252b39",
              borderRight: "1px solid #252b39"
            }} />

            {/* Monitor Stand Base */}
            <div style={{
              width: "280px",
              height: "12px",
              background: "#161d19",
              border: "1px solid #252b39",
              borderRadius: "6px 6px 0 0",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
            }} />
          </div>
        </div>
      </section>

      {/* 3. Templates Section */}
      <section id="templates" className="cc-section">
        <div className="cc-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "40px" }}>
            <div>
              <div className="cc-eyebrow" style={{ marginBottom: "12px" }}>
                <span>kinetic typography library</span>
              </div>
              <h2 className="cc-section-title" style={{ margin: 0 }}>
                caption styles engineered for high retention
              </h2>
              <p className="cc-section-sub" style={{ margin: "8px 0 0", maxWidth: "620px" }}>
                stop using plain subtitles that viewers ignore. CaptionCraft presets are tuned with hook physics, dynamic word emphasis, and safe regional typography.
              </p>
            </div>
            <button onClick={() => routerNavigate("/templates")} className="cc-btn-primary" style={{ padding: "12px 24px" }}>
              <span>explore all 42 presets</span>
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="cc-grid-3">
            <div className="cc-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
                  retention physics
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 10px 0" }}>
                  kinetic word hooks
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  every spoken punchline scales, bounces, or lights up in sync with speech tempo. Keep viewers locked to the screen during critical opening hooks on reels and shorts.
                </p>
              </div>
              <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.04)", padding: "3px 8px", borderRadius: "6px", color: "var(--text-muted)" }}>hormozi punch</span>
                <span style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.04)", padding: "3px 8px", borderRadius: "6px", color: "var(--text-muted)" }}>neon glow</span>
                <span style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.04)", padding: "3px 8px", borderRadius: "6px", color: "var(--text-muted)" }}>split stagger</span>
              </div>
            </div>

            <div className="cc-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
                  zero font breakage
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 10px 0" }}>
                  safe regional ligatures
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  western subtitle apps frequently cut off complex telugu ottulu, matras, and compound glyphs. Our cascade keeps regional fonts intact with crisp vector bounds.
                </p>
              </div>
              <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.04)", padding: "3px 8px", borderRadius: "6px", color: "var(--text-muted)" }}>telugu lipi</span>
                <span style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.04)", padding: "3px 8px", borderRadius: "6px", color: "var(--text-muted)" }}>phonetic tenglish</span>
                <span style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.04)", padding: "3px 8px", borderRadius: "6px", color: "var(--text-muted)" }}>mandali font</span>
              </div>
            </div>

            <div className="cc-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
                  instant tuning
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 10px 0" }}>
                  one click full apply
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  pick a preset once and every timeline segment inherits the animation curve, padding, and border glow instantly. Fine-tune any word without resetting the project[cite: 1].
                </p>
              </div>
              <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.04)", padding: "3px 8px", borderRadius: "6px", color: "var(--text-muted)" }}>custom palette</span>
                <span style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.04)", padding: "3px 8px", borderRadius: "6px", color: "var(--text-muted)" }}>box padding</span>
                <span style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.04)", padding: "3px 8px", borderRadius: "6px", color: "var(--text-muted)" }}>live re-render</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="cc-section">
        <div className="cc-container">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div className="cc-eyebrow">
              <span>engine advantages</span>
            </div>
            <h2 className="cc-section-title">built specifically for indian creators</h2>
            <p className="cc-section-sub">
              engineered from the ground up for regional phonetics, ligature accuracy, and fast in-browser generation.
            </p>
          </div>

          <div className="cc-grid-3">
            <div className="cc-card">
              <div className="cc-icon-box"><Languages size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0", color: "var(--text-primary)" }}>
                telugu & tenglish native engine
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                live today with full support for telugu lipi and phonetic conversational tenglish. Transcribe raw slang, regional idioms, and conversational audio without retyping.
              </p>
            </div>

            <div className="cc-card">
              <div className="cc-icon-box"><Type size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0", color: "var(--text-primary)" }}>
                indian languages coming soon
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                our speech models are expanding across india. Hindi, tamil, kannada, and malayalam transcription workflows are currently training for upcoming updates.
              </p>
            </div>

            <div className="cc-card">
              <div className="cc-icon-box"><ShieldCheck size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0", color: "var(--text-primary)" }}>
                private in-browser whisper
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                speech recognition executes directly inside your browser using WebGPU acceleration. Your raw video never uploads to an external server.
              </p>
            </div>

            <div className="cc-card">
              <div className="cc-icon-box"><Sliders size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0", color: "var(--text-primary)" }}>
                precise word timing
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                nudge word boundaries down to milliseconds to match fast speech rhythms, cinematic pauses, and vertical video pacing.
              </p>
            </div>

            <div className="cc-card">
              <div className="cc-icon-box"><Eye size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0", color: "var(--text-primary)" }}>
                safe zone overlays
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                preview mobile ui boundaries for instagram reels and youtube shorts so captions never get obscured by usernames, audio tags, or action buttons.
              </p>
            </div>

            <div className="cc-card">
              <div className="cc-icon-box"><Film size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0", color: "var(--text-primary)" }}>
                high definition canvas export
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                render burnt-in 1080p and 4k vertical video directly from browser canvas, or export clean standard srt subtitle tracks in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how-it-works" className="cc-section">
        <div className="cc-container">
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div className="cc-eyebrow">
              <span>automated pipeline</span>
            </div>
            <h2 className="cc-section-title">from raw media to viral post</h2>
            <p className="cc-section-sub">
              how CaptionCraft extracts audio, generates regional transcripts, and burns kinetic styles.
            </p>
          </div>

          {/* Minimalist Horizontal Process Timeline with Audio Input & Video Output */}
          <div style={{ position: "relative", padding: "0 10px" }}>
            
            {/* Input & Output Node Markers on the Line */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              padding: "0 4px"
            }}>
              {/* Left: Audio Input Marker */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "var(--accent-glow, rgba(59, 130, 246, 0.12))",
                  border: "1px solid var(--accent-primary)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 16px var(--accent-glow, var(--accent-glow)"
                }}>
                  <Volume2 size={18} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>input</span>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>raw audio/video</span>
                </div>
              </div>

              {/* Right: Video Output Marker */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>output</span>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>captioned reel</span>
                </div>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "var(--accent-glow, rgba(59, 130, 246, 0.12))",
                  border: "1px solid var(--accent-primary)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 16px var(--accent-glow, var(--accent-glow)"
                }}>
                  <Video size={18} />
                </div>
              </div>
            </div>

            {/* Continuous Accent Connection Line */}
            <div style={{ position: "relative", marginTop: "24px" }}>
              <div style={{
                position: "absolute",
                top: "22px",
                left: "24px",
                right: "24px",
                height: "2px",
                background: "linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-primary) 80%, rgba(38, 49, 44, 0.6) 100%)",
                zIndex: 0
              }} />

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "36px",
                position: "relative",
                zIndex: 1
              }}>
                {/* Step 1 */}
                <div>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "var(--bg-app)",
                    border: "2px solid var(--accent-primary)",
                    color: "var(--accent-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "15px",
                    marginBottom: "20px"
                  }}>
                    01
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                    client-side decode
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px 0" }}>
                    upload media
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    drop any video or audio file. Web audio extracts the sound stream instantly without server upload.
                  </p>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    mp4 · mov · mp3 · wav
                  </div>
                </div>

                {/* Step 2 */}
                <div>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "var(--bg-app)",
                    border: "2px solid var(--accent-primary)",
                    color: "var(--accent-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "15px",
                    marginBottom: "20px"
                  }}>
                    02
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                    whisper speech ai
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px 0" }}>
                    choose language
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    pick spoken audio language. Generates word-level timestamps in native script, phonetic tenglish, or english.
                  </p>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    తెలుగు · tenglish · english
                  </div>
                </div>

                {/* Step 3 */}
                <div>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "var(--bg-app)",
                    border: "2px solid var(--accent-primary)",
                    color: "var(--accent-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "15px",
                    marginBottom: "20px"
                  }}>
                    03
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                    kinetic styling
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px 0" }}>
                    apply preset
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    select any of the 42+ animations. Pop highlight, custom font scaling, and colors lock into vertical reels format.
                  </p>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    42+ viral animations
                  </div>
                </div>

                {/* Step 4 */}
                <div>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "var(--bg-app)",
                    border: "2px solid var(--accent-primary)",
                    color: "var(--accent-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "15px",
                    marginBottom: "20px"
                  }}>
                    04
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                    final output
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px 0" }}>
                    export media
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    render high-definition burned-in vertical video directly in your browser or download synced subtitle files.
                  </p>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    1080p mp4 or srt
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* 6. Comparison Table Section */}
      <section className="cc-section" style={{ borderTop: "1px solid var(--border)", background: "#080c0b" }}>
        <div className="cc-container">
          <div style={{ marginBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ width: "16px", height: "2px", background: "var(--accent-primary)" }} />
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-primary)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                the difference
              </span>
            </div>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text-primary)", margin: "0 0 16px 0", maxWidth: "780px", lineHeight: 1.1 }}>
              why not just use any caption app?
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "680px", margin: 0 }}>
              western subtitle apps are built for clean american accents. Indian creators end up wasting more time fixing broken spellings and missing ottulu than creating videos.
            </p>
          </div>

          {/* Comparison Table Container */}
          <div style={{
            background: "#0d1311",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            overflowX: "auto"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "640px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "20px 24px", width: "30%" }} />
                  <th style={{ padding: "20px 24px", color: "var(--accent-primary)", fontSize: "14px", fontWeight: 800, width: "38%" }}>
                    CaptionCraft
                  </th>
                  <th style={{ padding: "20px 24px", color: "var(--text-muted)", fontSize: "13px", fontWeight: 600, width: "32%" }}>
                    typical english-first tools
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "20px 24px", fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>
                    tenglish & code-mixed speech
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--text-primary)", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <Check size={16} color="var(--accent-primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>calibrated for south indian phonetics, slang, and english blends</span>
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--text-muted)", fontSize: "13px" }}>
                    english-first models guess wildly and break words
                  </td>
                </tr>

                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "20px 24px", fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>
                    indian languages roadmap
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--text-primary)", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <Check size={16} color="var(--accent-primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>live in telugu and expanding to hindi, tamil, kannada, malayalam</span>
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--text-muted)", fontSize: "13px" }}>
                    usually hindi at best, often english only
                  </td>
                </tr>

                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "20px 24px", fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>
                    script flexibility
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--text-primary)", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <Check size={16} color="var(--accent-primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>toggle effortlessly between native lipi, phonetic tenglish, and english</span>
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--text-muted)", fontSize: "13px" }}>
                    one rigid output with zero transliteration
                  </td>
                </tr>

                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "20px 24px", fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>
                    regional typography bounds
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--text-primary)", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <Check size={16} color="var(--accent-primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>preserves compound matras, ottulu, and vertical ligatures cleanly</span>
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--text-muted)", fontSize: "13px" }}>
                    characters get clipped or render with broken font boxes
                  </td>
                </tr>

                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "20px 24px", fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>
                    data privacy
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--text-primary)", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <Check size={16} color="var(--accent-primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>transcription happens right on your device using WebGPU whisper</span>
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--text-muted)", fontSize: "13px" }}>
                    forces full video upload to foreign third party cloud servers
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: "20px 24px", fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>
                    pricing built for india
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--text-primary)", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <Check size={16} color="var(--accent-primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>public beta is 100% free with upcoming creator plans in ₹ via UPI</span>
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--text-muted)", fontSize: "13px" }}>
                    expensive dollar subscriptions with automatic renewals
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. Comprehensive SaaS Footer */}
      
    </div>
  );
};
