import React, { useState } from "react";
import { Sparkles, Check, ThumbsUp, ThumbsDown, Send, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface RoadmapItem {
  id: string;
  category: string;
  dateOrStage: string;
  title: string;
  description: string;
  type: "shipped" | "coming_soon";
  defaultLikes?: number;
}

const shippedItems: RoadmapItem[] = [
  {
    id: "s1",
    category: "Publishing",
    dateOrStage: "Oct 2026",
    title: "Telugu script or Tenglish toggle",
    description: "Choose native Telugu Lipi or phonetic English-Telugu before generating, with word-level sync tuned for Reels and Shorts.",
    type: "shipped"
  },
  {
    id: "s2",
    category: "Editor",
    dateOrStage: "Sep 2026",
    title: "Kinetic word-by-word highlights",
    description: "Real-time karaoke style animation that highlights each spoken syllable with custom glow and border outlines.",
    type: "shipped"
  },
  {
    id: "s3",
    category: "Privacy & Engine",
    dateOrStage: "Sep 2026",
    title: "100% On-device browser transcription",
    description: "Whisper AI runs locally inside your browser using client-side Web Workers. Your private footage never leaves your machine.",
    type: "shipped"
  },
  {
    id: "s4",
    category: "Editor",
    dateOrStage: "Aug 2026",
    title: "Regional font library & custom typography",
    description: "Curated display fonts specifically tuned for Telugu headlines, safe zone overlays, and 9:16 mobile viewports.",
    type: "shipped"
  },
  {
    id: "s5",
    category: "Export",
    dateOrStage: "Aug 2026",
    title: "SRT & VTT subtitle downloads",
    description: "Export clean timecoded subtitle files alongside your burned-in video for direct YouTube Shorts and Instagram uploads.",
    type: "shipped"
  }
];

const upcomingItems: RoadmapItem[] = [
  {
    id: "u1",
    category: "Engine",
    dateOrStage: "Next up",
    title: "WebGPU Whisper hardware acceleration",
    description: "Utilize your computer or phone GPU shaders to transcribe 1-minute reels in under 10 seconds locally.",
    type: "coming_soon"
  },
  {
    id: "u2",
    category: "Editor",
    dateOrStage: "Next up",
    title: "Smarter Telugu phonetic auto-correct",
    description: "Learns frequent Telugu creator terminology and slang to automatically fix first-pass spellings.",
    type: "coming_soon"
  },
  {
    id: "u3",
    category: "Publishing",
    dateOrStage: "Planned",
    title: "Direct export to Instagram Reels & YouTube",
    description: "One-click publish straight to your connected social channels with auto-generated hashtags and hook titles.",
    type: "coming_soon"
  },
  {
    id: "u4",
    category: "AI Tools",
    dateOrStage: "Planned",
    title: "Automatic B-Roll & kinetic emoji hooks",
    description: "Detects emotional emphasis and keywords in your speech to automatically pop relevant 3D emojis and visual zoom cuts.",
    type: "coming_soon"
  }
];

export const RoadmapPage: React.FC = () => {
  const [feedback, setFeedback] = useState<Record<string, "liked" | "disliked">>({});
  const [ideaText, setIdeaText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleVote = (id: string, type: "liked" | "disliked") => {
    setFeedback((prev) => ({ ...prev, [id]: type }));
  };

  const handleIdeaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim()) return;
    setSubmitted(true);
    setIdeaText("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-app)",
      color: "var(--text-primary)",
      padding: "60px 20px 120px",
      fontFamily: "Inter, -apple-system, sans-serif"
    }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        
        {/* Top Eyebrow */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--accent-primary)",
            background: "var(--accent-surface)",
            border: "1px solid var(--accent-primary)",
            padding: "5px 14px",
            borderRadius: "999px",
            marginBottom: "16px",
            letterSpacing: "0.02em"
          }}>
            <Sparkles size={14} />
            Built in public
          </div>

          <h1 style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            margin: "0 0 16px 0",
            lineHeight: 1.15,
            color: "var(--text-primary)"
          }}>
            What we ship and what is next
          </h1>

          <p style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            maxWidth: "580px",
            margin: "0 auto 16px"
          }}>
            Create Captions is built from creator pain points. Tell us what you like, what you want, and what we should build next.
          </p>

          <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
            Last updated Oct 2026
          </span>
        </div>

        {/* Section: Shipped */}
        <div style={{ marginBottom: "56px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
            paddingBottom: "12px",
            borderBottom: "1px solid var(--border-subtle)"
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
              Shipped
            </h2>
            <span style={{
              fontSize: "12px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: "var(--accent-surface)",
              color: "var(--accent-primary)",
              fontWeight: 700
            }}>
              {shippedItems.length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {shippedItems.map((item) => {
              const currentVote = feedback[item.id];
              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "var(--nav-bg)",
                    border: "1px solid var(--box-border)",
                    boxShadow: "var(--card-shadow)",
                    borderRadius: "14px",
                    padding: "20px 24px",
                    transition: "border-color 0.2s ease, transform 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{
                      fontSize: "12px",
                      color: "var(--accent-primary)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em"
                    }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--card-text-muted)" }}>•</span>
                    <span style={{ fontSize: "12px", color: "var(--card-text-secondary)" }}>{item.dateOrStage}</span>
                  </div>

                  <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px 0", color: "var(--card-text-primary)" }}>
                    {item.title}
                  </h3>

                  <p style={{
                    fontSize: "14px",
                    color: "var(--card-text-secondary)",
                    lineHeight: 1.5,
                    margin: "0 0 16px 0"
                  }}>
                    {item.description}
                  </p>

                  {/* Feedback line */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "var(--card-text-muted)" }}>Do you like this?</span>
                    <button
                      type="button"
                      onClick={() => handleVote(item.id, "liked")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        border: currentVote === "liked" ? "1px solid var(--accent-primary)" : "1px solid var(--box-border)",
                        backgroundColor: currentVote === "liked" ? "var(--accent-surface)" : "transparent",
                        color: currentVote === "liked" ? "var(--accent-primary)" : "var(--card-text-primary)",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 0.15s ease"
                      }}
                    >
                      <ThumbsUp size={13} /> {currentVote === "liked" ? "Liked" : "Like it"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVote(item.id, "disliked")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        border: currentVote === "disliked" ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid var(--box-border)",
                        backgroundColor: currentVote === "disliked" ? "rgba(239, 68, 68, 0.1)" : "transparent",
                        color: currentVote === "disliked" ? "#ef4444" : "var(--card-text-muted)",
                        cursor: "pointer",
                        fontWeight: 500,
                        transition: "all 0.15s ease"
                      }}
                    >
                      <ThumbsDown size={13} /> Not for me
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Coming Soon */}
        <div style={{ marginBottom: "64px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
            paddingBottom: "12px",
            borderBottom: "1px solid var(--border-subtle)"
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
              Coming soon
            </h2>
            <span style={{
              fontSize: "12px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: "var(--accent-surface)",
              color: "var(--accent-primary)",
              fontWeight: 700
            }}>
              {upcomingItems.length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {upcomingItems.map((item) => {
              const currentVote = feedback[item.id];
              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "var(--nav-bg)",
                    border: "1px solid var(--box-border)",
                    boxShadow: "var(--card-shadow)",
                    borderRadius: "14px",
                    padding: "20px 24px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{
                      fontSize: "12px",
                      color: "var(--accent-primary)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em"
                    }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--card-text-muted)" }}>•</span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      backgroundColor: "var(--accent-surface)",
                      color: "var(--accent-primary)"
                    }}>
                      {item.dateOrStage}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px 0", color: "var(--card-text-primary)" }}>
                    {item.title}
                  </h3>

                  <p style={{
                    fontSize: "14px",
                    color: "var(--card-text-secondary)",
                    lineHeight: 1.5,
                    margin: "0 0 16px 0"
                  }}>
                    {item.description}
                  </p>

                  {/* Feedback line */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "var(--card-text-muted)" }}>Want this?</span>
                    <button
                      type="button"
                      onClick={() => handleVote(item.id, "liked")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        padding: "5px 14px",
                        borderRadius: "8px",
                        border: currentVote === "liked" ? "1px solid var(--accent-primary)" : "1px solid var(--box-border)",
                        backgroundColor: currentVote === "liked" ? "var(--accent-surface)" : "transparent",
                        color: currentVote === "liked" ? "var(--accent-primary)" : "var(--card-text-primary)",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 0.15s ease"
                      }}
                    >
                      <ThumbsUp size={13} /> {currentVote === "liked" ? "Noted!" : "Want it"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVote(item.id, "disliked")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--box-border)",
                        backgroundColor: "transparent",
                        color: "var(--card-text-muted)",
                        cursor: "pointer",
                        fontWeight: 500,
                        transition: "all 0.15s ease"
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Feedback Form */}
        <div style={{
          backgroundColor: "var(--nav-bg)",
          border: "1px solid var(--box-border)",
          borderRadius: "16px",
          padding: "36px 32px",
          boxShadow: "var(--card-shadow)"
        }}>
          <div style={{
            fontSize: "12px",
            color: "var(--accent-primary)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "8px"
          }}>
            Your turn
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 10px 0", letterSpacing: "-0.02em", color: "var(--card-text-primary)" }}>
            Have an idea we missed?
          </h2>
          <p style={{ fontSize: "14px", color: "var(--card-text-secondary)", margin: "0 0 24px 0", lineHeight: 1.5 }}>
            One sentence is enough. We read every submission.
          </p>

          {submitted ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "16px",
              borderRadius: "10px",
              backgroundColor: "var(--accent-surface)",
              border: "1px solid var(--accent-primary)",
              color: "var(--card-text-primary)",
              fontSize: "14px"
            }}>
              <Check size={18} color="var(--accent-primary)" />
              <span>Thanks, we got your idea. We read every submission!</span>
            </div>
          ) : (
            <form onSubmit={handleIdeaSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input
                type="text"
                placeholder="Your feature idea (e.g. Export 4K 60fps, Instagram direct post, etc.)"
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--box-border)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  color: "var(--card-text-primary)",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--card-text-muted)" }}>
                  Ideas may be reviewed by our team. Do not submit personal data.
                </span>
                <button
                  type="submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "var(--accent-primary)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "0 2px 10px var(--accent-surface)",
                    transition: "background-color 0.15s ease"
                  }}
                >
                  <Send size={14} /> Submit idea
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Back to Studio CTA */}
        <div style={{ textAlign: "center", marginTop: "56px" }}>
          <Link
            to="/studio"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--accent-primary)",
              textDecoration: "none"
            }}
          >
            Ready to generate captions? Open Studio <ArrowRight size={16} />
          </Link>
        </div>

      </div>
      </div>
  );
};

export default RoadmapPage;
