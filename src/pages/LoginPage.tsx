import { useState } from "react";
import type { ReactElement } from "react";
import { Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Check } from "lucide-react";

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
  const [cfVerified, setCfVerified] = useState<boolean>(true);

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
    <div style={{
      minHeight: "calc(100vh - 64px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      position: "relative",
      backgroundColor: "var(--bg-app)",
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
        maxWidth: "420px",
        background: "var(--nav-bg)",
        border: "1px solid var(--box-border)",
        borderRadius: "24px",
        padding: "36px 32px",
        boxShadow: "var(--card-shadow-hover)",
        transition: "all 0.2s ease"
      }}>
        {/* Header Title */}
        <div style={{ marginBottom: "24px", textAlign: "left" }}>
          <h1 style={{
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--card-text-primary)",
            margin: "0 0 6px 0"
          }}>
            Sign in to Create Captions
          </h1>
          <p style={{
            fontSize: "13px",
            color: "var(--card-text-secondary)",
            margin: 0,
            lineHeight: 1.5,
            fontWeight: 500
          }}>
            Sign in or create your free account.
          </p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "10px",
            padding: "10px 14px",
            color: "#ef4444",
            fontSize: "13px",
            marginBottom: "18px",
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        {/* Continue with Google Primary CTA */}
        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={busy}
          style={{
            width: "100%",
            padding: "13px 18px",
            background: "var(--bg-surface-elevated)",
            border: "1px solid var(--box-border)",
            borderRadius: "12px",
            color: "var(--card-text-primary)",
            fontSize: "14px",
            fontWeight: 700,
            cursor: busy ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            boxShadow: "var(--card-shadow)",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={e => {
            if (!busy) {
              e.currentTarget.style.borderColor = "var(--accent-primary)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={e => {
            if (!busy) {
              e.currentTarget.style.borderColor = "var(--box-border)";
              e.currentTarget.style.transform = "translateY(0)";
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
          <span>{busy ? "connecting to google…" : "Continue with Google"}</span>
        </button>

        {/* Cloudflare Turnstile Verification Badge Widget */}
        <div style={{
          marginTop: "20px",
          padding: "10px 14px",
          background: "var(--bg-surface-elevated)",
          border: "1px solid var(--box-border)",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "default"
        }}>
          <div
            onClick={() => setCfVerified(prev => !prev)}
            style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
          >
            <div style={{
              width: "18px",
              height: "18px",
              borderRadius: "4px",
              border: cfVerified ? "none" : "2px solid var(--card-text-muted)",
              background: cfVerified ? "#10b981" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease"
            }}>
              {cfVerified && <Check size={13} color="#ffffff" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--card-text-primary)" }}>
              {cfVerified ? "Success! Verification complete" : "Verify you are human"}
            </span>
          </div>

          {/* Cloudflare Brand Logo & Links */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="20" height="12" viewBox="0 0 114 60" fill="none">
                <path
                  d="M87.2 24.5C84.9 10.4 72.8 0 58.2 0 46.1 0 35.8 7.3 31.7 17.6 29 16.5 26 15.9 22.8 15.9 10.2 15.9 0 26.1 0 38.7c0 1.2.1 2.3.3 3.5h88.6c13.7 0 24.8-11.1 24.8-24.8 0-11.8-8.2-21.7-19.3-24.1-2.1 4-4.5 7.7-7.2 11.2z"
                  fill="#F38020"
                />
                <path
                  d="M93.3 42.2H2.3c-.8 0-1.4.6-1.4 1.4 0 9.1 7.4 16.4 16.4 16.4h76c8.5 0 15.4-6.9 15.4-15.4 0-1.3-.2-2.4-.6-2.4h-14.8z"
                  fill="#FAAE40"
                />
              </svg>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#F38020", letterSpacing: "0.08em" }}>
                CLOUDFLARE
              </span>
            </div>
            <div style={{ fontSize: "9px", color: "var(--card-text-muted)", display: "flex", gap: "4px", marginTop: "1px" }}>
              <span style={{ textDecoration: "none" }}>Privacy</span>
              <span>•</span>
              <span style={{ textDecoration: "none" }}>Terms</span>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <div style={{ marginTop: "22px", textAlign: "center" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--card-text-muted)",
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
          lineHeight: 1.5
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
