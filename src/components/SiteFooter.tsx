import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Shield, Heart } from "lucide-react";

export const SiteFooter: React.FC = () => {
  return (
    <footer
      style={{
        background: "var(--card-bg, #201e1c)",
        borderTop: "1px solid var(--box-border, rgba(255, 255, 255, 0.1))",
        color: "var(--card-text-primary, #ffffff)",
        padding: "48px 32px 32px",
        marginTop: "auto",
        transition: "background 0.2s ease, color 0.2s ease"
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "40px",
          marginBottom: "40px"
        }}
      >
        {/* Brand Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src="/media/logo.png"
              alt="CaptionCraft"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                objectFit: "contain"
              }}
            />
            <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              CaptionCraft
            </span>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "var(--card-text-secondary, rgba(255, 255, 255, 0.72))",
              lineHeight: "1.6",
              margin: 0
            }}
          >
            Client-side speech-to-text video captioning studio tailored for Telugu Lipi, Tenglish transliteration, and English creators. 100% private in-browser transcription.
          </p>
          <div style={{ display: "flex", gap: "14px", marginTop: "4px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--card-text-secondary, rgba(255, 255, 255, 0.72))" }}>
              <Shield size={13} color="#10b981" /> In-Browser Privacy
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--card-text-secondary, rgba(255, 255, 255, 0.72))" }}>
              <Sparkles size={13} color="#f59e0b" /> WebGPU Accelerated
            </span>
          </div>
        </div>

        {/* Product Navigation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px", color: "var(--card-text-primary, #ffffff)" }}>
            Product
          </h4>
          <Link to="/" style={{ color: "var(--card-text-secondary, rgba(255, 255, 255, 0.72))", textDecoration: "none", fontSize: "13px" }}>Home</Link>
          <Link to="/templates" style={{ color: "var(--card-text-secondary, rgba(255, 255, 255, 0.72))", textDecoration: "none", fontSize: "13px" }}>Reel Templates</Link>
          <Link to="/pricing" style={{ color: "var(--card-text-secondary, rgba(255, 255, 255, 0.72))", textDecoration: "none", fontSize: "13px" }}>Pricing Plans</Link>
          <Link to="/roadmap" style={{ color: "var(--card-text-secondary, rgba(255, 255, 255, 0.72))", textDecoration: "none", fontSize: "13px" }}>Roadmap</Link>
        </div>

        {/* Studio & Tools */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px", color: "var(--card-text-primary, #ffffff)" }}>
            Studio
          </h4>
          <Link to="/studio" style={{ color: "var(--card-text-secondary, rgba(255, 255, 255, 0.72))", textDecoration: "none", fontSize: "13px" }}>Open Studio</Link>
          <Link to="/login" style={{ color: "var(--card-text-secondary, rgba(255, 255, 255, 0.72))", textDecoration: "none", fontSize: "13px" }}>Creator Account</Link>
          <Link to="/support" style={{ color: "var(--card-text-secondary, rgba(255, 255, 255, 0.72))", textDecoration: "none", fontSize: "13px" }}>Help & Support</Link>
        </div>

        {/* Legal & Compliance */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px", color: "var(--card-text-primary, #ffffff)" }}>
            Legal
          </h4>
          <Link to="/privacy" style={{ color: "var(--card-text-secondary, rgba(255, 255, 255, 0.72))", textDecoration: "none", fontSize: "13px" }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: "var(--card-text-secondary, rgba(255, 255, 255, 0.72))", textDecoration: "none", fontSize: "13px" }}>Terms of Service</Link>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          paddingTop: "24px",
          borderTop: "1px solid var(--box-border, rgba(255, 255, 255, 0.08))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "12px",
          color: "var(--card-text-secondary, rgba(255, 255, 255, 0.6))"
        }}
      >
        <div>
          © {new Date().getFullYear()} CaptionCraft Studio. Built for Indian digital creators.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          Crafted with <Heart size={13} color="var(--accent-primary, #ef5350)" fill="var(--accent-primary, #ef5350)" /> for Telugu & multilingual creators
        </div>
      </div>
    </footer>
  );
};
