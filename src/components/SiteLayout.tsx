import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { ThemeToggle } from "../lib/theme";

interface SiteLayoutProps {
  user?: any;
}

export const SiteLayout: React.FC<SiteLayoutProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-app)" }}>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "64px",
          background: "var(--nav-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-subtle)",
          zIndex: 50
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          {/* Brand */}
          <div
            onClick={() => navigate("/")}
            style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--accent-surface)",
                border: "1px solid var(--border-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px"
              }}
            >
              🎬
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                CaptionCraft
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "-2px" }}>
                smart captions for creators
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                transition: "color 0.2s"
              })}
            >
              home
            </NavLink>
            <NavLink
              to="/templates"
              style={({ isActive }) => ({
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                transition: "color 0.2s"
              })}
            >
              templates
            </NavLink>
            <NavLink
              to="/roadmap"
              style={({ isActive }) => ({
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                transition: "color 0.2s"
              })}
            >
              roadmap
            </NavLink>
            <NavLink
              to="/pricing"
              style={({ isActive }) => ({
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                transition: "color 0.2s"
              })}
            >
              pricing
            </NavLink>
            <NavLink
              to="/support"
              style={({ isActive }) => ({
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                transition: "color 0.2s"
              })}
            >
              support
            </NavLink>
          </nav>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ThemeToggle />

            {!user && (
              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
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
                boxShadow: "0 2px 10px var(--accent-surface)",
                transition: "background 0.15s ease"
              }}
            >
              open studio →
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, paddingTop: "64px" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default SiteLayout;
