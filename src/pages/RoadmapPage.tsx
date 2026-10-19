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
      backgroundColor: "var(--bg-app, #0b0d11)",
      color: "#f3f6f4",
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
            color: "var(--accent-primary, #3b82f6)",
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
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
            lineHeight: 1.15
          }}>
            What we ship and what is next
          </h1>

          <p style={{
            fontSize: "16px",
            color: "rgba(255, 255, 255, 0.65)",
            lineHeight: 1.6,
            maxWidth: "580px",
            margin: "0 auto 16px"
          }}>
            CaptionCraft is built from creator pain points. Tell us what you like, what you want, and what we should build next.
          </p>

          <span style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.4)", fontWeight: 500 }}>
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
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>Shipped</h2>
            <span style={{
              fontSize: "12px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: "rgba(59, 130, 246, 0.15)",
              color: "var(--accent-primary, #3b82f6)",
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
                    backgroundColor: "rgba(19, 23, 32, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "20px 24px",
                    transition: "border-color 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{
                      fontSize: "12px",
                      color: "var(--accent-primary, #3b82f6)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em"
                    }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.35)" }}>•</span>
                    <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.45)" }}>{item.dateOrStage}</span>
                  </div>

                  <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px 0", color: "#ffffff" }}>
                    {item.title}
                  </h3>

                  <p style={{
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.65)",
                    lineHeight: 1.5,
                    margin: "0 0 16px 0"
                  }}>
                    {item.description}
                  </p>

                  {/* Feedback line */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>Do you like this?</span>
                    <button
                      onClick={() => handleVote(item.id, "liked")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        border: currentVote === "liked" ? "1px solid var(--accent-primary, #3b82f6)" : "1px solid rgba(255, 255, 255, 0.1)",
                        backgroundColor: currentVote === "liked" ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.04)",
                        color: currentVote === "liked" ? "var(--accent-primary, #3b82f6)" : "#ffffff",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 0.15s ease"
                      }}
                    >
                      <ThumbsUp size={13} /> {currentVote === "liked" ? "Liked" : "Like it"}
                    </button>
                    <button
                      onClick={() => handleVote(item.id, "disliked")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        border: currentVote === "disliked" ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
                        backgroundColor: currentVote === "disliked" ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.04)",
                        color: currentVote === "disliked" ? "#ef4444" : "rgba(255, 255, 255, 0.7)",
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
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>Coming soon</h2>
            <span style={{
              fontSize: "12px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.1)",
              color: "rgba(255, 255, 255, 0.8)",
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
                    backgroundColor: "rgba(19, 23, 32, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "20px 24px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{
                      fontSize: "12px",
                      color: "var(--accent-primary, #3b82f6)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em"
                    }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.35)" }}>•</span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      backgroundColor: "rgba(59, 130, 246, 0.12)",
                      color: "var(--accent-primary, #3b82f6)"
                    }}>
                      {item.dateOrStage}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px 0", color: "#ffffff" }}>
                    {item.title}
                  </h3>

                  <p style={{
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.65)",
                    lineHeight: 1.5,
                    margin: "0 0 16px 0"
                  }}>
                    {item.description}
                  </p>

                  {/* Feedback line */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>Want this?</span>
                    <button
                      onClick={() => handleVote(item.id, "liked")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        padding: "5px 14px",
                        borderRadius: "8px",
                        border: currentVote === "liked" ? "1px solid var(--accent-primary, #3b82f6)" : "1px solid rgba(255, 255, 255, 0.1)",
                        backgroundColor: currentVote === "liked" ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.04)",
                        color: currentVote === "liked" ? "var(--accent-primary, #3b82f6)" : "#ffffff",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 0.15s ease"
                      }}
                    >
                      <ThumbsUp size={13} /> {currentVote === "liked" ? "Noted!" : "Want it"}
                    </button>
                    <button
                      onClick={() => handleVote(item.id, "disliked")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        border: currentVote === "disliked" ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        color: "rgba(255, 255, 255, 0.7)",
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

        {/* Section: Your Turn (Feedback Submission) */}
        <div style={{
          backgroundColor: "rgba(19, 23, 32, 0.85)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          borderRadius: "16px",
          padding: "36px 32px",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.35)"
        }}>
          <div style={{
            fontSize: "12px",
            color: "var(--accent-primary, #3b82f6)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "8px"
          }}>
            Your turn
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 10px 0", letterSpacing: "-0.02em" }}>
            Have an idea we missed?
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.65)", margin: "0 0 24px 0", lineHeight: 1.5 }}>
            One sentence is enough. We read every submission.
          </p>

          {submitted ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "16px",
              borderRadius: "10px",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "#ffffff",
              fontSize: "14px"
            }}>
              <Check size={18} color="var(--accent-primary, #3b82f6)" />
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
                  backgroundColor: "rgba(11, 13, 17, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>
                  Ideas may be reviewed by our team. Do not submit personal data.
                </span>
                <button
                  type="submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "var(--accent-primary, #3b82f6)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
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
              color: "var(--accent-primary, #3b82f6)",
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
