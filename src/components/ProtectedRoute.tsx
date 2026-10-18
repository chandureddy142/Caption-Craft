import type { ReactElement } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Wraps routes that need a signed-in user; sends everyone else to /login and back. */
export default function ProtectedRoute(): ReactElement {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f0e] text-sm text-white/60">
        checking your session…
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: { pathname: location.pathname, search: location.search, state: location.state } }}
      />
    );
  }

  return <Outlet />;
}
