import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export const TermsPage: React.FC = () => {
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
            <FileText size={14} /> Legal
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
            Terms and Conditions
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
            1. Acceptance of Terms
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              margin: 0
            }}
          >
            By accessing and using Create Captions (&ldquo;the Service&rdquo;), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
          </p>
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
            2. Local Processing & Video Ownership
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: "12px"
            }}
          >
            You retain full ownership and intellectual property rights to any audio, video, or script data you import into Create Captions.
          </p>
          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              margin: 0
            }}
          >
            Because Create Captions leverages client-side WebAssembly and WebGPU for speech transcription and canvas rendering, your raw media files are decoded directly inside your web browser. Create Captions does not claim ownership or license rights over user videos.
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
            3. Permitted Use
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: "12px"
            }}
          >
            You agree not to use Create Captions to transcribe, burn, or generate subtitles for content that:
          </p>
          <ul
            style={{
              paddingLeft: "20px",
              color: "var(--text-secondary)",
              lineHeight: 1.8,
              margin: 0
            }}
          >
            <li>Violates copyright, trademark, or intellectual property rights of third parties.</li>
            <li>Contains unlawful, harmful, defamatory, or abusive material.</li>
            <li>Attempts to bypass or disrupt client-side worker operations or software licensing controls.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: "36px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "12px"
            }}
          >
            4. Subscriptions, Payments & Beta Status
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              margin: 0
            }}
          >
            Create Captions is currently operating in public beta. While select features are free during beta evaluation, future commercial subscriptions and export quotas will be clearly billed and processed through certified regional payment gateways (including UPI, Net Banking, and Cards).
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
