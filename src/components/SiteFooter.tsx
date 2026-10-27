import { useTheme } from "../lib/theme";
import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Shield, Heart } from "lucide-react";

export const SiteFooter: React.FC = () => {
  const { theme } = useTheme();
  return (
    <footer
      style={{
        backgroundColor: "var(--card-bg)",
        borderTop: "1px solid var(--box-border)",
        color: "var(--card-text-primary)",
        padding: "48px 32px 32px",
        marginTop: "auto",
        transition: "background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease"
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
            <div style={{ width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <img
        src={theme === "dark" ? "/media/Llogo.png" : "/media/Dlogo.png"}
        alt="Create Captions"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
            <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--card-text-primary)" }}>
              Create Captions
            </span>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "var(--card-text-secondary)",
              lineHeight: "1.6",
              margin: 0
            }}
          >
            AI speech-to-text video captioning studio tailored for Telugu, Tenglish transliteration, and English creators. 100% private on-device transcription.
          </p>
          <div style={{ display: "flex", gap: "14px", marginTop: "4px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--card-text-secondary)" }}>
              <Shield size={13} color="#10b981" /> In-Browser Privacy
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--card-text-secondary)" }}>
              <Sparkles size={13} color="#f59e0b" /> Ultra-Fast Device AI
            </span>
          </div>
        </div>

        {/* Product Navigation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px", color: "var(--card-text-primary)" }}>
            Product
          </h4>
          <Link to="/" style={{ color: "var(--card-text-secondary)", textDecoration: "none", fontSize: "13px" }}>Home</Link>
          <Link to="/templates" style={{ color: "var(--card-text-secondary)", textDecoration: "none", fontSize: "13px" }}>Reel Templates</Link>
          <Link to="/pricing" style={{ color: "var(--card-text-secondary)", textDecoration: "none", fontSize: "13px" }}>Pricing Plans</Link>
          <Link to="/roadmap" style={{ color: "var(--card-text-secondary)", textDecoration: "none", fontSize: "13px" }}>Roadmap</Link>
        </div>

        {/* Studio & Tools */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px", color: "var(--card-text-primary)" }}>
            Studio
          </h4>
          <Link to="/studio" style={{ color: "var(--card-text-secondary)", textDecoration: "none", fontSize: "13px" }}>Open Studio</Link>
          <Link to="/login" style={{ color: "var(--card-text-secondary)", textDecoration: "none", fontSize: "13px" }}>Creator Account</Link>
          <Link to="/support" style={{ color: "var(--card-text-secondary)", textDecoration: "none", fontSize: "13px" }}>Help & Support</Link>
        </div>

        {/* Legal & Compliance */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px", color: "var(--card-text-primary)" }}>
            Legal
          </h4>
          <Link to="/privacy" style={{ color: "var(--card-text-secondary)", textDecoration: "none", fontSize: "13px" }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: "var(--card-text-secondary)", textDecoration: "none", fontSize: "13px" }}>Terms of Service</Link>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          paddingTop: "24px",
          borderTop: "1px solid var(--box-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "12px",
          color: "var(--card-text-secondary)"
        }}
      >
        <div>
          © {new Date().getFullYear()} Create Captions Studio. Built for Indian digital creators.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--card-text-secondary)" }}>
          Built with <Heart size={13} color="var(--accent-primary)" fill="var(--accent-primary)" /> for Regional Creators.
        </div>
      </div>
    </footer>
  );
};
