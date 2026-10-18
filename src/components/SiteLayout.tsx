import type { ReactElement } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SiteLayout(): ReactElement {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#050807", color: "#ecf2ee", fontFamily: "system-ui, sans-serif" }}>
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(5, 8, 7, 0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "0 24px"
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}>
            <span style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "#00e5a0",
              color: "#050807",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "15px"
            }}>cc</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.01em" }}>CaptionCraft</span>
                <span style={{ fontSize: "10px", padding: "2px 6px", background: "rgba(0, 229, 160, 0.12)", color: "#00e5a0", borderRadius: "999px", border: "1px solid rgba(0, 229, 160, 0.25)", fontWeight: 600 }}>telugu ai</span>
              </div>
              <span style={{ display: "block", fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>smart captions for telugu creators</span>
            </div>
          </Link>

          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <NavLink to="/" style={({ isActive }) => ({ textDecoration: "none", fontSize: "14px", fontWeight: 500, color: isActive ? "#00e5a0" : "rgba(255, 255, 255, 0.7)", transition: "color 0.2s" })}>
              home
            </NavLink>
            <NavLink to="/templates" style={({ isActive }) => ({ textDecoration: "none", fontSize: "14px", fontWeight: 500, color: isActive ? "#00e5a0" : "rgba(255, 255, 255, 0.7)", transition: "color 0.2s" })}>
              templates
            </NavLink>
            <NavLink to="/pricing" style={({ isActive }) => ({ textDecoration: "none", fontSize: "14px", fontWeight: 500, color: isActive ? "#00e5a0" : "rgba(255, 255, 255, 0.7)", transition: "color 0.2s" })}>
              pricing
            </NavLink>
          </nav>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {user ? (
              <>
                <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "rgba(255, 255, 255, 0.8)",
                    cursor: "pointer"
                  }}
                >
                  sign out
                </button>
              </>
            ) : (
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
                background: "#00e5a0",
                border: "none",
                borderRadius: "10px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#050807",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(0, 229, 160, 0.25)"
              }}
            >
              open studio →
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", padding: "28px 24px", textAlign: "center", fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>
        © 2026 CaptionCraft · captions for telugu, tenglish & english videos
      </footer>
    </div>
  );
}
