import React from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowLeft, Lock } from "lucide-react";

export const PrivacyPage: React.FC = () => {
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-app, #0b0d11)",
      color: "#f3f6f4",
      padding: "60px 24px 100px",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--accent-primary, #3b82f6)",
            textDecoration: "none",
            marginBottom: "32px"
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div style={{ marginBottom: "40px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--accent-primary, #3b82f6)",
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            padding: "4px 12px",
            borderRadius: "999px",
            marginBottom: "16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            <Shield size={14} /> Privacy First
          </div>
          <h1 style={{ fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 800, margin: "0 0 12px 0", letterSpacing: "-0.02em" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.5)", margin: 0 }}>
            Last revised: October 2026
          </p>
        </div>

        {/* Highlight Callout */}
        <div style={{
          backgroundColor: "rgba(59, 130, 246, 0.08)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          borderRadius: "14px",
          padding: "20px 24px",
          marginBottom: "36px",
          display: "flex",
          gap: "16px",
          alignItems: "flex-start"
        }}>
          <Lock size={24} color="var(--accent-primary, #3b82f6)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 700, color: "#fff", fontSize: "15px", marginBottom: "4px" }}>
              Your raw videos never leave your browser
            </div>
            <div style={{ fontSize: "13.5px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.5 }}>
              CaptionCraft executes speech recognition locally using on-device machine learning models. Video clips and uncaptioned media files are not uploaded or permanently archived on external servers.
            </div>
          </div>
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          lineHeight: 1.7,
          fontSize: "15px",
          color: "rgba(255, 255, 255, 0.8)"
        }}>
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>1. Information We Collect</h2>
            <p>
              We only collect information necessary to authenticate users, save editor project preferences, and deliver application updates:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li><strong>Account Credentials:</strong> Email address and authentication tokens via Supabase Auth when you sign in.</li>
              <li><strong>Project Metadata:</strong> Subtitle cues, selected preset styles, and project titles saved in cloud storage to allow syncing across devices.</li>
              <li><strong>Feedback Submissions:</strong> Feature ideas and votes submitted via the public roadmap.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>2. Local Data Processing</h2>
            <p>
              Our audio extraction, Whisper ONNX transcription, and canvas video burning operate in Web Workers inside your browser. Audio streams are converted to floating-point tensors in volatile device memory and discarded immediately upon completion.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>3. Cookies and Local Storage</h2>
            <p>
              We use browser LocalStorage and essential session cookies strictly to maintain user sessions and preserve your editor typography preferences between reloads.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>4. Third-Party Services</h2>
            <p>
              We do not sell, rent, or trade your personal information. Authentication and encrypted database storage are hosted on secure Supabase cloud infrastructure compliant with modern data protection standards.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>5. Your Data Rights</h2>
            <p>
              You have the right to request deletion of your account and associated project records at any time by contacting our support team at <span style={{ color: "var(--accent-primary, #3b82f6)", fontWeight: 600 }}>support@captioncraft.in</span>.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPage;
