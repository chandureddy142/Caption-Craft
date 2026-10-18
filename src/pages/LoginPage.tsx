import { useState } from "react";
import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface FromState {
  from?: { pathname: string; search: string; state?: unknown };
}

export default function LoginPage(): ReactElement {
  const { session, loading, signInWithGoogle } = useAuth();
  const location = useLocation();
  const from = (location.state as FromState | null)?.from;
  const target = from ? `${from.pathname}${from.search}` : "/studio";

  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && session) {
    return <Navigate to={target} replace state={from?.state} />;
  }

  const handleGoogle = async (): Promise<void> => {
    try {
      setBusy(true);
      setError(null);
      const result = await signInWithGoogle();
      if (result?.error) {
        setError(result.error);
        setBusy(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google");
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 150px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "#0B0F0E" }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        background: "#111715",
        border: "1px solid #26312C",
        borderRadius: "20px",
        padding: "36px 28px",
        textAlign: "center",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)"
      }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 850, letterSpacing: "-0.02em", color: "#F3F6F4", margin: "0 0 8px 0" }}>
            welcome to CaptionCraft
          </h1>
          <p style={{ fontSize: "13px", color: "#A0AAA5", margin: 0, lineHeight: 1.5 }}>
            {from ? "Sign in with your Google account to access your studio workspace." : "Sign in with Google to create and export your video captions."}
          </p>
        </div>

        {error && (
          <div style={{ background: "rgba(255, 75, 75, 0.1)", border: "1px solid rgba(255, 75, 75, 0.3)", borderRadius: "8px", padding: "10px 14px", color: "#ff8585", fontSize: "13px", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={busy}
          style={{
            width: "100%",
            padding: "13px 18px",
            background: "#151D19",
            border: "1px solid #26312C",
            borderRadius: "10px",
            color: "#F3F6F4",
            fontSize: "14px",
            fontWeight: 700,
            cursor: busy ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={e => {
            if (!busy) {
              e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
              e.currentTarget.style.background = "#14251E";
            }
          }}
          onMouseLeave={e => {
            if (!busy) {
              e.currentTarget.style.borderColor = "#26312C";
              e.currentTarget.style.background = "#151D19";
            }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{busy ? "connecting to google…" : "continue with google"}</span>
        </button>

        <p style={{ marginTop: "24px", fontSize: "12px", color: "#737F79", margin: "24px 0 0", lineHeight: 1.5 }}>
          by signing in you agree to use CaptionCraft beta for video caption generation.
        </p>
      </div>
    </div>
  );
}
