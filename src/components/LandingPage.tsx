import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
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
        .cc-page {
          background-color: var(--bg-app) !important;
          color: var(--text-primary) !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
          line-height: 1.5;
          min-height: 100vh;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .cc-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .cc-section {
          padding: 88px 0;
          position: relative;
          background-color: var(--bg-app);
          transition: background-color 0.2s ease;
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

        .cc-h1 {
          font-size: clamp(44px, 6.2vw, 80px);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -0.04em;
          margin: 0 0 24px;
          color: var(--text-primary) !important;
        }

        .cc-h1-accent {
          color: var(--accent-primary) !important;
        }

        .cc-lead {
          font-size: clamp(17px, 1.5vw, 21px);
          color: var(--text-secondary) !important;
          line-height: 1.6;
          margin: 0 auto 40px;
          max-width: 760px;
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
          transition: background-color 0.15s ease, transform 0.15s ease;
          text-decoration: none;
        }
        .cc-btn-primary:hover {
          background: var(--accent-primary-hover) !important;
          transform: translateY(-1px);
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
          transition: all 0.15s ease;
        }
        .cc-btn-secondary:hover {
          border-color: var(--accent-primary) !important;
          transform: translateY(-1px);
        }

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
          font-weight: 500;
          color: var(--text-secondary) !important;
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

        .cc-card {
          background: var(--nav-bg) !important;
          border: 1px solid var(--box-border);
          border-radius: 16px;
          padding: 28px;
          box-shadow: var(--card-shadow);
          color: var(--card-text-primary) !important;
          transition: all 0.2s ease;
        }
        .cc-card h3 {
          color: var(--card-text-primary) !important;
        }
        .cc-card p {
          color: var(--card-text-secondary) !important;
        }
        .cc-card:hover {
          border-color: var(--accent-primary);
          transform: translateY(-3px);
          box-shadow: var(--card-shadow-hover);
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
                <span>The #1 Regional Caption Studio for Creators</span>
              </div>

              <h1 className="cc-h1">
                Captions that speak <br />
                <span className="cc-h1-accent">your audience&apos;s language.</span>
              </h1>

              <p className="cc-lead">
                Stop losing viewers to boring, unreadable subtitles. Generate viral animated captions in authentic Telugu Lipi, conversational Tenglish, and English in seconds. Edit effortlessly and export scroll-stopping Reels and Shorts.
              </p>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                <button onClick={onStart} className="cc-btn-primary" style={{ padding: "14px 30px", fontSize: "16px" }}>
                  <Upload size={18} />
                  <span>Start Captioning for Free</span>
                </button>
                <button onClick={() => scrollTo("demo")} className="cc-btn-secondary" style={{ padding: "14px 28px", fontSize: "16px" }}>
                  <span>See How It Works</span>
                </button>
              </div>

              <div className="cc-hero-proof">
                <div className="cc-proof-item">
                  <ShieldCheck size={18} color="var(--accent-primary)" />
                  <span>100% Private (Runs on Your Device)</span>
                </div>
                <div className="cc-proof-item">
                  <Languages size={18} color="var(--accent-primary)" />
                  <span>Perfect Telugu Lipi & Tenglish</span>
                </div>
                <div className="cc-proof-item">
                  <Zap size={18} color="var(--accent-primary)" />
                  <span>Word-by-Word Viral Sync</span>
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

          <div style={{
            maxWidth: "960px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "40px" }}>
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
            <div className="cc-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
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

            <div className="cc-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
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
                <span style={{ fontSize: "11px", background: "var(--bg-surface-elevated)", padding: "3px 8px", borderRadius: "6px", color: "var(--card-text-muted)", border: "1px solid var(--box-border)" }}>Telugu Lipi</span>
                <span style={{ fontSize: "11px", background: "var(--bg-surface-elevated)", padding: "3px 8px", borderRadius: "6px", color: "var(--card-text-muted)", border: "1px solid var(--box-border)" }}>Phonetic Tenglish</span>
                <span style={{ fontSize: "11px", background: "var(--bg-surface-elevated)", padding: "3px 8px", borderRadius: "6px", color: "var(--card-text-muted)", border: "1px solid var(--box-border)" }}>Mandali Font</span>
              </div>
            </div>

            <div className="cc-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
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
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div className="cc-eyebrow">
              <span>Why Creators Choose Us</span>
            </div>
            <h2 className="cc-section-title">Built Specifically for Indian Creators</h2>
            <p className="cc-section-sub">
              Crafted from the ground up to understand regional accents, mixed slang, and high-retention vertical editing.
            </p>
          </div>

          <div className="cc-grid-3">
            <div className="cc-card">
              <div className="cc-icon-box"><Languages size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0" }}>
                Native Telugu & Tenglish AI
              </h3>
              <p style={{ fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                Transcribe everyday slang, regional movie references, and code-mixed speech accurately without having to manually fix every word.
              </p>
            </div>

            <div className="cc-card">
              <div className="cc-icon-box"><Type size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0" }}>
                More Indian Languages Coming Soon
              </h3>
              <p style={{ fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                We are rapidly expanding across India. Dedicated speech models for Hindi, Tamil, Kannada, and Malayalam are currently in active training.
              </p>
            </div>

            <div className="cc-card">
              <div className="cc-icon-box"><ShieldCheck size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0" }}>
                100% Private & Device-Powered
              </h3>
              <p style={{ fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                Transcription happens directly in your browser without uploading your full raw videos to external cloud servers. Your unedited media stays on your machine.
              </p>
            </div>

            <div className="cc-card">
              <div className="cc-icon-box"><Sliders size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0" }}>
                Precise Word-Level Timing
              </h3>
              <p style={{ fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                Easily nudge start and end times down to milliseconds. Perfect for fast-paced dialogues, cinematic pauses, and comedic punchlines.
              </p>
            </div>

            <div className="cc-card">
              <div className="cc-icon-box"><Eye size={20} /></div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px 0" }}>
                Social Media Safe Zones
              </h3>
              <p style={{ fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                Preview exact overlays for Instagram Reels and YouTube Shorts so your subtitles never get hidden behind like buttons, captions, or usernames.
              </p>
            </div>

            <div className="cc-card">
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
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
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
                    Intelligent Detection
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px 0" }}>
                    Select Language
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    Choose your spoken style. Generate word-synced subtitles in authentic Telugu Lipi, English, or conversational Tenglish.
                  </p>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    తెలుగు · Tenglish · English
                  </div>
                </div>

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

          <div style={{
            background: "var(--nav-bg)",
            border: "1px solid var(--box-border)",
            borderRadius: "16px",
            overflowX: "auto",
            boxShadow: "var(--card-shadow)"
          }}>
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
                      <span>Tuned specifically for South Indian phonetics, everyday slang, and English blending</span>
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
                      <span>Switch between native Telugu Lipi, phonetic Tenglish, and English anytime</span>
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