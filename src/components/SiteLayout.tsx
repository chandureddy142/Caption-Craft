import type { ReactElement } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SiteLayout(): ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#050807", color: "#ecf2ee", fontFamily: "system-ui, sans-serif" }}>
      <header style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        zIndex: 100,
        backgroundColor: "rgba(11, 13, 17, 0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "0 24px",
        boxSizing: "border-box"
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}>
            <span style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "var(--accent-primary)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "15px"
            }}>cc</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.01em" }}>CaptionCraft</span>
              </div>
              <span style={{ display: "block", fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>smart captions for creators</span>
            </div>
          </Link>

          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <NavLink to="/" style={({ isActive }) => ({ textDecoration: "none", fontSize: "14px", fontWeight: 500, color: isActive ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.7)", transition: "color 0.2s" })}>
              home
            </NavLink>
            <NavLink to="/templates" style={({ isActive }) => ({ textDecoration: "none", fontSize: "14px", fontWeight: 500, color: isActive ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.7)", transition: "color 0.2s" })}>
              templates
            </NavLink>
            <NavLink to="/roadmap" style={({ isActive }) => ({ textDecoration: "none", fontSize: "14px", fontWeight: 500, color: isActive ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.7)", transition: "color 0.2s" })}>
              roadmap
            </NavLink>
            <NavLink to="/pricing" style={({ isActive }) => ({ textDecoration: "none", fontSize: "14px", fontWeight: 500, color: isActive ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.7)", transition: "color 0.2s" })}>
              pricing
            </NavLink>
            <NavLink to="/support" style={({ isActive }) => ({ textDecoration: "none", fontSize: "14px", fontWeight: 500, color: isActive ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.7)", transition: "color 0.2s" })}>
              support
            </NavLink>
          </nav>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {!user && (
              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "10px",
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#fff",
                  cursor: "pointer"
                }}
              >
                sign in
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate("/studio")}
              style={{
                background: "var(--accent-primary)",
                border: "none",
                borderRadius: "10px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 0 20px var(--accent-glow)"
              }}
            >
              open studio →
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, paddingTop: "72px" }}>
        <Outlet />
      </main>

      <footer style={{
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "32px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
        fontSize: "13px",
        color: "rgba(255, 255, 255, 0.5)"
      }}>
        <div>© 2026 CaptionCraft. Built with ❤️ in India.</div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link to="/terms" style={{ color: "rgba(255, 255, 255, 0.5)", textDecoration: "none", fontSize: "13px", transition: "color 0.15s ease" }}>Terms</Link>
          <Link to="/privacy" style={{ color: "rgba(255, 255, 255, 0.5)", textDecoration: "none", fontSize: "13px", transition: "color 0.15s ease" }}>Privacy</Link>
          <Link to="/support" style={{ color: "rgba(255, 255, 255, 0.5)", textDecoration: "none", fontSize: "13px", transition: "color 0.15s ease" }}>Support</Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span>public beta active</span>
          <span style={{ color: "var(--accent-primary)" }}>● all systems operational</span>
        </div>
      </footer>
    </div>
  );
}
