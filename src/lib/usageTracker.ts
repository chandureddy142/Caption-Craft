import { supabase } from "./supabase";

const LOCAL_AUDIT_PREFIX = "cc_usage_audit_";

export async function getPersistentEmailUsage(email: string): Promise<number> {
  if (!email) return 0;
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check local persistent audit storage
  let localMinutes = 0;
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_PREFIX + normalizedEmail);
    if (raw) localMinutes = parseFloat(raw) || 0;
  } catch (e) {
    console.warn("Could not read local usage audit:", e);
  }

  // 2. Query Supabase persistent table if available
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
  } catch (err) {
    // If table does not exist or user is offline, fallback to local storage
  }

  return localMinutes;
}

export async function recordPersistentUsage(email: string, minutesToAdd: number): Promise<number> {
  if (!email || minutesToAdd <= 0) return 0;
  const normalizedEmail = email.trim().toLowerCase();

  const current = await getPersistentEmailUsage(normalizedEmail);
  const updated = Math.round((current + minutesToAdd) * 10) / 10;

  // Persist locally
  try {
    localStorage.setItem(LOCAL_AUDIT_PREFIX + normalizedEmail, updated.toString());
  } catch (e) {}

  // Sync with Supabase audit table
  try {
    await supabase
      .from("account_usage_audit")
      .upsert({
        email: normalizedEmail,
        minutes_used: updated,
        updated_at: new Date().toISOString()
      }, { onConflict: "email" });
  } catch (err) {}

  return updated;
}
