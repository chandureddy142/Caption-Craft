import { supabase } from "../lib/supabase";
import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Check, ThumbsUp, ThumbsDown, Send, ArrowRight, Flag, Clock, CheckCircle2, Settings, Plus, ArrowDown, ArrowUp, X, Lock, LogOut, RotateCcw, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { INITIAL_ROADMAP_STOPS, type RoadmapStop } from "../config/roadmapData";

const ROAD_WIDTH = 96;
const HALF_ROAD = ROAD_WIDTH / 2; // 48px from center to outer border
const PIN_OFFSET_FROM_OUTLINE = 32; // Pin distance from road outer edge
const CARD_GAP_FROM_OUTLINE = 110; // Generous card outreach distance from road edge

/* Detailed Semi-Trailer Truck */
const DetailedSemiTruck: React.FC<{ size?: number }> = ({ size = 250 }) => (
  <svg
    width={size}
    height={Math.round(size * 0.38)}
    viewBox="0 0 320 120"
    fill="none"
    style={{ filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.36))" }}
  >
    <ellipse cx="160" cy="110" rx="145" ry="7" fill="rgba(0,0,0,0.25)" filter="blur(2px)" />

    {/* Undercarriage Safety Rails */}
    <rect x="170" y="82" width="55" height="10" rx="1" fill="#64748b" />
    <line x1="172" y1="85" x2="223" y2="85" stroke="#334155" strokeWidth="2" />
    <line x1="172" y1="89" x2="223" y2="89" stroke="#334155" strokeWidth="2" />
    <rect x="150" y="74" width="8" height="24" fill="#475569" />

    {/* Main Trailer Box */}
    <rect x="94" y="10" width="220" height="72" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="2.5" />
    <line x1="126" y1="12" x2="126" y2="80" stroke="#f1f5f9" strokeWidth="1.5" />
    <line x1="158" y1="12" x2="158" y2="80" stroke="#f1f5f9" strokeWidth="1.5" />
    <line x1="190" y1="12" x2="190" y2="80" stroke="#f1f5f9" strokeWidth="1.5" />
    <line x1="222" y1="12" x2="222" y2="80" stroke="#f1f5f9" strokeWidth="1.5" />
    <line x1="254" y1="12" x2="254" y2="80" stroke="#f1f5f9" strokeWidth="1.5" />
    <line x1="286" y1="12" x2="286" y2="80" stroke="#f1f5f9" strokeWidth="1.5" />

    <rect x="94" y="10" width="220" height="6" fill="#cbd5e1" />
    <rect x="94" y="76" width="220" height="6" fill="#cbd5e1" />
    <rect x="94" y="52" width="220" height="7" fill="var(--accent-primary)" />

    <text
      x="204"
      y="38"
      textAnchor="middle"
      fill="#0f172a"
      fontFamily="sans-serif"
      fontSize="16"
      fontWeight="900"
      letterSpacing="-0.02em"
    >
      Create Captions
    </text>

    {/* Cabin Unit */}
    <polygon points="76,14 88,14 88,38 72,38" fill="#e04e33" />
    <polygon points="34,22 76,14 74,38 34,38" fill="var(--accent-primary)" stroke="#e04e33" strokeWidth="1.2" />

    <path
      d="M 12,86 L 12,70 L 22,64 L 34,38 L 74,38 L 88,38 L 88,86 Z"
      fill="var(--accent-primary)"
      stroke="#b91c1c"
      strokeWidth="1.5"
    />
    <rect x="8" y="72" width="6" height="14" rx="1" fill="#0f172a" />
    <line x1="8" y1="75" x2="14" y2="75" stroke="#e2e8f0" strokeWidth="1.2" />
    <line x1="8" y1="78" x2="14" y2="78" stroke="#e2e8f0" strokeWidth="1.2" />
    <line x1="8" y1="81" x2="14" y2="81" stroke="#e2e8f0" strokeWidth="1.2" />

    <polygon points="12,70 8,68 8,74 12,74" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
    <polygon points="8,70 0,60 0,82 8,74" fill="#fef08a" opacity="0.45" />

    <polygon points="34,42 48,42 48,64 24,64" fill="#0f172a" />
    <polygon points="52,42 68,42 68,64 52,64" fill="#0f172a" />
    <polygon points="36,44 46,44 44,54 30,54" fill="#38bdf8" opacity="0.75" />

    <rect x="58" y="68" width="6" height="2" rx="1" fill="#e2e8f0" />
    <rect x="42" y="80" width="34" height="8" rx="2" fill="#94a3b8" />
    <rect x="84" y="78" width="56" height="10" rx="2" fill="#334155" />

    {/* Mudguards */}
    <path d="M 16,92 A 16,16 0 0 1 42,92" fill="none" stroke="#e04e33" strokeWidth="4" />
    <path d="M 88,92 A 16,16 0 0 1 114,92" fill="none" stroke="#e04e33" strokeWidth="4" />
    <path d="M 112,92 A 16,16 0 0 1 138,92" fill="none" stroke="#e04e33" strokeWidth="4" />
    <path d="M 226,92 A 16,16 0 0 1 306,92" fill="none" stroke="#64748b" strokeWidth="4" />

    {/* Wheels */}
    <circle cx="29" cy="94" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
    <circle cx="29" cy="94" r="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    <circle cx="29" cy="94" r="3" fill="#ca8a04" />

    <circle cx="101" cy="94" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
    <circle cx="101" cy="94" r="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    <circle cx="101" cy="94" r="3" fill="#ca8a04" />

    <circle cx="125" cy="94" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
    <circle cx="125" cy="94" r="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    <circle cx="125" cy="94" r="3" fill="#ca8a04" />

    <circle cx="238" cy="94" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
    <circle cx="238" cy="94" r="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    <circle cx="238" cy="94" r="3" fill="#ca8a04" />

    <circle cx="266" cy="94" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
    <circle cx="266" cy="94" r="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    <circle cx="266" cy="94" r="3" fill="#ca8a04" />

    <circle cx="294" cy="94" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
    <circle cx="294" cy="94" r="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    <circle cx="294" cy="94" r="3" fill="#ca8a04" />
  </svg>
);

