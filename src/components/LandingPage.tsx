import React, { useState, useEffect } from "react";
import WorkflowMotionGraphic from "./WorkflowMotionGraphic";
import { useNavigate } from "react-router-dom";
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

const LANGUAGE_WORDS = [
  "language.",
  "భాష.",     // Telugu
  "भाषा.",     // Hindi
  "மொழி.",    // Tamil
  "ಭಾಷೆ.",    // Kannada
  "ഭാഷ.",     // Malayalam
  "भाषा.",     // Marathi
  "ভাষা.",     // Bengali
  "ભાષા.",     // Gujarati
  "ਬੋਲੀ.",     // Punjabi
];

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const routerNavigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"tenglish" | "telugu" | "english">("tenglish");
  const [langIndex, setLangIndex] = useState<number>(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  // Rotating language word effect
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      setFadeState("out");
      timeoutId = setTimeout(() => {
        setLangIndex((prev) => (prev + 1) % LANGUAGE_WORDS.length);
        setFadeState("in");
      }, 300);
    }, 2400);

    return () => {
      clearInterval(timer);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Adds when scrolled into view, removes when scrolled out (bidirectional reverse)
          if (entry.isIntersecting) {
            entry.target.classList.add("cc-in-view");
          } else {
            entry.target.classList.remove("cc-in-view");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const elements = document.querySelectorAll(".cc-scroll-reveal, .cc-player-stage");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);


  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="cc-page">
      <style>{`
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        .cc-eyebrow-redesign {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 11.5px;
          font-weight: 800;
          color: var(--accent-primary);
          background: rgba(232, 99, 67, 0.08);
          border: 1px solid rgba(232, 99, 67, 0.28);
          padding: 6px 16px;
          border-radius: 999px;
          margin-bottom: 22px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          backdrop-filter: blur(8px);
        }

        .cc-proof-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 10px;
          background: var(--nav-bg);
          border: 1px solid var(--box-border);
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-secondary);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: all 0.2s ease;
        }
        .cc-proof-pill:hover {
          border-color: var(--accent-primary);
          transform: translateY(-1px);
        }

        .cc-hero {
          position: relative;
          height: calc(100vh - 68px);
          min-height: 600px;
          margin-top: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          overflow: hidden;
          padding: 0;
        }

        .cc-hero-container {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 48px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
        }

        .cc-page {
          background-color: var(--bg-app) !important;
          color: var(--text-primary) !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
          line-height: 1.5;
          min-height: 100vh;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .cc-container {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 40px;
          box-sizing: border-box;
        }

        .cc-section {
          position: relative;
          padding: 100px 0;
          box-sizing: border-box;
        }

        .cc-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-primary);
          background: var(--accent-surface);
          border: 1px solid var(--accent-primary);
          padding: 5px 14px;
          border-radius: 999px;
          margin-bottom: 20px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .cc-h1-accent {
          color: var(--accent-primary) !important;
        }

        .cc-section-title {
          font-size: clamp(28px, 3.4vw, 40px);
          font-weight: 800;
          letter-spacing: -0.025em;
          margin: 0 0 12px;
          color: var(--text-primary) !important;
        }

        .cc-section-sub {
          font-size: 15px;
          color: var(--text-secondary) !important;
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .cc-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--accent-primary) !important;
          color: #ffffff !important;
          font-weight: 700;
          font-size: 15px;
          padding: 13px 26px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: background-color 0.15s ease, transform 0.15s ease, box-shadow 0.2s ease;
          text-decoration: none;
        }
        .cc-btn-primary:hover {
          background: var(--accent-primary-hover) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(232, 99, 67, 0.45);
        }

        .cc-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--nav-bg) !important;
          color: var(--card-text-primary) !important;
          font-weight: 600;
          font-size: 15px;
          padding: 13px 26px;
          border-radius: 10px;
          border: 1px solid var(--box-border) !important;
          box-shadow: var(--card-shadow);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cc-btn-secondary:hover {
          border-color: var(--accent-primary) !important;
          transform: translateY(-2px);
        }

        .cc-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          align-items: center;
          width: 100%;
          gap: 20px;
        }

        @media (max-width: 960px) {
          .cc-hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .cc-hero-left {
            align-items: center !important;
            text-align: center !important;
            transform: none !important;
          }
        }

        .cc-tab-bar {
          display: inline-flex;
          background: var(--nav-bg);
          border: 1px solid var(--box-border);
          border-radius: 999px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 32px;
          box-shadow: var(--card-shadow);
        }

        .cc-tab-btn {
          background: transparent;
          border: none;
          color: var(--card-text-secondary);
          font-size: 13px;
          font-weight: 600;
          padding: 8px 20px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .cc-tab-btn.active {
          background: var(--accent-primary);
          color: #ffffff !important;
        }

        .cc-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          margin-top: 48px;
        }

        /* Card interactive motion */
        .cc-card {
          background: var(--nav-bg) !important;
          border: 1px solid var(--box-border);
          border-radius: 16px;
          padding: 28px;
          box-shadow: var(--card-shadow);
          color: var(--card-text-primary) !important;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease;
        }
        .cc-card h3 {
          color: var(--card-text-primary) !important;
        }
        .cc-card p {
          color: var(--card-text-secondary) !important;
        }
        .cc-card:hover {
          border-color: var(--accent-primary) !important;
          transform: translateY(-6px) scale(1.015);
          box-shadow: 0 16px 36px rgba(232, 99, 67, 0.16), var(--card-shadow-hover);
        }

        .cc-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: var(--bg-surface-elevated);
          border: 1px solid var(--box-border);
          color: var(--accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.25s ease;
        }
        .cc-card:hover .cc-icon-box {
          transform: scale(1.14) rotate(4deg);
          background: var(--accent-surface);
          border-color: var(--accent-primary);
        }

        /* ==========================================
           BIDIRECTIONAL SCROLL MOTION GRAPHICS
           ========================================== */
        .cc-scroll-reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .cc-scroll-reveal.cc-in-view {
          opacity: 1;
          transform: translateY(0);
        }

        /* Stagger timings */
        .cc-stagger-1 { transition-delay: 0.04s; }
        .cc-stagger-2 { transition-delay: 0.12s; }
        .cc-stagger-3 { transition-delay: 0.20s; }
        .cc-stagger-4 { transition-delay: 0.28s; }
        .cc-stagger-5 { transition-delay: 0.36s; }
        .cc-stagger-6 { transition-delay: 0.44s; }

        /* Desktop Player Stage: default opacity 1 with smooth scale transitions */
        .cc-player-stage {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          opacity: 0;
          transform: translateY(36px) scale(0.96);
          transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .cc-player-stage.cc-in-view {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .cc-step-circle {
          transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cc-scroll-reveal.cc-in-view .cc-step-circle {
          transform: scale(1.08);
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

      {/* 1. Hero Redesign: Split with On-Device Pipeline Visual */}
      <section id="home" className="cc-hero" style={{ height: "calc(100vh - 68px)", minHeight: "600px", marginTop: "68px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 0 }}>
        <div className="cc-hero-container">
          <div className="cc-hero-grid">

            {/* Left Column: Aligned flush to the logo border with CAPSLOCK modern font */}
            <div
              className="cc-hero-left"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                textAlign: "left",
                width: "100%",
                alignSelf: "center",
                transform: "translateY(-85px)",
              }}>
              {/* Eyebrow Pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "var(--accent-primary)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "20px",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  border: "1px solid rgba(232, 99, 67, 0.25)",
                  background: "rgba(232, 99, 67, 0.06)",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-primary)" }} />
                <span>The #1 Regional Caption Studio for Creators</span>
              </div>

              {/* Headings */}
              <h1
                style={{
                  margin: "0 0 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  lineHeight: 1.02,
                }}
              >
                {/* 1. "CAPTIONS" - Bold Geometric Caps Lock */}
                <span
                  style={{
                    fontSize: "clamp(58px, 7.4vw, 96px)",
                    fontWeight: 900,
                    color: "var(--text-primary)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    fontFamily: "system-ui, -apple-system, 'Montserrat', 'Inter', sans-serif",
                  }}
                >
                  CAPTIONS
                </span>

                {/* 2. "that speak your audience's" */}
                <span
                  style={{
                    fontSize: "clamp(22px, 2.6vw, 36px)",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    letterSpacing: "-0.01em",
                    marginTop: "8px",
                    marginBottom: "4px",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  }}
                >
                  that speak your audience&apos;s
                </span>

                {/* 3. Dynamic Regional Language Word */}
                <span
                  className="cc-h1-accent"
                  style={{
                    display: "inline-block",
                    fontSize: "clamp(58px, 7.6vw, 100px)",
                    fontWeight: 900,
                    color: "var(--accent-primary)",
                    letterSpacing: "0.01em",
                    lineHeight: 1.05,
                    marginTop: "4px",
                    opacity: fadeState === "in" ? 1 : 0,
                    transform: fadeState === "in" ? "translateY(0)" : "translateY(6px)",
                    transition: "opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {LANGUAGE_WORDS[langIndex]}
                </span>
              </h1>

              {/* Subtitle Description */}
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "var(--text-secondary)",
                  maxWidth: "520px",
                  margin: "0 0 28px 0",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  opacity: 0.88,
                }}
              >
                Stop losing viewers to boring, unreadable subtitles.<br />
                Auto-generate word-synced animated captions in authentic Telugu, conversational Tenglish, and English in seconds.
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "30px" }}>
                <button
                  onClick={onStart}
                  className="cc-btn-primary"
                  style={{
                    padding: "14px 28px",
                    fontSize: "15px",
                    boxShadow: "0 8px 24px rgba(232, 99, 67, 0.3)",
                  }}
                >
                  <Upload size={18} />
                  <span>Start Captioning for Free</span>
                </button>
                <button onClick={() => scrollTo("demo")} className="cc-btn-secondary" style={{ padding: "14px 26px", fontSize: "15px" }}>
                  <span>See How It Works</span>
                </button>
              </div>

              {/* Feature Badges */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <div className="cc-proof-pill">
                  <ShieldCheck size={16} color="var(--accent-primary)" />
                  <span>100% Private (Runs on Device)</span>
                </div>
                <div className="cc-proof-pill">
                  <Languages size={16} color="var(--accent-primary)" />
                  <span>Telugu &amp; Tenglish</span>
                </div>
                <div className="cc-proof-pill">
                  <Zap size={16} color="var(--accent-primary)" />
                  <span>Word-by-Word Viral Sync</span>
                </div>
              </div>
            </div>

            {/* Right Column: Workflow Motion Graphic Tour */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                position: "relative",
                width: "100%",
                transform: "translateX(10px)",
              }}
            >
              <WorkflowMotionGraphic theme="auto" />
            </div>

          </div>
        </div>
      </section>

      {/* 2. Demo Section */}
      <section id="demo" className="cc-section">
        <div className="cc-container">
          <div className="cc-scroll-reveal" style={{ textAlign: "center", marginBottom: "32px" }}>
            <div className="cc-eyebrow">
              <span>Interactive Preview</span>
            </div>
            <h2 className="cc-section-title">See Create Captions in Action</h2>
            <p className="cc-section-sub">
              Experience how dynamic kinetic sync and regional typography adapt seamlessly across English, pure Telugu, and conversational Tenglish.
            </p>

            <div className="cc-tab-bar" style={{ marginTop: "24px" }}>
              {(["english", "telugu", "tenglish"] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`cc-tab-btn ${activeTab === tab ? "active" : ""}`}
                  style={{ textTransform: "capitalize" }}
                >
                  {tab === "english" && "English"}
                  {tab === "telugu" && "తెలుగు (Telugu)"}
                  {tab === "tenglish" && "Tenglish"}
                </button>
              ))}
            </div>
          </div>

          <div className="cc-player-stage">
            <div style={{
              width: "100%",
              background: "var(--nav-bg)",
              border: "2px solid var(--box-border)",
              borderRadius: "18px 18px 6px 6px",
              padding: "12px 12px 18px 12px",
              boxShadow: "var(--card-shadow)",
              position: "relative"
            }}>
              <div style={{
                position: "absolute",
                top: "6px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "var(--box-border)"
              }} />

              <div style={{
                width: "100%",
                aspectRatio: "16 / 9",
                background: "var(--bg-app)",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid var(--box-border)",
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
                  Your browser does not support the video tag.
                </video>

                <div style={{
                  position: "absolute",
                  bottom: "16px",
                  right: "16px",
                  background: "var(--nav-bg)",
                  border: "1px solid var(--box-border)",
                  borderRadius: "999px",
                  padding: "6px 16px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "var(--card-shadow)"
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-primary)" }} />
                  <span>Mode: {activeTab} workspace</span>
                </div>
              </div>

              <div style={{
                textAlign: "center",
                fontSize: "10px",
                color: "var(--card-text-muted)",
                fontWeight: 800,
                letterSpacing: "0.15em",
                marginTop: "10px",
                textTransform: "uppercase"
              }}>
                Create Captions Studio Player
              </div>
            </div>

            <div style={{
              width: "120px",
              height: "40px",
              background: "var(--nav-bg)",
              borderLeft: "1px solid var(--box-border)",
              borderRight: "1px solid var(--box-border)"
            }} />

            <div style={{
              width: "280px",
              height: "12px",
              background: "var(--nav-bg)",
              border: "1px solid var(--box-border)",
              borderRadius: "6px 6px 0 0",
              boxShadow: "var(--card-shadow)"
            }} />
          </div>
        </div>
      </section>

      {/* 3. Templates Section */}
      <section id="templates" className="cc-section">
        <div className="cc-container">
          <div className="cc-scroll-reveal" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "40px" }}>
            <div>
              <div className="cc-eyebrow" style={{ marginBottom: "12px" }}>
                <span>Viral Templates Library</span>
              </div>
              <h2 className="cc-section-title" style={{ margin: 0 }}>
                Styles Engineered to Maximize Watch Time
              </h2>
              <p className="cc-section-sub" style={{ margin: "8px 0 0", maxWidth: "620px" }}>
                Tired of flat subtitles that get skipped? Our templates are battle-tested with attention-grabbing animations, dynamic color pops, and flawless font support.
              </p>
            </div>
            <button onClick={() => routerNavigate("/templates")} className="cc-btn-primary" style={{ padding: "12px 24px" }}>
              <span>Explore All 42+ Templates</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="cc-grid-3">
            <div className="cc-card cc-scroll-reveal" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-primary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
                  Audience Retention
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 10px 0" }}>
                  Kinetic Word Highlights
                </h3>
                <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  Every spoken word lights up and scales right on beat. Lock your audience into the first 3 seconds of your Reels and Shorts so they watch till the very end.
                </p>
              </div>
              <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--box-border)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", background: "var(--bg-surface-elevated)", padding: "3px 8px", borderRadius: "6px", color: "var(--card-text-muted)", border: "1px solid var(--box-border)" }}>Hormozi Pop</span>
                <span style={{ fontSize: "11px", background: "var(--bg-surface-elevated)", padding: "3px 8px", borderRadius: "6px", color: "var(--card-text-muted)", border: "1px solid var(--box-border)" }}>Neon Glow</span>
                <span style={{ fontSize: "11px", background: "var(--bg-surface-elevated)", padding: "3px 8px", borderRadius: "6px", color: "var(--card-text-muted)", border: "1px solid var(--box-border)" }}>Karaoke Stagger</span>
              </div>
            </div>

            <div className="cc-card cc-scroll-reveal" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-primary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
                  Zero Font Glitches
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 10px 0" }}>
                  Flawless Telugu Typography
                </h3>
                <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  Western video tools constantly cut off complex Telugu ottulu, matras, and glyphs. Create Captions keeps your regional fonts razor-sharp and fully readable.
                </p>
              </div>
              <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--box-border)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", background: "var(--bg-surface-elevated)", padding: "3px 8px", borderRadius: "6px", color: "var(--card-text-muted)", border: "1px solid var(--box-border)" }}>Telugu</span>
                <span style={{ fontSize: "11px", background: "var(--bg-surface-elevated)", padding: "3px 8px", borderRadius: "6px", color: "var(--card-text-muted)", border: "1px solid var(--box-border)" }}>Phonetic Tenglish</span>
                <span style={{ fontSize: "11px", background: "var(--bg-surface-elevated)", padding: "3px 8px", borderRadius: "6px", color: "var(--card-text-muted)", border: "1px solid var(--box-border)" }}>Mandali Font</span>
              </div>
            </div>

            <div className="cc-card cc-scroll-reveal" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-primary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
                  One-Click Styling
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 10px 0" }}>
                  Instant Studio Templates
                </h3>
                <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  Pick your favorite template and apply glowing animations, background boxes, and custom palettes across your entire timeline in a single click.
                </p>
              </div>
              <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--box-border)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", background: "var(--bg-surface-elevated)", padding: "3px 8px", borderRadius: "6px", color: "var(--card-text-muted)", border: "1px solid var(--box-border)" }}>Custom Colors</span>
                <span style={{ fontSize: "11px", background: "var(--bg-surface-elevated)", padding: "3px 8px", borderRadius: "6px", color: "var(--card-text-muted)", border: "1px solid var(--box-border)" }}>Box Padding</span>
                <span style={{ fontSize: "11px", background: "var(--bg-surface-elevated)", padding: "3px 8px", borderRadius: "6px", color: "var(--card-text-muted)", border: "1px solid var(--box-border)" }}>Instant Live Render</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="cc-section">
        <div className="cc-container">
          <div className="cc-scroll-reveal" style={{ textAlign: "center", marginBottom: "48px" }}>
            <div className="cc-eyebrow">
              <span>Why Creators Choose Us</span>
            </div>
            <h2 className="cc-section-title">Built Specifically for Indian Creators</h2>
            <p className="cc-section-sub">
              Crafted from the ground up to understand regional accents, mixed slang, and high-retention vertical editing.
            </p>
          </div>

          <div className="cc-grid-3">
            <div className="cc-card cc-scroll-reveal">
              <div className="cc-icon-box"><Languages size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0" }}>
                Native Telugu & Tenglish AI
              </h3>
              <p style={{ fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                Transcribe everyday slang, regional movie references, and code-mixed speech accurately without having to manually fix every word.
              </p>
            </div>

            <div className="cc-card cc-scroll-reveal">
              <div className="cc-icon-box"><Type size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0" }}>
                More Indian Languages Coming Soon
              </h3>
              <p style={{ fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                We are rapidly expanding across India. Dedicated speech models for Hindi, Tamil, Kannada, and Malayalam are currently in active training.
              </p>
            </div>

            <div className="cc-card cc-scroll-reveal">
              <div className="cc-icon-box"><ShieldCheck size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0" }}>
                100% Private & Device-Powered
              </h3>
              <p style={{ fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                Transcription happens directly in your browser without uploading your full raw videos to external cloud servers. Your unedited media stays on your machine.
              </p>
            </div>

            <div className="cc-card cc-scroll-reveal">
              <div className="cc-icon-box"><Sliders size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0" }}>
                Precise Word-Level Timing
              </h3>
              <p style={{ fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                Easily nudge start and end times down to milliseconds. Perfect for fast-paced dialogues, cinematic pauses, and comedic punchlines.
              </p>
            </div>

            <div className="cc-card cc-scroll-reveal">
              <div className="cc-icon-box"><Eye size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0" }}>
                Social Media Safe Zones
              </h3>
              <p style={{ fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                Preview exact overlays for Instagram Reels and YouTube Shorts so your subtitles never get hidden behind like buttons, captions, or usernames.
              </p>
            </div>

            <div className="cc-card cc-scroll-reveal">
              <div className="cc-icon-box"><Film size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0" }}>
                Crisp High-Definition Export
              </h3>
              <p style={{ fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                Export ready-to-post 1080p vertical videos with burnt-in captions instantly, or download universal .SRT files to use across any editing suite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how-it-works" className="cc-section">
        <div className="cc-container">
          <div className="cc-scroll-reveal" style={{ textAlign: "center", marginBottom: "64px" }}>
            <div className="cc-eyebrow">
              <span>Simple 4-Step Workflow</span>
            </div>
            <h2 className="cc-section-title">From Raw Video to Viral Post in Minutes</h2>
            <p className="cc-section-sub">
              No complicated video editing software required. Add professional, animated regional captions in just four easy steps.
            </p>
          </div>

          <div style={{ position: "relative", padding: "0 10px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              padding: "0 4px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "var(--accent-surface)",
                  border: "1px solid var(--accent-primary)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 16px var(--accent-glow)"
                }}>
                  <Volume2 size={18} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Input</span>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Raw Video Clip</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Output</span>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Viral Reel</span>
                </div>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "var(--accent-surface)",
                  border: "1px solid var(--accent-primary)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 16px var(--accent-glow)"
                }}>
                  <Video size={18} />
                </div>
              </div>
            </div>

            <div style={{ position: "relative", marginTop: "24px" }}>
              <div style={{
                position: "absolute",
                top: "22px",
                left: "24px",
                right: "24px",
                height: "2px",
                background: "linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-primary) 80%, var(--box-border) 100%)",
                zIndex: 0
              }} />

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "36px",
                position: "relative",
                zIndex: 1
              }}>
                <div>
                  <div className="cc-step-badge" style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--bg-app)",
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
                    Instant Import
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px 0" }}>
                    Upload Media
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    Drop your video or voice recording. The studio prepares your audio track for transcription immediately.
                  </p>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    MP4 · MOV · MP3 · WAV
                  </div>
                </div>

                <div>
                  <div className="cc-step-badge" style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--bg-app)",
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
                    Intelligent Detection
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px 0" }}>
                    Select Language
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    Choose your spoken style. Generate word-synced subtitles in authentic Telugu, English, or conversational Tenglish.
                  </p>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    తెలుగు · Tenglish · English
                  </div>
                </div>

                <div>
                  <div className="cc-step-badge" style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--bg-app)",
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
                    Viral Styling
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px 0" }}>
                    Apply Your Template
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    Pick from 42+ animations. Pop highlights, font sizes, and custom colors lock into optimal 9:16 vertical formatting.
                  </p>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    42+ Kinetic Animations
                  </div>
                </div>

                <div>
                  <div className="cc-step-badge" style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--bg-app)",
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
                    Ready to Publish
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px 0" }}>
                    Export & Share
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    Download crisp, burnt-in 1080p vertical video or grab accurate subtitle files to take your content viral.
                  </p>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    1080p MP4 or SRT Subtitles
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Comparison Table Section */}
      <section className="cc-section" style={{ borderTop: "1px solid var(--box-border)" }}>
        <div className="cc-container">
          <div style={{ marginBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ width: "16px", height: "2px", background: "var(--accent-primary)" }} />
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-primary)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                The Advantage
              </span>
            </div>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text-primary)", margin: "0 0 16px 0", maxWidth: "780px", lineHeight: 1.1 }}>
              Why Not Just Use Any Generic Caption App?
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "680px", margin: 0 }}>
              Western caption apps are trained exclusively on standard American accents. Indian creators end up wasting hours correcting broken words, missing letters, and corrupted fonts.
            </p>
          </div>

          <div className="cc-scroll-reveal cc-delay-2" style={{ background: "var(--nav-bg)", border: "1px solid var(--box-border)", borderRadius: "16px", overflowX: "auto", boxShadow: "var(--card-shadow)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "640px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--box-border)" }}>
                  <th style={{ padding: "20px 24px", width: "30%" }} />
                  <th style={{ padding: "20px 24px", color: "var(--accent-primary)", fontSize: "15px", fontWeight: 800, width: "38%" }}>
                    Create Captions
                  </th>
                  <th style={{ padding: "20px 24px", color: "var(--card-text-muted)", fontSize: "13px", fontWeight: 600, width: "32%" }}>
                    Generic Western Tools
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--box-border)" }}>
                  <td style={{ padding: "20px 24px", fontWeight: 700, color: "var(--card-text-primary)", fontSize: "14px" }}>
                    Tenglish & Code-Mixed Speech
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--card-text-primary)", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <Check size={16} color="var(--accent-primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>Tuned specifically for regional accents, everyday slang, and English blending</span>
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--card-text-muted)", fontSize: "13px" }}>
                    Guesses randomly, breaks syllables, and misses the context entirely
                  </td>
                </tr>

                <tr style={{ borderBottom: "1px solid var(--box-border)" }}>
                  <td style={{ padding: "20px 24px", fontWeight: 700, color: "var(--card-text-primary)", fontSize: "14px" }}>
                    Indian Languages Roadmap
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--card-text-primary)", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <Check size={16} color="var(--accent-primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>Live in Telugu and expanding to Hindi, Tamil, Kannada, and Malayalam</span>
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--card-text-muted)", fontSize: "13px" }}>
                    Often English-only, with poor or robotic regional support
                  </td>
                </tr>

                <tr style={{ borderBottom: "1px solid var(--box-border)" }}>
                  <td style={{ padding: "20px 24px", fontWeight: 700, color: "var(--card-text-primary)", fontSize: "14px" }}>
                    Script Flexibility
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--card-text-primary)", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <Check size={16} color="var(--accent-primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>Switch between native Telugu, Tenglish, and English anytime</span>
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--card-text-muted)", fontSize: "13px" }}>
                    Locked into one rigid output with zero transliteration options
                  </td>
                </tr>

                <tr style={{ borderBottom: "1px solid var(--box-border)" }}>
                  <td style={{ padding: "20px 24px", fontWeight: 700, color: "var(--card-text-primary)", fontSize: "14px" }}>
                    Regional Typography Accuracy
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--card-text-primary)", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <Check size={16} color="var(--accent-primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>Full ligature support: never clips compound letters, matras, or ottulu</span>
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--card-text-muted)", fontSize: "13px" }}>
                    Clipped fonts, misaligned vowels, and broken symbol boxes
                  </td>
                </tr>

                <tr style={{ borderBottom: "1px solid var(--box-border)" }}>
                  <td style={{ padding: "20px 24px", fontWeight: 700, color: "var(--card-text-primary)", fontSize: "14px" }}>
                    Creator Privacy
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--card-text-primary)", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <Check size={16} color="var(--accent-primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>Processed securely in your browser—original unrendered videos stay on your device</span>
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--card-text-muted)", fontSize: "13px" }}>
                    Mandatory video uploads to foreign cloud servers with vague retention rules
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: "20px 24px", fontWeight: 700, color: "var(--card-text-primary)", fontSize: "14px" }}>
                    Affordable Indian Pricing
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--card-text-primary)", fontSize: "13.5px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <Check size={16} color="var(--accent-primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span>Free evaluation with creator plans priced in ₹ via UPI Autopay and Cards</span>
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px", color: "var(--card-text-muted)", fontSize: "13px" }}>
                    Expensive USD charges ($15–$30/mo) with currency fees and surprise renewals
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;