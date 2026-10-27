import { supabase } from "../lib/supabase";

export interface UserSubscription {
  userId: string;
  email: string | null;
  plan: string;
  subscriptionStatus: string;
  planPeriodEnd: string | null;
}

/**
 * Fetches the user profile and evaluates active plan tier.
 * Automatically falls back to "starter" if expired or unavailable.
 */
function normalizePlanName(raw: string | null | undefined): string {
  if (!raw) return "starter";
  const s = raw.toLowerCase().trim();
  if (s === "max" || s === "studio_max" || s === "studio-max") return "studio_max";
  if (s === "pro" || s === "creator_pro" || s === "creator-pro") return "creator_pro";
  if (s === "lite" || s === "creator_lite" || s === "creator-lite") return "creator_lite";
  if (s === "weekly" || s === "weekly_pro") return "weekly_pro";
  return s;
}

export async function getCurrentUserPlan(): Promise<string> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn("[userService] No active user session detected; defaulting to starter.");
      return "starter";
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("plan, subscription_status, plan_period_end")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profile) {
      const metaPlan = (user.user_metadata?.plan as string) || (user.app_metadata?.plan as string);
      console.warn("[userService] No profile row found, using metadata:", metaPlan);
      return normalizePlanName(metaPlan);
    }

    if (profile.plan_period_end) {
      const isExpired = new Date(profile.plan_period_end).getTime() < Date.now();
      if (isExpired) {
        console.warn("[userService] Plan period expired, falling back to starter.");
        return "starter";
      }
    }

    return normalizePlanName(profile.plan);
  } catch (err) {
    console.warn("Failed to fetch user subscription plan:", err);
    return "starter";
  }
}
