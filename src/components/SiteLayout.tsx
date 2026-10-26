import { supabase } from "../lib/supabase";
import { SiteFooter } from "./SiteFooter";
import { ThemeToggle, useTheme } from "../lib/theme";
import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

interface SiteLayoutProps {
  user?: any;
}

export const SiteLayout: React.FC<SiteLayoutProps> = ({ user }) => {
  const { theme } = useTheme();

  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (typeof supabase !== "undefined") {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setCurrentUser(session?.user ?? null);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user ?? null);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleAuthAction = async () => {
    if (currentUser) {
      if (typeof supabase !== "undefined") {
        await supabase.auth.signOut();
      }
      setCurrentUser(null);
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  

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
            style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}
          >
            <div style={{ width: "50px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <img
        src={theme === "dark" ? "/media/Llogo.png" : "/media/Dlogo.png"}
        alt="Create Captions"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
    <div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--nav-text-primary)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                Create Captions
              </div>
              <div style={{ fontSize: "11px", color: "var(--nav-text-secondary)", marginTop: "2px", fontWeight: 500 }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <ThemeToggle />
            {!user && (
              <button
    type="button"
    onClick={handleAuthAction}
    style={{
      backgroundColor: "var(--card-bg)",
      color: "var(--card-text-primary)",
      border: "1px solid var(--box-border)",
      borderRadius: "10px",
      padding: "8px 16px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease"
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.opacity = "0.85";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.opacity = "1";
    }}
  >
    {currentUser ? "sign out" : "sign in"}
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
