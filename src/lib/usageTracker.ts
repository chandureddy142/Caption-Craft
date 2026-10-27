import { supabase } from "./supabase";
import { API_BASE_URL } from "../config/api";

const LOCAL_AUDIT_PREFIX = "cc_usage_audit_";

export async function getPersistentEmailUsage(email: string): Promise<number> {
  if (!email) return 0;
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Read local storage
  let localMinutes = 0;
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_PREFIX + normalizedEmail);
    if (raw) localMinutes = parseFloat(raw) || 0;
  } catch (e) {
    console.warn("Could not read local usage audit:", e);
  }

  // 2. Query Supabase (read-only allowed for user)
  try {
    const { data, error } = await supabase
      .from("account_usage_audit")
      .select("minutes_used")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!error && data && typeof data.minutes_used === "number") {
      const highest = Math.max(localMinutes, data.minutes_used);
      localStorage.setItem(LOCAL_AUDIT_PREFIX + normalizedEmail, highest.toString());
      return highest;
    }
  } catch (err) {}

  return localMinutes;
}

export async function recordPersistentUsage(email: string, minutesToAdd: number): Promise<number> {
  if (!email || minutesToAdd <= 0) return 0;
  const normalizedEmail = email.trim().toLowerCase();

  const current = await getPersistentEmailUsage(normalizedEmail);
  const updated = Math.round((current + minutesToAdd) * 10) / 10;

  // Local optimistic update
  try {
    localStorage.setItem(LOCAL_AUDIT_PREFIX + normalizedEmail, updated.toString());
  } catch (e) {}

  // Securely sync via backend API
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    await fetch(`${API_BASE_URL}/api/usage/record`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email: normalizedEmail, minutesToAdd }),
    });
  } catch (err) {
    console.warn("Background usage sync skipped:", err);
  }

  return updated;
}
