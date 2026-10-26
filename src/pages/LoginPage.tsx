import { useState } from "react";
import type { ReactElement } from "react";
import { Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Turnstile } from "@marsidev/react-turnstile";

interface FromState {
  from?: { pathname: string; search: string; state?: unknown };
}

export default function LoginPage(): ReactElement {
  const { session, loading, signInWithGoogle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as FromState | null)?.from;
  const target = from ? `${from.pathname}${from.search}` : "/studio";

  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cfVerified, setCfVerified] = useState<boolean>(false);

  // Cloudflare Turnstile site key
  const turnstileSiteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

  if (!loading && session) {
    return <Navigate to={target} replace state={from?.state} />;
  }

  const handleGoogle = async (): Promise<void> => {
    if (!cfVerified) {
      setError("Please complete human verification below before signing in.");
      return;
    }
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
    <div style={{
      minHeight: "calc(100vh - 70px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "36px 16px",
      position: "relative",
      backgroundColor: "var(--bg-app)",
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      overflow: "hidden"
    }}>
      {/* Background Ambience Layer */}
      <div style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.12,
        backgroundImage: "radial-gradient(var(--text-primary) 1px, transparent 1px)",
        backgroundSize: "28px 28px"
      }} />

      {/* Main Login Card */}
      <div style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        maxWidth: "390px",
        backgroundColor: "var(--nav-bg)",
        border: "1px solid var(--box-border)",
        borderRadius: "20px",
        padding: "32px 26px 26px",
        boxShadow: "var(--card-shadow-hover)",
        transition: "all 0.2s ease"
      }}>
        {/* Header Title */}
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--card-text-primary)",
            margin: "0 0 6px 0"
          }}>
            Sign in to Create Captions
          </h1>
          <p style={{
            fontSize: "13px",
            color: "var(--card-text-secondary)",
            margin: 0,
            lineHeight: 1.45,
            fontWeight: 500
          }}>
            Sign in with your Google account to access your studio.
          </p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "10px",
            padding: "8px 12px",
            color: "#ef4444",
            fontSize: "12px",
            marginBottom: "14px",
            fontWeight: 600,
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        {/* Continue with Google Primary CTA */}
        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={busy || !cfVerified}
          style={{
            width: "100%",
            padding: "11px 16px",
            backgroundColor: cfVerified ? "var(--bg-surface-elevated)" : "var(--nav-bg)",
            border: "1px solid var(--box-border)",
            borderRadius: "12px",
            color: "var(--card-text-primary)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "13.5px",
            fontWeight: 700,
            cursor: (!cfVerified || busy) ? "not-allowed" : "pointer",
            opacity: !cfVerified ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: "var(--card-shadow)",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={e => {
            if (cfVerified && !busy) {
              e.currentTarget.style.borderColor = "var(--accent-primary)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={e => {
            if (cfVerified && !busy) {
              e.currentTarget.style.borderColor = "var(--box-border)";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
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
          <span>{busy ? "Connecting to Google…" : "Continue with Google"}</span>
        </button>

        {/* Cloudflare Turnstile Verification Widget (Below Google button & scaled) */}
        <div style={{
          marginTop: "14px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          borderRadius: "8px"
        }}>
          <div style={{
            transform: "scale(0.85)",
            transformOrigin: "center center"
          }}>
            <Turnstile
              siteKey={turnstileSiteKey}
              onSuccess={() => {
                setCfVerified(true);
                setError(null);
              }}
              onError={() => {
                setCfVerified(false);
                setError("Verification failed. Please refresh.");
              }}
              onExpire={() => setCfVerified(false)}
              options={{
                theme: "auto",
                size: "normal"
              }}
            />
          </div>
        </div>

        {/* Cancel Button */}
        <div style={{ marginTop: "14px", textAlign: "center" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--card-text-muted)",
              fontFamily: "inherit",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "color 0.15s ease"
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--card-text-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--card-text-muted)")}
          >
            Cancel
          </button>
        </div>

        {/* Legal Notice */}
        <p style={{
          marginTop: "16px",
          fontSize: "11px",
          color: "var(--card-text-muted)",
          textAlign: "center",
          lineHeight: 1.45,
          margin: "16px 0 0"
        }}>
          By continuing, you agree to the{" "}
          <Link to="/terms" style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}>
            Privacy Policy
          </Link>.
        </p>
      </div>
    </div>
  );
}
