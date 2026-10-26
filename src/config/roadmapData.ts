export interface RoadmapStop {
  id: string;
  title: string;
  category: "Engine" | "Editor" | "Typography" | "Export" | "AI Tools" | "Regional";
  dateOrStage: string;
  description: string;
  status: "upcoming" | "delivered";
  side?: "left" | "right";
  shippedDate?: string;
}

export const INITIAL_ROADMAP_STOPS: RoadmapStop[] = [
  // --- UPCOMING MILESTONES (Ahead on the Route) ---
  {
    id: "up_1",
    title: "Direct Social Auto-Publish (Reels & Shorts)",
    category: "Export",
    dateOrStage: "Next Up",
    description: "Runs transcription directly on your device graphics hardware—transcribe 60-second Reels in under 10 seconds with 100% creator privacy.",
    status: "delivered",
    shippedDate: "Oct 2026",
    side: "left"
  },
  {
    id: "del_2",
    title: "Telugu Script & Tenglish Dual Engine",
    category: "Regional",
    dateOrStage: "Oct 2026",
    description: "Instant one-click toggle between authentic native Telugu Lipi and phonetic English-Telugu (Tenglish) with exact syllable-level sync.",
    status: "delivered",
    shippedDate: "Oct 2026",
    side: "right"
  },
  {
    id: "del_3",
    title: "Word-by-Word Kinetic Karaoke Animation",
    category: "Editor",
    dateOrStage: "Oct 2026",
    description: "Real-time bouncing, scale-pop, and custom neon glow animations that illuminate each spoken syllable in sync with dialogue.",
    status: "delivered",
    shippedDate: "Oct 2026",
    side: "left"
  },
  {
    id: "del_4",
    title: "9:16 Social Safe-Zone Overlays & Multi-Aspect Export",
    category: "Editor",
    dateOrStage: "Oct 2026",
    description: "Live visual guides for TikTok, Reels, and YouTube Shorts UI elements to guarantee captions never get blocked by like or comment icons.",
    status: "delivered",
    shippedDate: "Oct 2026",
    side: "right"
  },
  {
    id: "del_5",
    title: "Synchronized SRT & VTT Subtitle Export",
    category: "Export",
    dateOrStage: "Oct 2026",
    description: "Export industry-standard timestamped subtitle files alongside crisp burned-in MP4 video exports.",
    status: "delivered",
    shippedDate: "Oct 2026",
    side: "left"
  }
];
