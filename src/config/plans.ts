export type BillingCycle = "weekly" | "monthly" | "yearly";

export interface PlanFeature {
  text: string;
  isLocked?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyMonthlyEquivalent: number;
  weeklyPrice?: number;
  maxDurationMinutes: number;
  maxBgSegments: number;
  allowedResolutions: Array<"720p" | "1080p" | "2K" | "4K">;
  allowedFormats: Array<"webm" | "mp4" | "mov" | "mkv">;
  hasWatermark: boolean;
  allowMusicTrack: boolean;
  allowCustomMedia: boolean;
  allowSafeZones: boolean;
  allowSrtVttExport: boolean;
  features: PlanFeature[];
  ctaText: string;
  isPopular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    badge: "Free Forever",
    description: "Basic editor to test Telugu, Tenglish & English captions.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthlyEquivalent: 0,
    maxDurationMinutes: 3,
    maxBgSegments: 3,
    allowedResolutions: ["720p"],
    allowedFormats: ["webm"],
    hasWatermark: true,
    allowMusicTrack: false,
    allowCustomMedia: false,
    allowSafeZones: false,
    allowSrtVttExport: false,
    features: [
      { text: "3 minutes total export length per month" },
      { text: "720p standard resolution export" },
      { text: "Up to 3 background cuts per timeline" },
      { text: "Create Captions watermark included" },
      { text: "WebM format only (MP4 locked)", isLocked: true },
      { text: "Local device photo/video backdrop locked", isLocked: true },
      { text: "Background music track locked", isLocked: true },
      { text: "Platform safe area guides locked", isLocked: true },
      { text: "SRT and VTT subtitle downloads locked", isLocked: true }
    ],
    ctaText: "Start Creating Free"
  },
  {
    id: "creator_lite",
    name: "Creator Lite",
    badge: "Budget Friendly",
    description: "Clean, watermark-free exports for regular social media reels.",
    monthlyPrice: 49,
    yearlyPrice: 499,
    yearlyMonthlyEquivalent: 41,
    maxDurationMinutes: 25,
    maxBgSegments: 12,
    allowedResolutions: ["720p", "1080p"],
    allowedFormats: ["webm", "mp4"],
    hasWatermark: false,
    allowMusicTrack: true,
    allowCustomMedia: true,
    allowSafeZones: true,
    allowSrtVttExport: false,
    features: [
      { text: "25 minutes export duration per month" },
      { text: "1080p Full HD video exports" },
      { text: "MP4 & WebM container downloads" },
      { text: "Zero watermark (clean video master)" },
      { text: "Unlock background music track layer" },
      { text: "Unlock custom photo & video uploads" },
      { text: "Unlock Instagram & Shorts safe area overlays" },
      { text: "Up to 12 background cuts per project", isLocked: true },
      { text: "SRT and VTT subtitle downloads locked", isLocked: true }
    ],
    ctaText: "Get Creator Lite"
  },
  {
    id: "creator_pro",
    name: "Creator Pro",
    badge: "Editor Choice",
    isPopular: true,
    description: "The complete studio setup for viral content creators.",
    monthlyPrice: 99,
    yearlyPrice: 999,
    yearlyMonthlyEquivalent: 83,
    weeklyPrice: 29,
    maxDurationMinutes: 60,
    maxBgSegments: 30,
    allowedResolutions: ["720p", "1080p"],
    allowedFormats: ["webm", "mp4", "mov"],
    hasWatermark: false,
    allowMusicTrack: true,
    allowCustomMedia: true,
    allowSafeZones: true,
    allowSrtVttExport: true,
    features: [
      { text: "60 minutes export duration per month" },
      { text: "1080p Full HD video exports" },
      { text: "MP4 & WebM container downloads" },
      { text: "Zero watermark (clean video master)" },
      { text: "Up to 30 background cuts per project" },
      { text: "Unlock background music track layer" },
      { text: "Unlock custom photo & video uploads" },
      { text: "Unlock Instagram & Shorts safe area overlays" },
      { text: "SRT and VTT subtitle downloads included" },
      { text: "MP4, WebM & MOV export formats", isLocked: true }
    ],
    ctaText: "Upgrade to Creator Pro"
  },
  {
    id: "studio_max",
    name: "Studio Max",
    badge: "Power Creators & Teams",
    description: "Ultra-sharp 4K exports and unlimited project capacity.",
    monthlyPrice: 199,
    yearlyPrice: 1999,
    yearlyMonthlyEquivalent: 166,
    maxDurationMinutes: 300,
    maxBgSegments: 999,
    allowedResolutions: ["720p", "1080p", "2K", "4K"],
    allowedFormats: ["webm", "mp4", "mov", "mkv"],
    hasWatermark: false,
    allowMusicTrack: true,
    allowCustomMedia: true,
    allowSafeZones: true,
    allowSrtVttExport: true,
    features: [
      { text: "300 minutes export length (unlimited reels)" },
      { text: "2K and 4K Ultra HD video rendering" },
      { text: "All formats: MP4, MOV, WebM & MKV" },
      { text: "Zero watermark & custom studio branding" },
      { text: "Unlimited background cuts & segment switches" },
      { text: "Unlock background music track layer" },
      { text: "Unlock custom photo & video uploads" },
      { text: "Unlock Instagram & Shorts safe area overlays" },
      { text: "SRT and VTT subtitle downloads included" },
      { text: "Multiple editor team seats" },
      { text: "Batch caption processing queue" },
      { text: "Priority customer & direct technical support" }
    ],
    ctaText: "Get Studio Max"
  }
];

export const WEEKLY_PLAN: Plan = {
  id: "weekly_pro",
  name: "7-Day Creator Pass",
  badge: "7-Day Full Access",
  description: "Full Creator Pro features for one week. Perfect for batching Reels.",
  monthlyPrice: 29,
  yearlyPrice: 29,
  yearlyMonthlyEquivalent: 29,
  weeklyPrice: 29,
  maxDurationMinutes: 15,
  maxBgSegments: 30,
  allowedResolutions: ["720p", "1080p"],
  allowedFormats: ["webm", "mp4", "mov"],
  hasWatermark: false,
  allowMusicTrack: true,
  allowCustomMedia: true,
  allowSafeZones: true,
  allowSrtVttExport: true,
  features: [
    { text: "15 minutes total export length for 7 days" },
    { text: "Zero watermark on all exports" },
    { text: "1080p Full HD MP4 & MOV downloads" },
    { text: "Up to 30 background segment cuts" },
    { text: "Background music track unlocked" },
    { text: "Unlimited custom photo/video backdrop uploads" },
    { text: "Full access to all 42+ kinetic caption templates" },
    { text: "Safe area guides & SRT/VTT downloads unlocked" }
  ],
  ctaText: "Get 7-Day Pass for ₹29"
};
