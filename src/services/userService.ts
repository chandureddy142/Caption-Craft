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
export async function getCurrentUserPlan(): Promise<string> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return "starter";
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("plan, subscription_status, plan_period_end")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profile) {
      // Fallback to user metadata if profiles record is not yet generated
      return (user.user_metadata?.plan as string) || "starter";
    }

    // Check expiration if a period end is set
    if (profile.plan_period_end) {
      const isExpired = new Date(profile.plan_period_end).getTime() < Date.now();
      if (isExpired) {
        return "starter";
      }
    }

    return profile.plan || "starter";
  } catch (err) {
    console.warn("Failed to fetch user subscription plan:", err);
    return "starter";
  }
}