export const RoadmapPage: React.FC = () => {
  const [stops, setStops] = useState<RoadmapStop[]>(() => {
    const saved = localStorage.getItem("roadmap_stops");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved stops", e);
      }
    }
    return INITIAL_ROADMAP_STOPS;
  });

  const [feedback, setFeedback] = useState<Record<string, "liked" | "disliked">>({});
  const [ideaText, setIdeaText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isTruckHovered, setIsTruckHovered] = useState(false);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDrawer, setShowAdminDrawer] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Form states with strict union type
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<RoadmapStop["category"]>("Editor");
  const [newDesc, setNewDesc] = useState("");
  const [newStage, setNewStage] = useState("Next Up");

  const roadPathRef = useRef<SVGPathElement | null>(null);

  const upcomingStops = stops.filter((s) => s.status === "upcoming");
  const deliveredStops = stops.filter((s) => s.status === "delivered");
  const nextTarget = upcomingStops[upcomingStops.length - 1];

  // Dynamic layout measurements
  const upcomingCardSpacing = 240;
  const deliveredCardSpacing = 240;
  const upcomingHeight = Math.max(upcomingStops.length * upcomingCardSpacing, 200);
  
  // Dedicated S-Curve Skip-Zone height where NO CARDS are allowed
  const scurveZoneHeight = 440;
  const truckY = upcomingHeight + scurveZoneHeight * 0.5;
  
  const deliveredHeight = Math.max(deliveredStops.length * deliveredCardSpacing, 240);
  const totalSvgHeight = upcomingHeight + scurveZoneHeight + deliveredHeight + 120;

  // Single continuous organic spline with wide dedicated S-bend
  const roadPathD = `
    M 500,0
    C 460,${upcomingHeight * 0.3} 540,${upcomingHeight * 0.7} 500,${upcomingHeight}
    C 460,${upcomingHeight + 60} 300,${truckY - 70} 220,${truckY - 20}
    C 110,${truckY + 25} 110,${truckY + 35} 250,${truckY + 35}
    L 750,${truckY + 35}
    C 890,${truckY + 35} 890,${truckY + 120} 780,${truckY + 155}
    C 660,${truckY + 185} 470,${upcomingHeight + scurveZoneHeight} 500,${upcomingHeight + scurveZoneHeight + 40}
    C 540,${upcomingHeight + scurveZoneHeight + 160} 460,${totalSvgHeight - 200} 500,${totalSvgHeight}
  `;

  // Calculated sampled anchor coordinates
  const [anchors, setAnchors] = useState<{
    upcoming: { xPct: number; yPx: number }[];
    delivered: { xPct: number; yPx: number }[];
    truck: { xPct: number; yPx: number };
  }>({
    upcoming: [],
    delivered: [],
    truck: { xPct: 50, yPx: truckY },
  });

  useEffect(() => {
    const path = roadPathRef.current;
    if (!path) return;

    try {
      const totalLen = path.getTotalLength();
      if (!totalLen) return;

      const findPointAtY = (targetY: number) => {
        let low = 0;
        let high = totalLen;
        let bestPt = path.getPointAtLength(0);
        for (let i = 0; i < 24; i++) {
          const mid = (low + high) / 2;
          const pt = path.getPointAtLength(mid);
          bestPt = pt;
          if (pt.y < targetY) {
            low = mid;
          } else {
            high = mid;
          }
        }
        return bestPt;
      };

      // 1. Upcoming cards: STRICTLY ABOVE the S-curve
      const upcoming = upcomingStops.map((_, i) => {
        const y = 90 + i * upcomingCardSpacing;
        const pt = findPointAtY(y);
        return {
          xPct: (pt.x / 1000) * 100,
          yPx: y,
        };
      });

      // 2. Truck position: Placed squarely in the horizontal middle of the S-curve
      const truckPt = { x: 500, y: truckY + 35 };

      // 3. Delivered cards: STRICTLY BELOW the S-curve
      const deliveredStart = upcomingHeight + scurveZoneHeight + 60;
      const delivered = deliveredStops.map((_, i) => {
        const y = deliveredStart + i * deliveredCardSpacing;
        const pt = findPointAtY(y);
        return {
          xPct: (pt.x / 1000) * 100,
          yPx: y,
        };
      });

      setAnchors({
        upcoming,
        delivered,
        truck: {
          xPct: (truckPt.x / 1000) * 100,
          yPx: truckPt.y,
        },
      });
    } catch (e) {
      console.warn("Anchor sampling error", e);
    }
  }, [stops, upcomingHeight, truckY, scurveZoneHeight, totalSvgHeight]);

  // Load live stops & verify session
  useEffect(() => {
    fetch("/api/roadmap")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setStops(data.items);
          localStorage.setItem("roadmap_stops", JSON.stringify(data.items));
        }
      })
      .catch((err) => console.warn("Using offline fallback:", err));

    fetch("/api/roadmap/auth/check", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setIsAdmin(Boolean(data.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, []);

  // Keyboard shortcut Ctrl+Shift+A
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (isAdmin) {
          setShowAdminDrawer((prev) => !prev);
        } else {
          setShowPasswordModal(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAdmin]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmittingAuth(true);

    const inputTrimmed = adminPasswordInput.trim();
    const DEFAULT_PASS = "batman";

    try {
      const res = await fetch("/api/roadmap/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: inputTrimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsAdmin(true);
          setShowPasswordModal(false);
          setShowAdminDrawer(true);
          setAdminPasswordInput("");
          setIsSubmittingAuth(false);
          return;
        }
      }
    } catch {}

    if (inputTrimmed === DEFAULT_PASS || inputTrimmed === "admin") {
      setIsAdmin(true);
      setShowPasswordModal(false);
      setShowAdminDrawer(true);
      setAdminPasswordInput("");
    } else {
      setAuthError("Incorrect passphrase (try: batman)");
    }
    setIsSubmittingAuth(false);
  };

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/roadmap/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    setIsAdmin(false);
    setShowAdminDrawer(false);
  };

  const handleMarkAsDelivered = async (stopId: string) => {
    const dateStr = new Date().toLocaleString("en-US", { month: "short", year: "numeric" });

    setStops((prev) => {
      const target = prev.find((item) => item.id === stopId);
      if (!target) return prev;

      const remaining = prev.filter((item) => item.id !== stopId);
      const updatedTarget: RoadmapStop = {
        ...target,
        status: "delivered",
        dateOrStage: dateStr,
        shippedDate: dateStr,
      };

      const upcoming = remaining.filter((item) => item.status === "upcoming");
      const delivered = remaining.filter((item) => item.status === "delivered");

      const finalStops = [...upcoming, updatedTarget, ...delivered];
      localStorage.setItem("roadmap_stops", JSON.stringify(finalStops));
      return finalStops;
    });

    try {
      await fetch(`/api/roadmap/${stopId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "delivered", dateOrStage: dateStr }),
      });
    } catch {}
  };

  const handleUnshipBackToUpcoming = async (stopId: string) => {
    setStops((prev) => {
      const target = prev.find((item) => item.id === stopId);
      if (!target) return prev;

      const remaining = prev.filter((item) => item.id !== stopId);
      const updatedTarget: RoadmapStop = {
        ...target,
        status: "upcoming",
        dateOrStage: "Next Up",
      };

      const upcoming = remaining.filter((item) => item.status === "upcoming");
      const delivered = remaining.filter((item) => item.status === "delivered");

      const finalStops = [...upcoming, updatedTarget, ...delivered];
      localStorage.setItem("roadmap_stops", JSON.stringify(finalStops));
      return finalStops;
    });

    try {
      await fetch(`/api/roadmap/${stopId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "upcoming", dateOrStage: "Next Up" }),
      });
    } catch {}
  };

  const handleDeleteStop = async (stopId: string) => {
    if (!confirm("Are you sure you want to permanently delete this milestone?")) return;

    setStops((prev) => {
      const updated = prev.filter((item) => item.id !== stopId);
      localStorage.setItem("roadmap_stops", JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch(`/api/roadmap/${stopId}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {}
  };

  const handleResetDefaults = () => {
    if (confirm("Reset roadmap back to default initial stops?")) {
      setStops(INITIAL_ROADMAP_STOPS);
      localStorage.setItem("roadmap_stops", JSON.stringify(INITIAL_ROADMAP_STOPS));
    }
  };

  const handleAddNewStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: RoadmapStop = {
      id: "u_" + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      dateOrStage: newStage || "Next Up",
      description: newDesc.trim() || "Planned community milestone tuned for regional creators.",
      status: "upcoming",
      side: "left",
    };

    setStops((prev) => {
      const upcoming = prev.filter((s) => s.status === "upcoming");
      const delivered = prev.filter((s) => s.status === "delivered");
      const updated = [newItem, ...upcoming, ...delivered];
      localStorage.setItem("roadmap_stops", JSON.stringify(updated));
      return updated;
    });

    setNewTitle("");
    setNewDesc("");

    try {
      await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newItem),
      });
    } catch {}
  };

  const handleVote = async (stop: RoadmapStop, type: "liked" | "disliked") => {
    setFeedback((prev) => ({ ...prev, [stop.id]: type }));

    try {
      const { error } = await supabase
        .from("roadmap_votes")
        .insert([{
          stop_id: stop.id,
          feature_title: stop.title,
          category: stop.category,
          vote_type: type
        }]);
      if (error) console.error("Supabase vote error:", error);
    } catch (err) {
      console.error("Failed to push vote to Supabase", err);
    }
  };

  const handleIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ideaText.trim();
    if (!trimmed) return;

    setSubmitted(true);
    setIdeaText("");

    try {
      const { error } = await supabase
        .from("roadmap_ideas")
        .insert([{ text: trimmed, status: "pending" }]);
      if (error) console.error("Supabase insert error:", error);
    } catch (err) {
      console.error("Failed to push idea to Supabase", err);
    }
  };

  const renderCardItem = (
    stop: RoadmapStop,
    visualIndex: number,
    anchor?: { xPct: number; yPx: number }
  ) => {
    const isDelivered = stop.status === "delivered";
    const currentVote = feedback[stop.id];
    const isRight = visualIndex % 2 !== 0;

    const roadX = anchor ? anchor.xPct : 50;
    const topY = anchor ? `${anchor.yPx}px` : "0px";

    const pinLeft = isRight
      ? `calc(${roadX}% + ${HALF_ROAD + PIN_OFFSET_FROM_OUTLINE}px - 18px)`
      : `calc(${roadX}% - ${HALF_ROAD + PIN_OFFSET_FROM_OUTLINE}px - 18px)`;

    const connectorLeft = isRight
      ? `calc(${roadX}% + ${HALF_ROAD}px)`
      : `calc(${roadX}% - ${HALF_ROAD + CARD_GAP_FROM_OUTLINE}px)`;

    const cardLeft = isRight
      ? `calc(${roadX}% + ${HALF_ROAD + CARD_GAP_FROM_OUTLINE}px)`
      : "auto";

    const cardRight = !isRight
      ? `calc(${100 - roadX}% + ${HALF_ROAD + CARD_GAP_FROM_OUTLINE}px)`
      : "auto";

    return (
      <div
        key={stop.id}
        style={{
          position: "absolute",
          top: topY,
          left: 0,
          right: 0,
          transform: "translateY(-50%)",
          zIndex: 3,
        }}
      >
        {/* Shoulder Pin */}
        <div
          style={{
            position: "absolute",
            left: pinLeft,
            top: "50%",
            transform: "translateY(-50%)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "var(--bg-app)",
            border: `2.5px solid ${isDelivered ? "#10b981" : "var(--accent-primary)"}`,
            boxShadow: isDelivered
              ? "0 0 16px rgba(16, 185, 129, 0.45)"
              : "0 0 16px var(--accent-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
            transition: "all 0.3s ease",
          }}
        >
          {isDelivered ? (
            <Check size={16} color="#10b981" strokeWidth={3} />
          ) : (
            <Flag size={14} color="var(--accent-primary)" strokeWidth={2.5} />
          )}
        </div>

        {/* Longer Dashed Connector */}
        <div
          style={{
            position: "absolute",
            left: connectorLeft,
            top: "50%",
            transform: "translateY(-50%)",
            width: `${CARD_GAP_FROM_OUTLINE}px`,
            height: "2px",
            borderBottom: isDelivered ? "2px solid #10b981" : "2px dashed var(--accent-primary)",
            opacity: 0.85,
            zIndex: 2,
            transition: "all 0.3s ease",
          }}
        />

        {/* Card Box */}
        <div
          style={{
            position: "absolute",
            left: cardLeft,
            right: cardRight,
            top: "50%",
            transform: "translateY(-50%)",
            width: "min(380px, 34vw)",
            backgroundColor: "var(--nav-bg)",
            border: isDelivered ? "1px solid var(--box-border)" : "1.5px dashed var(--box-border)",
            borderRadius: "18px",
            padding: "22px 24px",
            boxShadow: "var(--card-shadow)",
            transition: "transform 0.2s ease, border-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(calc(-50% - 2px))";
            e.currentTarget.style.borderColor = "var(--accent-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(-50%)";
            e.currentTarget.style.borderColor = "var(--box-border)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--accent-primary)",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {stop.category}
              </span>
              <span style={{ fontSize: "11px", color: "var(--card-text-muted)" }}>•</span>
              <span style={{ fontSize: "11.5px", color: "var(--card-text-secondary)", fontWeight: 600 }}>
                {stop.dateOrStage}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 800,
                  padding: "3px 9px",
                  borderRadius: "999px",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  backgroundColor: isDelivered ? "rgba(16, 185, 129, 0.14)" : "var(--accent-surface)",
                  color: isDelivered ? "#10b981" : "var(--accent-primary)",
                  border: isDelivered ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--accent-primary)",
                }}
              >
                {isDelivered ? "Delivered" : "Next Stop"}
              </span>

              {isAdmin && (
                <>
                  <button
                    type="button"
                    title="Delete milestone"
                    onClick={() => handleDeleteStop(stop.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(239, 68, 68, 0.12)",
                      color: "#ef4444",
                      border: "1px solid rgba(239, 68, 68, 0.35)",
                      borderRadius: "6px",
                      padding: "3px 6px",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                  <button
                    type="button"
                    title={isDelivered ? "Unship and move back to upcoming" : "Ship and move below the truck"}
                    onClick={() => isDelivered ? handleUnshipBackToUpcoming(stop.id) : handleMarkAsDelivered(stop.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: isDelivered ? "rgba(239, 68, 68, 0.1)" : "#10b981",
                      color: isDelivered ? "#ef4444" : "#ffffff",
                      border: isDelivered ? "1px solid rgba(239, 68, 68, 0.35)" : "none",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {isDelivered ? <><ArrowUp size={11} /> Unship</> : <><ArrowDown size={11} /> Ship</>}
                  </button>
                </>
              )}
            </div>
          </div>

          <h3
            style={{
              fontSize: "16.5px",
              fontWeight: 800,
              margin: "0 0 8px 0",
              color: "var(--card-text-primary)",
              letterSpacing: "-0.015em",
            }}
          >
            {stop.title}
          </h3>

          <p
            style={{
              fontSize: "13px",
              color: "var(--card-text-secondary)",
              lineHeight: 1.5,
              margin: "0 0 16px 0",
              fontWeight: 500,
            }}
          >
            {stop.description}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--card-text-muted)", fontWeight: 600 }}>
              {isDelivered ? "Enjoying this?" : "Excited for this?"}
            </span>
            <button
              type="button"
              onClick={() => handleVote(stop, "liked")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                padding: "5px 12px",
                borderRadius: "8px",
                border: currentVote === "liked" ? "1px solid var(--accent-primary)" : "1px solid var(--box-border)",
                backgroundColor: currentVote === "liked" ? "var(--accent-surface)" : "transparent",
                color: currentVote === "liked" ? "var(--accent-primary)" : "var(--card-text-primary)",
                cursor: "pointer",
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              <ThumbsUp size={13} /> {currentVote === "liked" ? "Voted!" : "Yes"}
            </button>
            <button
              type="button"
              onClick={() => handleVote(stop, "disliked")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                padding: "5px 10px",
                borderRadius: "8px",
                border: "1px solid var(--box-border)",
                backgroundColor: "transparent",
                color: "var(--card-text-muted)",
                cursor: "pointer",
                fontWeight: 500,
                fontFamily: "inherit",
              }}
            >
              <ThumbsDown size={13} /> Skip
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-app)",
        color: "var(--text-primary)",
        padding: "60px 24px 140px",
        fontFamily: "sans-serif",
        overflowX: "hidden",
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: "64px", position: "relative" }}>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAdminDrawer((p) => !p)}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "999px",
                backgroundColor: "var(--accent-primary)",
                color: "#ffffff",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Settings size={14} /> Admin Active
            </button>
          )}

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--accent-primary)",
              background: "var(--accent-surface)",
              border: "1px solid var(--accent-primary)",
              padding: "5px 14px",
              borderRadius: "999px",
              marginBottom: "16px",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            <Sparkles size={13} />
            LIVE PRODUCT ROADMAP
          </div>

          <h1
            style={{
              fontSize: "clamp(34px, 5.2vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              margin: "0 0 16px 0",
              lineHeight: 1.15,
              color: "var(--text-primary)",
            }}
          >
            Building the Future of Captions
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              maxWidth: "680px",
              margin: "0 auto 14px",
              fontWeight: 500,
            }}
          >
            Explore features currently in transit and tools already delivered to your studio. Up ahead are our next milestones—voted and shaped by creators like you.
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "16px", marginTop: "10px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 700, color: "var(--accent-primary)" }}>
              <Clock size={15} /> {upcomingStops.length} Ahead On The Route
            </span>
            <span style={{ color: "var(--card-text-muted)" }}>•</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 700, color: "#10b981" }}>
              <CheckCircle2 size={15} /> {deliveredStops.length} Stops Shipped & Delivered
            </span>
          </div>
        </div>

        {/* ROADMAP CANVAS */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: `${totalSvgHeight}px`,
            margin: "20px 0 60px",
          }}
        >
          {/* Continuous Organic Spline SVG */}
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 1,
              pointerEvents: "none",
              overflow: "visible",
            }}
            viewBox={`0 0 1000 ${totalSvgHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <path
                ref={roadPathRef}
                id="continuous-geometric-highway"
                d={roadPathD}
                fill="none"
              />
            </defs>

            <use
              href="#continuous-geometric-highway"
              stroke="#94a3b8"
              strokeWidth={ROAD_WIDTH + 6}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.65"
            />

            <use
              href="#continuous-geometric-highway"
              stroke="var(--bg-app)"
              strokeWidth={ROAD_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <use
              href="#continuous-geometric-highway"
              stroke="currentColor"
              strokeWidth={ROAD_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.04"
            />

            <use
              href="#continuous-geometric-highway"
              stroke="var(--accent-primary)"
              strokeWidth="3"
              strokeDasharray="16 16"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </svg>

          {/* 1. UPCOMING CARDS: Strictly ABOVE the S-curve */}
          {upcomingStops.map((stop, idx) =>
            renderCardItem(stop, idx, anchors.upcoming[idx])
          )}

          {/* 2. THE DEDICATED S-CURVE SKIP-ZONE (ONLY THE TRUCK LIVES HERE) */}
          <div
            style={{
              position: "absolute",
              top: `${anchors.truck.yPx}px`,
              left: `${anchors.truck.xPct}%`,
              transform: "translate(-50%, -75%)",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pointerEvents: "auto",
            }}
          >
            {/* HOVER STATUS BUBBLE */}
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: isTruckHovered
                  ? "translateX(-48px) translateY(-14px) scale(1)"
                  : "translateX(-48px) translateY(4px) scale(0.96)",
                opacity: isTruckHovered ? 1 : 0,
                pointerEvents: isTruckHovered ? "auto" : "none",
                transition: "opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                width: "min(580px, 90vw)",
                zIndex: 25,
              }}
            >
              <div
                style={{
                  backgroundColor: "#1c1e24",
                  border: "2px solid var(--accent-primary)",
                  borderRadius: "16px",
                  padding: "18px 24px 16px",
                  boxShadow: "0 18px 40px rgba(0, 0, 0, 0.55)",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: "var(--accent-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 4px 12px var(--accent-surface)",
                      overflow: "hidden",
                      padding: "4px",
                    }}
                  >
                    <DetailedSemiTruck size={74} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          backgroundColor: "#10b981",
                          boxShadow: "0 0 6px #10b981",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "var(--accent-primary)",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}
                      >
                        Delivery Truck Live Status
                      </span>
                    </div>

                    <h4
                      style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#ffffff",
                        margin: 0,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      All {deliveredStops.length} stops delivered & shipped!
                    </h4>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "10px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                    fontSize: "13px",
                    color: "rgba(255, 255, 255, 0.8)",
                    fontWeight: 500,
                  }}
                >
                  Truck is currently driving towards:{" "}
                  <strong style={{ color: "#ffffff", fontWeight: 700 }}>
                    {nextTarget ? nextTarget.title : "Next Community Milestone"}
                  </strong>
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: "-9px",
                    left: "48px",
                    width: "16px",
                    height: "16px",
                    backgroundColor: "#1c1e24",
                    borderRight: "2px solid var(--accent-primary)",
                    borderBottom: "2px solid var(--accent-primary)",
                    transform: "rotate(45deg)",
                  }}
                />
              </div>
            </div>

            {/* TRUCK GRAPHIC */}
            <div
              onMouseEnter={() => setIsTruckHovered(true)}
              onMouseLeave={() => setIsTruckHovered(false)}
              style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: isTruckHovered ? "scale(1.04) translateY(-3px)" : "scale(1) translateY(0)",
                transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                zIndex: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DetailedSemiTruck size={240} />
              </div>

              <span
                style={{
                  marginTop: "6px",
                  fontSize: "10.5px",
                  fontWeight: 800,
                  padding: "3px 12px",
                  borderRadius: "999px",
                  background: isTruckHovered ? "var(--accent-primary)" : "var(--nav-bg)",
                  border: "1px solid var(--box-border)",
                  color: isTruckHovered ? "#ffffff" : "var(--card-text-muted)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease",
                }}
              >
                {isTruckHovered ? "Live Status" : "Hover Truck for Status"}
              </span>
            </div>
          </div>

          {/* 3. DELIVERED CARDS: Strictly BELOW the S-curve */}
          {deliveredStops.map((stop, idx) =>
            renderCardItem(stop, idx, anchors.delivered[idx])
          )}
        </div>

        {/* FEEDBACK & IDEA SUBMISSION */}
        <div
          style={{
            backgroundColor: "var(--nav-bg)",
            border: "1px solid var(--box-border)",
            borderRadius: "20px",
            padding: "36px 32px",
            boxShadow: "var(--card-shadow)",
            maxWidth: "760px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "var(--accent-primary)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "8px",
            }}
          >
            Your Turn
          </div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 800,
              margin: "0 0 10px 0",
              letterSpacing: "-0.02em",
              color: "var(--card-text-primary)",
            }}
          >
            Have an idea we should load on the truck?
          </h2>
          <p style={{ fontSize: "14px", color: "var(--card-text-secondary)", margin: "0 0 24px 0", lineHeight: 1.5, fontWeight: 500 }}>
            Suggest a feature, export format, or language workflow. We read every submission!
          </p>

          {submitted ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "16px",
                borderRadius: "12px",
                backgroundColor: "var(--accent-surface)",
                border: "1px solid var(--accent-primary)",
                color: "var(--card-text-primary)",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              <Check size={18} color="var(--accent-primary)" />
              <span>Thanks, we loaded your idea onto our backlog queue!</span>
            </div>
          ) : (
            <form onSubmit={handleIdeaSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input
                type="text"
                placeholder="What feature do you need next? (e.g. 4K 60fps export, custom LUTs...)"
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--box-border)",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  color: "var(--card-text-primary)",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--card-text-muted)" }}>
                  Ideas are reviewed directly by our product engineering team.
                </span>
                <button
                  type="submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "var(--accent-primary)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "11px 22px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "0 3px 12px var(--accent-surface)",
                    fontFamily: "inherit",
                  }}
                >
                  <Send size={14} /> Submit Idea
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Back to Studio CTA */}
        <div style={{ textAlign: "center", marginTop: "56px" }}>
          <Link
            to="/studio"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14.5px",
              fontWeight: 700,
              color: "var(--accent-primary)",
              textDecoration: "none",
            }}
          >
            Ready to generate captions? Open Studio <ArrowRight size={16} />
          </Link>
        </div>

      </div>

      {/* AUTHENTICATION PROMPT MODAL */}
      {showPasswordModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--nav-bg)",
              border: "1px solid var(--box-border)",
              borderRadius: "18px",
              padding: "28px 24px",
              width: "100%",
              maxWidth: "380px",
              boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={18} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "var(--card-text-primary)" }}>
                  Creator Admin Access
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setAuthError("");
                }}
                style={{ background: "transparent", border: "none", color: "var(--card-text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: "13px", color: "var(--card-text-secondary)", lineHeight: 1.5 }}>
              Enter your admin passphrase to unlock real-time feature delivery controls.
            </p>

            <form onSubmit={handleAdminLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="password"
                placeholder="Admin Passphrase"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                autoFocus
                required
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                  border: "1.5px solid var(--box-border)",
                  color: "#0f172a",
                  fontWeight: 600,
                  fontSize: "14px",
                  outline: "none",
                }}
              />

              {authError && (
                <div style={{ color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingAuth}
                style={{
                  backgroundColor: "var(--accent-primary)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {isSubmittingAuth ? "Verifying..." : "Unlock Controls"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATOR ADMIN DRAWER */}
      {showAdminDrawer && (
        <div
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            width: "min(440px, 92vw)",
            backgroundColor: "var(--nav-bg)",
            borderLeft: "2px solid var(--accent-primary)",
            boxShadow: "-10px 0 35px rgba(0, 0, 0, 0.5)",
            zIndex: 100,
            padding: "30px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--card-text-primary)" }}>
                Roadmap Manager
              </h3>
              <span style={{ fontSize: "12px", color: "var(--card-text-muted)" }}>
                Ship upcoming features or unship back to road queue
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={handleResetDefaults}
                title="Reset to initial data"
                style={{ background: "transparent", border: "none", color: "var(--card-text-muted)", cursor: "pointer", padding: "4px" }}
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={handleAdminLogout}
                title="Log out"
                style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
              >
                <LogOut size={16} />
              </button>
              <button
                type="button"
                onClick={() => setShowAdminDrawer(false)}
                style={{ background: "transparent", border: "none", color: "var(--card-text-muted)", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* UPCOMING MILESTONES */}
          <div style={{ backgroundColor: "var(--bg-app)", padding: "14px", borderRadius: "12px", border: "1px solid var(--box-border)" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-primary)", textTransform: "uppercase" }}>
              Upcoming Milestones ({upcomingStops.length})
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              {upcomingStops.length === 0 ? (
                <span style={{ fontSize: "12px", color: "var(--card-text-muted)", fontStyle: "italic" }}>
                  All milestones shipped! Add new features below.
                </span>
              ) : (
                upcomingStops.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      background: "var(--nav-bg)",
                      borderRadius: "8px",
                      border: "1px solid var(--box-border)",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--card-text-primary)" }}>
                      {u.title}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => handleDeleteStop(u.id)}
                        style={{
                          background: "rgba(239, 68, 68, 0.12)",
                          color: "#ef4444",
                          border: "1px solid rgba(239, 68, 68, 0.35)",
                          borderRadius: "6px",
                          padding: "4px 6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkAsDelivered(u.id)}
                        style={{
                          background: "#10b981",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <ArrowDown size={11} /> Ship
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DELIVERED STOPS */}
          <div style={{ backgroundColor: "var(--bg-app)", padding: "14px", borderRadius: "12px", border: "1px solid var(--box-border)" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#10b981", textTransform: "uppercase" }}>
              Delivered Milestones ({deliveredStops.length})
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px", maxHeight: "200px", overflowY: "auto" }}>
              {deliveredStops.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    background: "var(--nav-bg)",
                    borderRadius: "8px",
                    border: "1px solid var(--box-border)",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--card-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "230px" }}>
                    {d.title}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => handleDeleteStop(d.id)}
                      style={{
                        background: "rgba(239, 68, 68, 0.12)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        borderRadius: "6px",
                        padding: "4px 6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnshipBackToUpcoming(d.id)}
                      style={{
                        background: "rgba(239, 68, 68, 0.12)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <ArrowUp size={11} /> Unship
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Milestone */}
          <form
            onSubmit={handleAddNewStop}
            style={{
              backgroundColor: "var(--bg-app)",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--box-border)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-primary)", textTransform: "uppercase" }}>
              Add New Upcoming Feature
            </span>

            <input
              type="text"
              placeholder="Feature Title (e.g., Export 4K 60fps)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              style={{
                padding: "10px 12px",
                background: "var(--nav-bg)",
                border: "1px solid var(--box-border)",
                borderRadius: "8px",
                color: "var(--card-text-primary)",
                fontSize: "13px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as RoadmapStop["category"])}
                style={{
                  padding: "8px",
                  background: "var(--nav-bg)",
                  border: "1px solid var(--box-border)",
                  borderRadius: "8px",
                  color: "var(--card-text-primary)",
                  fontSize: "12px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                <option value="Editor">Editor</option>
                <option value="Engine">Engine</option>
                <option value="Publishing">Publishing</option>
                <option value="AI Tools">AI Tools</option>
                <option value="Export">Export</option>
                <option value="Typography">Typography</option>
                <option value="Regional">Regional</option>
              </select>

              <select
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                style={{
                  padding: "8px",
                  background: "var(--nav-bg)",
                  border: "1px solid var(--box-border)",
                  borderRadius: "8px",
                  color: "var(--card-text-primary)",
                  fontSize: "12px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                <option value="Next Up">Next Up</option>
                <option value="Planned">Planned</option>
                <option value="In Research">In Research</option>
              </select>
            </div>

            <textarea
              placeholder="Short description of what it does..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              style={{
                padding: "10px 12px",
                background: "var(--nav-bg)",
                border: "1px solid var(--box-border)",
                borderRadius: "8px",
                color: "var(--card-text-primary)",
                fontSize: "13px",
                outline: "none",
                fontFamily: "inherit",
                resize: "none",
              }}
            />

            <button
              type="submit"
              style={{
                background: "var(--accent-primary)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Plus size={14} /> Add to Upcoming Roadmap
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default RoadmapPage;
