import { SiteFooter } from "./SiteFooter";
import { ThemeToggle } from "../lib/theme";
import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

interface SiteLayoutProps {
  user?: any;
}

export const SiteLayout: React.FC<SiteLayoutProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-app)" }}>
      {/* Contrasting Header */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "64px",
          background: "var(--nav-bg)",
          borderBottom: "1px solid var(--nav-border)",
          transition: "background-color 0.25s ease, border-color 0.25s ease",
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
          {/* Brand Logo */}
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
                border: "1px solid var(--nav-btn-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px"
              }}
            >
              🎬
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--nav-text-primary)", letterSpacing: "-0.01em" }}>
                CaptionCraft
              </div>
              <div style={{ fontSize: "10px", color: "var(--nav-text-secondary)", marginTop: "-2px" }}>
                smart captions for creators
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            {["/", "/templates", "/roadmap", "/pricing", "/support"].map((path) => {
              const label = path === "/" ? "home" : path.replace("/", "");
              return (
                <NavLink
                  key={path}
                  to={path}
                  style={({ isActive }) => ({
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: isActive ? "var(--accent-primary)" : "var(--nav-text-secondary)",
                    transition: "color 0.2s"
                  })}
                >
                  {label}
                </NavLink>
              );
            })}
          </nav>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ThemeToggle />
            {!user && (
              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{
                  background: "var(--nav-btn-bg)",
                  border: "1px solid var(--nav-btn-border)",
                  borderRadius: "10px",
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--nav-text-primary)",
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
      
      <SiteFooter />
</div>
  );
};

export default SiteLayout;
