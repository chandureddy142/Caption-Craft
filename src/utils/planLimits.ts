import { PLANS, WEEKLY_PLAN, type Plan } from "../config/plans";

export type UserPlanType = "starter" | "creator_lite" | "creator_pro" | "weekly_pro" | "studio_max";

export interface PlanConfig {
  id: string;
  name: string;
  maxBgCuts: number;
  maxDurationMinutes: number;
  canUploadBgMedia: boolean;
  canUploadMusic: boolean;
  canUseSafeZones: boolean;
  canDownloadSubtitles: boolean;
  allowedResolutions: Array<"720p" | "1080p" | "2K" | "4K">;
  allowedFormats: Array<"webm" | "mp4" | "mov" | "mkv">;
  hasWatermark: boolean;
}

export function getPlanConfig(planId: string = "starter"): PlanConfig {
  const normalized = (planId || "starter").toLowerCase().trim();

  if (normalized === "weekly_pro" || normalized === "weekly") {
    return mapPlanToConfig(WEEKLY_PLAN);
  }

  const found = PLANS.find(
    (p: Plan) => p.id === normalized || p.id.replace("_", "") === normalized.replace("_", "")
  );

  return mapPlanToConfig(found || PLANS[0]);
}

function mapPlanToConfig(plan: Plan): PlanConfig {
  return {
    id: plan.id,
    name: plan.name,
    maxBgCuts: plan.maxBgSegments,
    maxDurationMinutes: plan.maxDurationMinutes,
    canUploadBgMedia: plan.allowCustomMedia,
    canUploadMusic: plan.allowMusicTrack,
    canUseSafeZones: plan.allowSafeZones,
    canDownloadSubtitles: plan.allowSrtVttExport,
    allowedResolutions: plan.allowedResolutions,
    allowedFormats: plan.allowedFormats,
    hasWatermark: plan.hasWatermark,
  };
}
