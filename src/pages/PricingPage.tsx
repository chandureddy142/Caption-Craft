import type { ReactElement } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";

type BillingCycle = "monthly" | "yearly";

interface PricingTier {
  name: string;
  badge?: string;
  badgeColor?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  desc: string;
  isPopular?: boolean;
  status: "active" | "coming_soon";
  features: string[];
  ctaText: string;
}

const TIERS: ReadonlyArray<PricingTier> = [
  {
    name: "Starter",
    badge: "Active Now",
    badgeColor: "#3b82f6",
    monthlyPrice: 0,
    yearlyPrice: 0,
    desc: "Everything you need to create viral Telugu & Tenglish captions right now.",
    status: "active",
    features: [
      "Telugu, Tenglish & English captions",
      "Full access to 42+ kinetic templates",
      "Fast private in-browser Whisper transcription",
      "HD video export (no watermark)",
      "Interactive timeline & style fine-tuning",
    ],
    ctaText: "start creating free",
  },
  {
    name: "Creator Lite",
    badge: "Upcoming",
    badgeColor: "#38bdf8",
    monthlyPrice: 50,
    yearlyPrice: 499,
    desc: "For consistent reel creators looking for cloud saves and quick turnarounds.",
    status: "coming_soon",
    features: [
      "Everything in Starter",
      "Cloud project drafts (save & resume anywhere)",
      "1080p Full HD exports at 60fps",
      "AI punctuation & filler-word removal",
      "Standard cloud transliteration sync",
    ],
    ctaText: "available soon",
  },
  {
    name: "Viral Pro",
    badge: "Editor's Choice",
    badgeColor: "#3b82f6",
    monthlyPrice: 150,
    yearlyPrice: 1499,
    desc: "Our flagship toolkit for serious creators seeking maximum audience retention.",
    isPopular: true,
    status: "coming_soon",
    features: [
      "Everything in Creator Lite",
      "Custom brand fonts (.ttf/.otf) & palette kits",
      "Gemini AI priority Telugu ↔ Tenglish accuracy",
      "2K / 4K ultra-sharp video rendering",
      "Automatic audio cleanup & loudness leveling",
      "Exclusive kinetic motion presets",
    ],
    ctaText: "early access soon",
  },
  {
    name: "Studio Max",
    badge: "Teams",
    badgeColor: "#c084fc",
    monthlyPrice: 250,
    yearlyPrice: 2499,
    desc: "Power features for video editing agencies, brands, and multi-creator channels.",
    status: "coming_soon",
    features: [
      "Everything in Viral Pro",
      "Unlimited cloud drafts & revision history",
      "Multiple editor team seats & shared presets",
      "Batch reel captioning & fast queueing",
      "Priority feature requests & custom styles",
    ],
    ctaText: "early access soon",
  },
];

