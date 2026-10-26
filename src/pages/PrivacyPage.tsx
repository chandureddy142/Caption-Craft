import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock } from "lucide-react";

export const PrivacyPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-app)",
        color: "var(--text-primary)",
        transition: "background-color 0.2s ease, color 0.2s ease",
        padding: "48px 24px 80px"
      }}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--accent-primary)",
            textDecoration: "none",
            marginBottom: "32px"
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--accent-primary)",
              background: "var(--accent-surface)",
              border: "1px solid var(--border-strong)",
              padding: "4px 12px",
              borderRadius: "999px",
              marginBottom: "16px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
          >
            <Shield size={14} /> Privacy First
          </div>
          <h1
            style={{
              fontSize: "clamp(32px, 4.5vw, 48px)",
              fontWeight: 800,
              margin: "0 0 12px 0",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)"
            }}
          >
            Privacy Policy
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              opacity: 0.85,
              margin: 0
            }}
          >
            Last revised: October 2026
          </p>
        </div>

        {/* Highlight Callout */}
        <div
          style={{
            background: "var(--nav-bg)",
            border: "1px solid var(--box-border)",
            borderRadius: "14px",
            padding: "20px 24px",
            marginBottom: "36px",
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
            boxShadow: "var(--card-shadow)"
          }}
        >
          <Lock
            size={22}
            color="var(--accent-primary)"
            style={{ flexShrink: 0, marginTop: "2px" }}
          />
          <div>
            <h3 style={{ color: "var(--card-text-primary)", fontWeight: 700, fontSize: "16px", marginBottom: "6px" }}>Your raw videos never leave your browser</h3>
            <div
              style={{
                fontSize: "13.5px",
                color: "var(--text-secondary)",
                lineHeight: 1.6
              }}
            >
              <span style={{ color: "var(--card-text-secondary)", fontSize: "13px", lineHeight: 1.6, display: "block" }}><span style={{ color: "var(--card-text-secondary)", fontSize: "13px", lineHeight: "1.6", display: "block" }}>Create Captions executes speech recognition locally using on-device machine learning models. Video clips and uncaptioned media files are not uploaded or permanently archived on external servers.</span></span>
            </div>
          </div>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: "36px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "12px"
            }}
          >
            1. Information We Collect
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: "12px"
            }}
          >
            We only collect information necessary to authenticate users, save editor project preferences, and deliver application updates:
          </p>
          <ul
            style={{
              paddingLeft: "20px",
              color: "var(--text-secondary)",
              lineHeight: 1.8
            }}
          >
            <li>
              <strong style={{ color: "var(--text-primary)" }}>
                Account Credentials:
              </strong>{" "}
              Email address and authentication tokens via Supabase Auth when you sign in.
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>
                Project Metadata:
              </strong>{" "}
              Subtitle cues, selected preset styles, and project titles saved in cloud storage to allow syncing across devices.
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>
                Feedback Submissions:
              </strong>{" "}
              Feature ideas and votes submitted via the public roadmap.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: "36px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "12px"
            }}
          >
            2. Local Data Processing
          </h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Our audio extraction, Whisper ONNX transcription, and canvas video burning operate in Web Workers inside your browser. Audio streams are converted to floating-point tensors in volatile device memory and discarded immediately upon completion.
          </p>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: "36px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "12px"
            }}
          >
            3. Cookies and Local Storage
          </h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
            We use browser LocalStorage and essential session cookies strictly to maintain user sessions and preserve your editor typography preferences between reloads.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
