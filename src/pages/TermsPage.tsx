import React from "react";
import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";

export const TermsPage: React.FC = () => {
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
            <FileText size={14} /> Legal
          </div>
          <h1 style={{ fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 800, margin: "0 0 12px 0", letterSpacing: "-0.02em" }}>
            Terms and Conditions
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.5)", margin: 0 }}>
            Last revised: October 2026
          </p>
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
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>1. Acceptance of Terms</h2>
            <p>
              By accessing and using CaptionCraft ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>2. Local Processing & Video Ownership</h2>
            <p>
              You retain full ownership and intellectual property rights to any audio, video, or script data you import into CaptionCraft.
            </p>
            <p style={{ marginTop: "8px" }}>
              Because CaptionCraft leverages client-side WebAssembly and WebGPU for speech transcription and canvas rendering, your raw media files are decoded directly inside your web browser. CaptionCraft does not claim ownership or license rights over user videos.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>3. Permitted Use</h2>
            <p>
              You agree not to use CaptionCraft to transcribe, burn, or generate subtitles for content that:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>Violates copyright, trademark, or intellectual property rights of third parties.</li>
              <li>Contains unlawful, harmful, defamatory, or abusive material.</li>
              <li>Attempts to bypass or disrupt client-side worker operations or software licensing controls.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>4. Subscriptions, Payments & Beta Status</h2>
            <p>
              CaptionCraft is currently operating in public beta. While select features are free during beta evaluation, future commercial subscriptions and export quotas will be clearly billed and processed through certified regional payment gateways (including UPI, Net Banking, and Cards).
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>5. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. While we strive for high phonetic accuracy across Telugu Lipi, Tenglish, and English, speech recognition outputs may occasionally contain errors. CaptionCraft is not liable for typographical slips or misheard phrases in exported video content.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>6. Contact Us</h2>
            <p>
              For legal inquiries or questions regarding these terms, contact us at <span style={{ color: "var(--accent-primary, #3b82f6)", fontWeight: 600 }}>support@captioncraft.in</span>.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
};

export default TermsPage;