export default function PricingPage(): ReactElement {
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  return (
    <div style={{ minHeight: "100vh", background: "#050807", color: "#ecf2ee", padding: "54px 24px 96px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* Early Beta Notice Banner */}
        <div style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(56, 189, 248, 0.04) 100%)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: "16px",
          padding: "16px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          marginBottom: "48px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#3b82f6",
              boxShadow: "0 0 12px #3b82f6",
              display: "inline-block"
            }} />
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                100% Free Public Beta in Progress
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255, 255, 255, 0.65)" }}>
                Paid plans are currently in preview while we calibrate regional AI models. Every creator can use all features for free today.
              </p>
            </div>
          </div>
          <Link
            to="/studio"
            style={{
              background: "#3b82f6",
              color: "#ffffff",
              padding: "8px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.25)"
            }}
          >
            open studio for free →
          </Link>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#3b82f6" }}>
            creator friendly pricing
          </span>
          <h1 style={{ fontSize: "44px", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", margin: "10px 0 14px" }}>
            simple plans for every stage of growth
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.55)", maxWidth: "620px", margin: "0 auto", lineHeight: 1.6 }}>
            accessible pricing made specifically for indian reel and short-form video creators.
          </p>

          {/* Monthly / Yearly Billing Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginTop: "32px", padding: "6px 8px", background: "#0c110e", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "999px" }}>
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                background: billing === "monthly" ? "#3b82f6" : "transparent",
                color: billing === "monthly" ? "#050807" : "rgba(255, 255, 255, 0.7)",
                transition: "all 0.2s ease"
              }}
            >
              monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 20px",
                borderRadius: "999px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                background: billing === "yearly" ? "#3b82f6" : "transparent",
                color: billing === "yearly" ? "#050807" : "rgba(255, 255, 255, 0.7)",
                transition: "all 0.2s ease"
              }}
            >
              <span>yearly</span>
              <span style={{
                fontSize: "10px",
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: "999px",
                background: billing === "yearly" ? "#050807" : "rgba(59, 130, 246, 0.15)",
                color: billing === "yearly" ? "#3b82f6" : "#3b82f6"
              }}>
                save ~20%
              </span>
            </button>
          </div>
        </div>

        {/* Tiers Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "22px", alignItems: "stretch" }}>
          {TIERS.map(tier => {
            const isActiveTier = tier.status === "active";
            const price = tier.monthlyPrice === 0
              ? "₹0"
              : billing === "monthly"
              ? `₹${tier.monthlyPrice}`
              : `₹${tier.yearlyPrice}`;
            const period = tier.monthlyPrice === 0
              ? "forever during beta"
              : billing === "monthly"
              ? "/ month"
              : "/ year";

            return (
              <div
                key={tier.name}
                style={{
                  background: tier.isPopular ? "rgba(59, 130, 246, 0.04)" : "#0c110e",
                  border: tier.isPopular ? "2px solid rgba(59, 130, 246, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "20px",
                  padding: "32px 24px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: tier.isPopular ? "0 14px 40px rgba(59, 130, 246, 0.08)" : "none"
                }}
              >
                {/* Badge */}
                {tier.badge && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: tier.isPopular ? "#3b82f6" : "rgba(255, 255, 255, 0.08)",
                      color: tier.isPopular ? "#050807" : (tier.badgeColor || "#fff"),
                      letterSpacing: "0.02em"
                    }}>
                      {tier.badge}
                    </span>
                  </div>
                )}

                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>
                  {tier.name}
                </h2>
                <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", margin: "0 0 20px", minHeight: "36px", lineHeight: 1.5 }}>
                  {tier.desc}
                </p>

                {/* Price Display */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "38px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                    {price}
                  </span>
                  <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.45)" }}>
                    {period}
                  </span>
                </div>

                {/* Yearly Subtext */}
                {billing === "yearly" && tier.monthlyPrice > 0 && (
                  <div style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 600, marginBottom: "16px" }}>
                    just ~₹{Math.round(tier.yearlyPrice / 12)}/month billed annually
                  </div>
                )}
                {(billing === "monthly" || tier.monthlyPrice === 0) && (
                  <div style={{ height: "16px", marginBottom: "16px" }} />
                )}

                {/* Features List */}
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: "11px", flex: 1 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.4 }}>
                      <span style={{ color: "#3b82f6", fontWeight: 800, flexShrink: 0 }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Action CTA */}
                {isActiveTier ? (
                  <Link
                    to="/studio"
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "12px",
                      borderRadius: "12px",
                      textDecoration: "none",
                      fontSize: "13px",
                      fontWeight: 700,
                      background: "#3b82f6",
                      color: "#ffffff",
                      boxShadow: "0 0 20px rgba(59, 130, 246, 0.25)"
                    }}
                  >
                    {tier.ctaText} →
                  </Link>
                ) : (
                  <button
                    disabled
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: 600,
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      color: "rgba(255, 255, 255, 0.4)",
                      cursor: "not-allowed"
                    }}
                  >
                    {tier.ctaText}
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
