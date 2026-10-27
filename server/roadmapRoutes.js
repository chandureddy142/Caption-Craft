const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const router = express.Router();
const DATA_FILE = path.resolve(process.cwd(), "data/roadmap.json");
const ADMIN_PASSWORD = process.env.ROADMAP_ADMIN_PASSWORD || "batman";
const COOKIE_NAME = "cc_roadmap_session";

// In-memory rate limiting for login attempts
const loginAttempts = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, resetTime: now + 15 * 60 * 1000 };
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + 15 * 60 * 1000;
  }
  entry.count++;
  loginAttempts.set(ip, entry);
  return entry.count <= 6;
}

// In-memory valid sessions (or HMAC token verification)
const activeSessions = new Set();

function getRoadmapData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const defaultData = [
      {
        id: "u4",
        category: "AI Tools",
        dateOrStage: "Planned",
        title: "Automatic B-Roll & Kinetic Emoji Hooks",
        description: "Detects emotional emphasis and keywords in your speech to automatically pop relevant 3D emojis and visual zoom cuts.",
        status: "upcoming",
        side: "left"
      },
      {
        id: "u3",
        category: "Publishing",
        dateOrStage: "Planned",
        title: "Direct Export to Instagram Reels & YouTube",
        description: "One-click publish straight to your connected social channels with auto-generated hashtags and hook titles.",
        status: "upcoming",
        side: "right"
      },
      {
        id: "u2",
        category: "Editor",
        dateOrStage: "Next Up",
        title: "Smarter Telugu Phonetic Auto-Correct",
        description: "Learns frequent creator terminology and slang to automatically fix first-pass spellings.",
        status: "upcoming",
        side: "left"
      },
      {
        id: "u1",
        category: "Engine",
        dateOrStage: "Next Up",
        title: "High-Speed On-Device Processing",
        description: "Utilize your computer or phone GPU shaders to transcribe 1-minute reels in under 10 seconds locally.",
        status: "upcoming",
        side: "right"
      },
      {
        id: "s1",
        category: "Publishing",
        dateOrStage: "Oct 2026",
        title: "Telugu Script or Tenglish Toggle",
        description: "Choose native Telugu or English-Telugu before generating, with word-level sync tuned for Reels and Shorts.",
        status: "delivered",
        side: "left"
      },
      {
        id: "s2",
        category: "Editor",
        dateOrStage: "Sep 2026",
        title: "Kinetic Word-by-Word Highlights",
        description: "Real-time karaoke style animation that highlights each spoken syllable with custom glow and outline effects.",
        status: "delivered",
        side: "right"
      },
      {
        id: "s3",
        category: "Privacy & Engine",
        dateOrStage: "Sep 2026",
        title: "100% On-Device Browser Transcription",
        description: "On-device AI processes audio securely inside your browser. Your private footage never leaves your machine.",
        status: "delivered",
        side: "left"
      },
      {
        id: "s4",
        category: "Editor",
        dateOrStage: "Aug 2026",
        title: "Regional Font Library & Custom Typography",
        description: "Curated display fonts specifically tuned for regional headlines, safe zone overlays, and 9:16 mobile viewports.",
        status: "delivered",
        side: "right"
      },
      {
        id: "s5",
        category: "Export",
        dateOrStage: "Aug 2026",
        title: "SRT & VTT Subtitle Downloads",
        description: "Export clean timecoded subtitle files alongside burned-in video for direct YouTube Shorts and Reels uploads.",
        status: "delivered",
        side: "left"
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), "utf8");
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveRoadmapData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach(cookie => {
    let [name, ...rest] = cookie.split("=");
    name = name.trim();
    if (!name) return;
    const value = rest.join("=").trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

// 1. PUBLIC: Fetch current live roadmap stops
router.get("/api/roadmap", (_req, res) => {
  try {
    const items = getRoadmapData();
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ error: "Failed to read roadmap data" });
  }
});

// 2. ADMIN AUTH LOGIN: Password verification
router.post("/api/roadmap/auth/login", (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Too many attempts. Please try again in 15 minutes." });
  }

  const { password } = req.body || {};
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid admin password" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  activeSessions.add(token);

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ success: true, message: "Admin authenticated" });
});

// 3. ADMIN CHECK
router.get("/api/roadmap/auth/check", (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  const isAdmin = Boolean(token && activeSessions.has(token));
  res.json({ isAdmin });
});

// 4. ADMIN LOGOUT
router.post("/api/roadmap/auth/logout", (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (token) activeSessions.delete(token);
  res.clearCookie(COOKIE_NAME);
  res.json({ success: true });
});

// 5. SECURE SHIP (MUTATION)
router.patch("/api/roadmap/:id/status", (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized: Admin session required" });
  }

  const { id } = req.params;
  const { status, dateOrStage } = req.body || {};
  const data = getRoadmapData();
  const idx = data.findIndex(i => i.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Milestone not found" });
  }

  data[idx].status = status || "delivered";
  if (dateOrStage) data[idx].dateOrStage = dateOrStage;

  saveRoadmapData(data);
  res.json({ success: true, items: data });
});

// 6. SECURE ADD UPCOMING
router.post("/api/roadmap", (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized: Admin session required" });
  }

  const { title, category, description, dateOrStage } = req.body || {};
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Title is required" });
  }

  const data = getRoadmapData();
  const upcomingCount = data.filter(d => d.status === "upcoming").length;

  const newItem = {
    id: "u_" + Date.now(),
    title: title.trim().slice(0, 100),
    category: category || "Editor",
    description: (description || "").trim().slice(0, 300),
    dateOrStage: (dateOrStage || "Next Up").trim().slice(0, 30),
    status: "upcoming",
    side: upcomingCount % 2 === 0 ? "right" : "left"
  };

  data.unshift(newItem);
  saveRoadmapData(data);
  res.json({ success: true, item: newItem, items: data });
});

module.exports = router;
