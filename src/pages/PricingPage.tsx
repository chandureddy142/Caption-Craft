import React, { useState } from "react";
import { Check, Lock, Sparkles } from "lucide-react";
import { PLANS, WEEKLY_PLAN, type BillingCycle, type Plan } from "../config/plans";

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");

  const handleSelectPlan = (planId: string) => {
    console.log(`Selected plan: ${planId} on ${billingCycle} billing`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-app)",
        color: "var(--text-primary)",
        padding: "64px 24px 120px",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      {/* Invisible scrollbar utility */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* Hero Header */}
      <div style={{ textAlign: "center", maxWidth: "860px", margin: "0 auto 52px auto" }}>
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
            marginBottom: "18px",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          <Sparkles size={14} />
          Creator-First Pricing
        </div>

        <h1
          style={{
            fontSize: "clamp(34px, 5.5vw, 50px)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            margin: "0 0 16px 0",
            lineHeight: 1.15,
            color: "var(--text-primary)",
          }}
        >
          Simple Plans for Every Stage of Growth
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            margin: "0 auto",
            maxWidth: "620px",
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          Accessible pricing built specifically for Indian short-form video creators, reel editors, and YouTube channels.
        </p>

        {/* Billing cycle pill selector */}
        <div
          style={{
            display: "inline-flex",
            marginTop: "32px",
            backgroundColor: "var(--nav-bg)",
            padding: "5px",
            borderRadius: "999px",
            border: "1px solid var(--box-border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <button
            type="button"
            onClick={() => setBillingCycle("weekly")}
            style={{
              padding: "9px 24px",
              borderRadius: "999px",
              border: "none",
              backgroundColor: billingCycle === "weekly" ? "var(--accent-primary)" : "transparent",
              color: billingCycle === "weekly" ? "#ffffff" : "var(--card-text-primary)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.18s ease",
              fontFamily: "inherit",
            }}
          >
            Weekly
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            style={{
              padding: "9px 24px",
              borderRadius: "999px",
              border: "none",
              backgroundColor: billingCycle === "monthly" ? "var(--accent-primary)" : "transparent",
              color: billingCycle === "monthly" ? "#ffffff" : "var(--card-text-primary)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.18s ease",
              fontFamily: "inherit",
            }}
          >
            Monthly
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            style={{
              padding: "9px 24px",
              borderRadius: "999px",
              border: "none",
              backgroundColor: billingCycle === "yearly" ? "var(--accent-primary)" : "transparent",
              color: billingCycle === "yearly" ? "#ffffff" : "var(--card-text-primary)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.18s ease",
              fontFamily: "inherit",
            }}
          >
            <span>Yearly</span>
            <span
              style={{
                fontSize: "10.5px",
                backgroundColor: billingCycle === "yearly" ? "rgba(0, 0, 0, 0.22)" : "var(--accent-surface)",
                color: billingCycle === "yearly" ? "#fef08a" : "var(--accent-primary)",
                padding: "2px 8px",
                borderRadius: "12px",
                fontWeight: 800,
                letterSpacing: "0.02em",
              }}
            >
              Save ~16%
            </span>
          </button>
        </div>
      </div>

      {billingCycle === "weekly" ? (
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <div
            style={{
              backgroundColor: "var(--nav-bg)",
              border: "2px solid var(--accent-primary)",
              borderRadius: "20px",
              padding: "40px 34px",
              boxShadow: "0 20px 40px var(--accent-surface)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-13px",
                right: "26px",
                backgroundColor: "var(--accent-primary)",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 800,
                padding: "4px 13px",
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 4px 12px var(--accent-surface)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <Sparkles size={12} />
              <span>{WEEKLY_PLAN.badge}</span>
            </div>

            <h3 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 6px 0", color: "var(--card-text-primary)", letterSpacing: "-0.02em" }}>
              {WEEKLY_PLAN.name}
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--card-text-secondary)", margin: "0 0 24px 0", minHeight: "38px", lineHeight: 1.5, fontWeight: 500 }}>
              {WEEKLY_PLAN.description}
            </p>

            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "26px" }}>
              <span style={{ fontSize: "3rem", fontWeight: 800, color: "var(--card-text-primary)", letterSpacing: "-0.03em" }}>
                ₹{WEEKLY_PLAN.weeklyPrice}
              </span>
              <span style={{ color: "var(--card-text-muted)", fontSize: "0.95rem", fontWeight: 600 }}>/ 7 days</span>
            </div>

            <button
              type="button"
              onClick={() => handleSelectPlan("weekly_pro")}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "12px",
                backgroundColor: "var(--accent-primary)",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                marginBottom: "30px",
                boxShadow: "0 4px 14px var(--accent-surface)",
                transition: "transform 0.15s ease, opacity 0.15s ease",
                fontFamily: "inherit",
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {WEEKLY_PLAN.ctaText}
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              {WEEKLY_PLAN.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.88rem", color: "var(--card-text-primary)" }}>
                  <Check size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: "2px" }} strokeWidth={2.5} />
                  <span style={{ lineHeight: 1.45, fontWeight: 500 }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(295px, 1fr))",
            gap: "24px",
            maxWidth: "1380px",
            margin: "0 auto",
          }}
        >
          {PLANS.map((plan: Plan) => {
            const isFree = plan.monthlyPrice === 0;
            const isYearly = billingCycle === "yearly";
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const originalYearlyVal = plan.monthlyPrice * 12;
            const savingsAmount = isYearly && !isFree ? originalYearlyVal - plan.yearlyPrice : 0;
            const priceSub = isFree
              ? "forever during beta"
              : isYearly
              ? `/ year (~₹${plan.yearlyMonthlyEquivalent}/mo)`
              : "/ month";

            // Only Pro and Max scroll; Starter and Lite remain fixed without scrolling
            const isScrollable = plan.id === "creator_pro" || plan.id === "studio_max";

            return (
              <div
                key={plan.id}
                style={{
                  backgroundColor: "var(--nav-bg)",
                  borderRadius: "20px",
                  padding: "34px 26px",
                  border: plan.isPopular
                    ? "2px solid var(--accent-primary)"
                    : "1px solid var(--box-border)",
                  boxShadow: plan.isPopular
                    ? "0 14px 34px var(--accent-surface)"
                    : "var(--card-shadow)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  transition: "transform 0.18s ease, border-color 0.18s ease",
                }}
              >
                {plan.badge && (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: plan.isPopular ? "var(--accent-primary)" : "var(--accent-surface)",
                      color: plan.isPopular ? "#ffffff" : "var(--accent-primary)",
                      border: plan.isPopular ? "none" : "1px solid var(--box-border)",
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "4px 12px",
                      borderRadius: "999px",
                      marginBottom: "16px",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                <h3 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0 0 6px 0", color: "var(--card-text-primary)", letterSpacing: "-0.02em" }}>
                  {plan.name}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--card-text-secondary)",
                    margin: "0 0 20px 0",
                    minHeight: "40px",
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  {plan.description}
                </p>

                {/* Strikethrough & Savings Tag (Yearly only) */}
                {isYearly && !isFree && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{
                      fontSize: "1.05rem",
                      fontWeight: 600,
                      color: "var(--card-text-muted)",
                      textDecoration: "line-through",
                      opacity: 0.75,
                    }}>
                      ₹{originalYearlyVal}
                    </span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#10b981",
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      letterSpacing: "0.02em"
                    }}>
                      SAVE ₹{savingsAmount}
                    </span>
                  </div>
                )}

                {/* Active Price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "22px" }}>
                  <span style={{ fontSize: "2.6rem", fontWeight: 800, color: "var(--card-text-primary)", letterSpacing: "-0.03em" }}>
                    ₹{price}
                  </span>
                  <span style={{ color: "var(--card-text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>{priceSub}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "11px",
                    backgroundColor: plan.isPopular
                      ? "var(--accent-primary)"
                      : isFree
                      ? "var(--accent-surface)"
                      : "var(--bg-surface-elevated, #232836)",
                    color: plan.isPopular ? "#ffffff" : "var(--card-text-primary)",
                    border: plan.isPopular ? "none" : "1px solid var(--box-border)",
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    cursor: "pointer",
                    marginBottom: "26px",
                    boxShadow: plan.isPopular ? "0 4px 14px var(--accent-surface)" : "none",
                    transition: "all 0.15s ease",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={e => {
                    if (plan.isPopular) e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    if (plan.isPopular) e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {plan.ctaText}
                </button>

                {/* Feature List: Fixed for Starter/Lite, invisible scroll for Pro/Max */}
                <div
                  className={isScrollable ? "no-scrollbar" : undefined}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "13px",
                    marginTop: "12px",
                    ...(isScrollable
                      ? {
                          maxHeight: "390px",
                          overflowY: "auto",
                        }
                      : {}),
                  }}
                >
                  {plan.features.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        fontSize: "0.85rem",
                        color: f.isLocked ? "var(--card-text-muted)" : "var(--card-text-primary)",
                      }}
                    >
                      {f.isLocked ? (
                        <Lock size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                      ) : (
                        <Check size={15} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} strokeWidth={2.5} />
                      )}
                      <span style={{ lineHeight: 1.45, fontWeight: f.isLocked ? 400 : 500 }}>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PricingPage;
