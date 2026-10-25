import React, { useState } from "react";
import { Check, Lock, Sparkles } from "lucide-react";
import { PLANS, WEEKLY_PLAN, type BillingCycle, type Plan } from "../config/plans";

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const handleSelectPlan = (planId: string) => {
    console.log(`Selected plan: ${planId} on ${billingCycle} billing`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-app)",
        color: "var(--text-primary)",
        padding: "60px 24px 120px",
        fontFamily: "Inter, -apple-system, sans-serif",
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "780px", margin: "0 auto 48px auto" }}>
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            margin: "0 0 16px 0",
            lineHeight: 1.15,
            color: "var(--text-primary)",
          }}
        >
          simple plans for every stage of growth
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          accessible pricing made specifically for indian reel and short-form video creators.
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
              padding: "8px 22px",
              borderRadius: "999px",
              border: "none",
              backgroundColor: billingCycle === "weekly" ? "var(--accent-primary)" : "transparent",
              color: billingCycle === "weekly" ? "#ffffff" : "var(--card-text-primary)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Weekly
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            style={{
              padding: "8px 22px",
              borderRadius: "999px",
              border: "none",
              backgroundColor: billingCycle === "monthly" ? "var(--accent-primary)" : "transparent",
              color: billingCycle === "monthly" ? "#ffffff" : "var(--card-text-primary)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Monthly
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            style={{
              padding: "8px 22px",
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
              transition: "all 0.15s ease",
            }}
          >
            <span>Yearly</span>
            <span
              style={{
                fontSize: "10px",
                backgroundColor: billingCycle === "yearly" ? "rgba(0, 0, 0, 0.25)" : "var(--accent-surface)",
                color: billingCycle === "yearly" ? "#fef08a" : "var(--accent-primary)",
                padding: "2px 7px",
                borderRadius: "10px",
                fontWeight: 700,
              }}
            >
              Save 15%
            </span>
          </button>
        </div>
      </div>

      {billingCycle === "weekly" ? (
        <div style={{ maxWidth: "460px", margin: "0 auto" }}>
          <div
            style={{
              backgroundColor: "var(--nav-bg)",
              border: "2px solid var(--accent-primary)",
              borderRadius: "16px",
              padding: "36px 30px",
              boxShadow: "0 20px 40px var(--accent-surface)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-12px",
                right: "24px",
                backgroundColor: "var(--accent-primary)",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: "0 4px 12px var(--accent-surface)",
              }}
            >
              <Sparkles size={12} />
              <span>{WEEKLY_PLAN.badge}</span>
            </div>

            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--card-text-primary)" }}>
              {WEEKLY_PLAN.name}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--card-text-secondary)", margin: "0 0 24px 0", minHeight: "38px", lineHeight: 1.5 }}>
              {WEEKLY_PLAN.description}
            </p>

            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "24px" }}>
              <span style={{ fontSize: "2.8rem", fontWeight: 800, color: "var(--card-text-primary)" }}>
                ₹{WEEKLY_PLAN.weeklyPrice}
              </span>
              <span style={{ color: "var(--card-text-muted)", fontSize: "0.95rem" }}>/ 7 days</span>
            </div>

            <button
              type="button"
              onClick={() => handleSelectPlan("weekly_pro")}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                backgroundColor: "var(--accent-primary)",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                fontSize: "0.92rem",
                cursor: "pointer",
                marginBottom: "28px",
                boxShadow: "0 4px 14px var(--accent-surface)",
                transition: "opacity 0.15s ease",
              }}
            >
              {WEEKLY_PLAN.ctaText}
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              {WEEKLY_PLAN.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.86rem", color: "var(--card-text-primary)" }}>
                  <Check size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "22px",
            maxWidth: "1240px",
            margin: "0 auto",
          }}
        >
          {PLANS.map((plan: Plan) => {
            const isFree = plan.monthlyPrice === 0;
            const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const priceSub = isFree
              ? "forever during beta"
              : billingCycle === "yearly"
              ? `/ year (~₹${plan.yearlyMonthlyEquivalent}/mo)`
              : "/ month";

            return (
              <div
                key={plan.id}
                style={{
                  backgroundColor: "var(--nav-bg)",
                  borderRadius: "16px",
                  padding: "30px 24px",
                  border: plan.isPopular
                    ? "2px solid var(--accent-primary)"
                    : "1px solid var(--box-border)",
                  boxShadow: plan.isPopular
                    ? "0 12px 30px var(--accent-surface)"
                    : "var(--card-shadow)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  transition: "transform 0.15s ease, border-color 0.15s ease",
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
                      fontWeight: 700,
                      padding: "3px 11px",
                      borderRadius: "999px",
                      marginBottom: "14px",
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--card-text-primary)" }}>
                  {plan.name}
                </h3>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--card-text-secondary)",
                    margin: "0 0 20px 0",
                    minHeight: "38px",
                    lineHeight: 1.5,
                  }}
                >
                  {plan.description}
                </p>

                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "22px" }}>
                  <span style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--card-text-primary)" }}>
                    ₹{price}
                  </span>
                  <span style={{ color: "var(--card-text-muted)", fontSize: "0.82rem" }}>{priceSub}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "9px",
                    backgroundColor: plan.isPopular
                      ? "var(--accent-primary)"
                      : isFree
                      ? "var(--accent-surface)"
                      : "var(--bg-surface-elevated, #232836)",
                    color: plan.isPopular ? "#ffffff" : "var(--card-text-primary)",
                    border: plan.isPopular ? "none" : "1px solid var(--box-border)",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    marginBottom: "24px",
                    boxShadow: plan.isPopular ? "0 4px 14px var(--accent-surface)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {plan.ctaText}
                </button>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "auto" }}>
                  {plan.features.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "9px",
                        fontSize: "0.82rem",
                        color: f.isLocked ? "var(--card-text-muted)" : "var(--card-text-primary)",
                      }}
                    >
                      {f.isLocked ? (
                        <Lock size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                      ) : (
                        <Check size={15} color="#34d399" style={{ flexShrink: 0, marginTop: "2px" }} />
                      )}
                      <span style={{ lineHeight: 1.4 }}>{f.text}</span>
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
