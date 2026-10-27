import React, { useState, useEffect, useRef } from "react";
import { Check, Lock, Sparkles, Minus, ChevronDown, ArrowRight } from "lucide-react";
import { PLANS, WEEKLY_PLAN, type BillingCycle, type Plan } from "../config/plans";

interface ComparisonRow {
  feature: string;
  free: string;
  creator: string;
  studio: string;
  weekly: string;
}

const COMPARISON_DATA: ComparisonRow[] = [
  { feature: "Captioning", free: "3 min a month", creator: "60 min a month", studio: "300 min a month", weekly: "15 min (7-Day Pass)" },
  { feature: "Watermark", free: "Small watermark", creator: "None", studio: "None", weekly: "None" },
  { feature: "Exports", free: "3 a month", creator: "Up to 30 a day", studio: "Unlimited while valid", weekly: "Unlimited (7 days)" },
  { feature: "Video uploads & formats", free: "720p WebM only", creator: "1080p, MP4, MOV & WebM", studio: "4K & 2K, MP4, MOV, WebM & MKV", weekly: "1080p MP4 & MOV" },
  { feature: "Export quality", free: "720p", creator: "1080p Full HD", studio: "4K & 2K Ultra HD", weekly: "1080p Full HD" },
  { feature: "Caption styles", free: "Classic styles", creator: "All 40+ Templates", studio: "All templates + custom branding", weekly: "All 40+ Templates" },
  { feature: "Background cuts per timeline", free: "Up to 3 cuts", creator: "Up to 30 cuts", studio: "Unlimited background cuts", weekly: "Up to 30 cuts" },
  { feature: "Custom photo & video uploads", free: "-", creator: "Yes", studio: "Yes", weekly: "Yes" },
  { feature: "SRT & VTT subtitle export", free: "-", creator: "Yes", studio: "Yes", weekly: "Yes" },
  { feature: "Safe area overlays (Reels & Shorts)", free: "-", creator: "Yes", studio: "Yes", weekly: "Yes" },
  { feature: "How you pay", free: "Free", creator: "₹99/mo or ₹999/yr", studio: "₹199/mo or ₹1999/yr", weekly: "₹29 one-time pass" },
];

const PRICING_FAQS = [
  { num: "01", question: "What counts as transcription time?", answer: "The duration of the audio or video you transcribe, not the number of exports. Re-exporting, tweaking styles, and re-styling captions on the same project as many times as you like costs nothing extra." },
  { num: "02", question: "What are Dynamic templates?", answer: "The 42+ templates in our Dynamic library: animated kinetic highlight fonts, neon glows, karaoke staggers, and safe area overlays built specifically for Telugu, Tenglish, and English short-form reels." },
  { num: "03", question: "Do you store my footage?", answer: "No. Speech detection and video rendering run directly inside your browser on your machine. Your unedited raw media files and clips never leave your device and are never stored or used to train AI models." },
  { num: "04", question: "Can I cancel?", answer: "Yes, instantly with one click. Monthly subscriptions renew automatically via UPI Autopay or Cards until cancelled. You can cancel anytime from your account settings and keep full access until the end of your billing cycle." },
  { num: "05", question: "Which payment methods work?", answer: "We support all Indian payment options including UPI (Google Pay, PhonePe, Paytm), RuPay / Visa / Mastercard debit & credit cards, and Netbanking. Everything is billed natively in INR without forex or conversion fees." },
];

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [hoveredPlanId, setHoveredPlanId] = useState<string | null>(null);
  const [splitOffset, setSplitOffset] = useState<number>(0);
  const [cardsOpacity, setCardsOpacity] = useState<number>(1);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const compareSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      let enterOffset = 0;
      let enterOpacity = 1;
      if (scrollY < 120) {
        const enterProgress = 1 - Math.min(scrollY / 120, 1);
        enterOffset = enterProgress * 120;
        enterOpacity = 1 - enterProgress * 0.15;
      }
      let exitOffset = 0;
      let exitOpacity = 1;
      if (compareSectionRef.current) {
        const compareRect = compareSectionRef.current.getBoundingClientRect();
        const exitTriggerPoint = 260;
        if (compareRect.top < exitTriggerPoint) {
          const exitProgress = Math.min((exitTriggerPoint - compareRect.top) / 190, 1);
          exitOffset = exitProgress * 160;
          exitOpacity = Math.max(1 - exitProgress * 1.25, 0);
        }
      }
      if (exitOffset > 0) {
        setSplitOffset(exitOffset);
        setCardsOpacity(exitOpacity);
      } else {
        setSplitOffset(enterOffset);
        setCardsOpacity(enterOpacity);
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [billingCycle]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("cc-in-view");
        else entry.target.classList.remove("cc-in-view");
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".cc-scroll-reveal").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add("cc-in-view");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [billingCycle]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-app)", color: "var(--text-primary)", padding: "64px 24px 140px", fontFamily: "Plus Jakarta Sans, sans-serif", overflowX: "hidden" }}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none !important; width: 0 !important; }
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .cc-scroll-reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1); will-change: opacity, transform; }
        .cc-scroll-reveal.cc-in-view { opacity: 1; transform: translateY(0); }
        .cc-stagger-1 { transition-delay: 0.04s; }
        .cc-stagger-2 { transition-delay: 0.12s; }
        .cc-stagger-3 { transition-delay: 0.20s; }
        .cc-stagger-4 { transition-delay: 0.28s; }
        .cc-plan-card { transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), opacity 0.22s ease, box-shadow 0.3s ease; will-change: transform, opacity; }
        .cc-plans-container.is-hovering .cc-plan-card.is-active-hover { transform: scale(1.038) translateY(-6px) !important; opacity: 1 !important; z-index: 10; box-shadow: 0 24px 50px rgba(0,0,0,0.35); }
        .cc-plans-container.is-hovering .cc-plan-card:not(.is-active-hover) { transform: scale(0.965); opacity: 0.5; filter: grayscale(100%); }
        .cc-compare-wrapper {
          background: var(--nav-bg);
          border-radius: 24px;
          padding: 14px 18px;
          box-shadow: var(--card-shadow);
          border: 1px solid var(--box-border);
          overflow: hidden;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .cc-compare-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .cc-compare-table th,
        .cc-compare-table td {
          padding: 18px 22px;
          border-bottom: 1px solid var(--box-border);
          font-size: 14.5px;
          color: var(--bg-app);
          font-family: inherit;
        }
        .cc-compare-table tr:last-child td {
          border-bottom: none;
        }
        .cc-compare-table th {
          font-weight: 800;
          font-size: 15px;
          color: var(--bg-app);
          padding-top: 24px;
          padding-bottom: 22px;
        }
        .cc-col-highlight {
          background-color: var(--accent-surface) !important;
          color: var(--bg-app) !important;
        }
        .cc-col-highlight-header {
          background-color: var(--accent-surface) !important;
          color: var(--accent-primary) !important;
          font-weight: 800 !important;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }
        .cc-compare-table tr:last-child td.cc-col-highlight {
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }
        .cc-faq-grid { display: flex; flex-direction: column; gap: 16px; }
        .cc-faq-card {
          background: var(--nav-bg);
          border: 1px solid var(--box-border);
          border-radius: 18px;
          padding: 24px 28px;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
          box-shadow: var(--card-shadow);
          overflow: hidden;
          cursor: pointer;
        }
        .cc-faq-card:hover {
          border-color: var(--accent-primary);
          box-shadow: 0 10px 28px var(--accent-surface);
        }
        .cc-faq-content {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, margin 0.3s ease;
          margin-top: 0;
        }
        .cc-faq-card:hover .cc-faq-content {
          max-height: 180px;
          opacity: 1;
          margin-top: 14px;
        }
        .cc-faq-chevron {
          color: var(--accent-primary);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transform: rotate(0deg);
        }
        .cc-faq-card:hover .cc-faq-chevron {
          transform: rotate(180deg);
        }
      `}</style>

      {/* SECTION 1: HERO & PRICING PLANS */}
      <section style={{ maxWidth: "1380px", margin: "0 auto 120px" }}>
        <div style={{ textAlign: "center", maxWidth: "860px", margin: "0 auto 52px auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "var(--accent-primary)", background: "var(--accent-surface)", border: "1px solid var(--accent-primary)", padding: "5px 14px", borderRadius: "999px", marginBottom: "18px", textTransform: "uppercase" }}>
            <Sparkles size={14} /> Creator-First Pricing
          </div>
          <h1 style={{ fontSize: "clamp(34px, 5.5vw, 50px)", fontWeight: 800, letterSpacing: "-0.035em", margin: "0 0 16px 0", color: "var(--text-primary)" }}>
            Simple Plans for Every Stage of Growth
          </h1>
          <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "620px", margin: "0 auto" }}>
            Accessible pricing built specifically for Indian short-form video creators, reel editors, and YouTube channels.
          </p>
          <div ref={pillRef} style={{ display: "inline-flex", marginTop: "32px", backgroundColor: "var(--nav-bg)", padding: "5px", borderRadius: "999px", border: "1px solid var(--box-border)" }}>
            <button type="button" onClick={() => setBillingCycle("weekly")} style={{ padding: "9px 24px", borderRadius: "999px", border: "none", backgroundColor: billingCycle === "weekly" ? "var(--accent-primary)" : "transparent", color: billingCycle === "weekly" ? "#fff" : "var(--card-text-primary)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Weekly</button>
            <button type="button" onClick={() => setBillingCycle("monthly")} style={{ padding: "9px 24px", borderRadius: "999px", border: "none", backgroundColor: billingCycle === "monthly" ? "var(--accent-primary)" : "transparent", color: billingCycle === "monthly" ? "#fff" : "var(--card-text-primary)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Monthly</button>
            <button type="button" onClick={() => setBillingCycle("yearly")} style={{ padding: "9px 24px", borderRadius: "999px", border: "none", backgroundColor: billingCycle === "yearly" ? "var(--accent-primary)" : "transparent", color: billingCycle === "yearly" ? "#fff" : "var(--card-text-primary)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Yearly (Save ~16%)</button>
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
                position: "relative",
                boxShadow: "var(--card-shadow)",
              }}
            >
              <h3 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 6px 0", color: "var(--bg-app)", letterSpacing: "-0.02em" }}>
                {WEEKLY_PLAN.name}
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--bg-app)", opacity: 0.75, margin: "0 0 24px 0", lineHeight: 1.5, fontWeight: 500 }}>
                {WEEKLY_PLAN.description}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "26px" }}>
                <span style={{ fontSize: "3rem", fontWeight: 800, color: "var(--bg-app)", letterSpacing: "-0.03em" }}>
                  ₹{WEEKLY_PLAN.weeklyPrice}
                </span>
                <span style={{ color: "var(--bg-app)", opacity: 0.7, fontSize: "0.9rem", fontWeight: 600 }}>/ 7 days</span>
              </div>
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "12px",
                  backgroundColor: "var(--accent-primary)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "15px",
                  cursor: "pointer",
                  marginBottom: "30px",
                  boxShadow: "0 6px 18px var(--accent-surface)",
                }}
              >
                {WEEKLY_PLAN.ctaText}
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
                {WEEKLY_PLAN.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.88rem", color: "var(--bg-app)" }}>
                    <Check size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span style={{ fontWeight: 500, lineHeight: 1.45, opacity: 0.9 }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={`cc-plans-container ${hoveredPlanId ? "is-hovering" : ""}`} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(295px, 1fr))", gap: "24px", maxWidth: "1380px", margin: "0 auto" }}>
            {PLANS.map((plan: Plan, index: number) => {
              const isYearly = billingCycle === "yearly";
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const isLeftCard = index < 2;
              const currentTransformX = isLeftCard ? -splitOffset : splitOffset;
              return (
                <div key={plan.id} onMouseEnter={() => setHoveredPlanId(plan.id)} onMouseLeave={() => setHoveredPlanId(null)} className={`cc-plan-card ${hoveredPlanId === plan.id ? "is-active-hover" : ""}`} style={{ backgroundColor: "var(--nav-bg)", borderRadius: "20px", padding: "34px 26px", border: plan.isPopular ? "2px solid var(--accent-primary)" : "1px solid var(--box-border)", display: "flex", flexDirection: "column", cursor: "pointer", transform: `translateX(${currentTransformX}px)`, opacity: cardsOpacity }}>
                  {plan.badge && <div style={{ alignSelf: "flex-start", backgroundColor: plan.isPopular ? "var(--accent-primary)" : "var(--accent-surface)", color: plan.isPopular ? "#fff" : "var(--accent-primary)", fontSize: "11px", fontWeight: 800, padding: "4px 12px", borderRadius: "999px", marginBottom: "16px" }}>{plan.badge}</div>}
                  <h3 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0 0 6px 0", color: "var(--bg-app)", letterSpacing: "-0.02em" }}>{plan.name}</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--bg-app)", opacity: 0.75, minHeight: "40px", lineHeight: 1.5, fontWeight: 500 }}>{plan.description}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "22px" }}>
                    <span style={{ fontSize: "2.6rem", fontWeight: 800, color: "var(--bg-app)", letterSpacing: "-0.03em" }}>₹{price}</span>
                    <span style={{ color: "var(--bg-app)", opacity: 0.7, fontSize: "0.85rem", fontWeight: 600 }}>{isYearly ? "/ year" : "/ month"}</span>
                  </div>
                  <button
                    type="button"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "11px",
                      backgroundColor: "var(--accent-primary)",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 700,
                      fontSize: "14.5px",
                      cursor: "pointer",
                      marginBottom: "26px",
                      boxShadow: "0 4px 14px var(--accent-surface)",
                      transition: "transform 0.15s ease, opacity 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    {plan.ctaText}
                  </button>
                  <div className={plan.id === "creator_pro" || plan.id === "studio_max" ? "no-scrollbar" : undefined} style={{ display: "flex", flexDirection: "column", gap: "13px", maxHeight: "390px", overflowY: "auto" }}>
                    {plan.features.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.85rem", color: "var(--bg-app)", opacity: f.isLocked ? 0.45 : 0.9 }}>
                        {f.isLocked ? <Lock size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} /> : <Check size={15} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />}
                        <span>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: COMPARE PLANS */}
      <section ref={compareSectionRef} className="cc-scroll-reveal" style={{ maxWidth: "1160px", margin: "0 auto 130px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h2 style={{ fontSize: "clamp(34px, 4.6vw, 48px)", fontWeight: 800, margin: "0 0 10px 0" }}>Compare plans</h2>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", margin: 0 }}>A detailed feature-by-feature breakdown of all studio capabilities across plans.</p>
        </div>
        <div className="cc-compare-wrapper">
          <div style={{ overflowX: "auto" }}>
            <table className="cc-compare-table">
              <thead>
                <tr>
                  <th style={{ width: "28%" }}></th>
                  <th style={{ width: "18%" }}>Free</th>
                  <th className="cc-col-highlight-header" style={{ width: "18%" }}>Creator</th>
                  <th style={{ width: "18%" }}>Studio</th>
                  <th style={{ width: "18%" }}>Weekly</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: "var(--bg-app)", opacity: 1 }}>{row.feature}</td>
                    <td style={{ color: "var(--bg-app)", opacity: 0.85 }}>{row.free === "-" ? <Minus size={16} color="var(--accent-primary)" /> : row.free}</td>
                    <td className="cc-col-highlight" style={{ fontWeight: 700, color: "var(--bg-app)" }}>{row.creator === "-" ? <Minus size={16} color="var(--accent-primary)" /> : row.creator}</td>
                    <td style={{ color: "var(--bg-app)", opacity: 0.85 }}>{row.studio === "-" ? <Minus size={16} color="var(--accent-primary)" /> : row.studio}</td>
                    <td style={{ color: "var(--bg-app)", opacity: 0.85 }}>{row.weekly === "-" ? <Minus size={16} color="var(--accent-primary)" /> : row.weekly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 3: BEFORE YOU PAY / QUESTIONS */}
      <section className="cc-scroll-reveal" style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <div style={{ marginBottom: "38px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "12px",
              fontWeight: 800,
              color: "var(--accent-primary)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            <span style={{ width: "18px", height: "2px", background: "var(--accent-primary)" }} />
            <span>QUESTIONS</span>
          </div>
          <h2
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 900,
              letterSpacing: "-0.035em",
              margin: 0,
              lineHeight: 1.1,
              color: "var(--text-primary)",
            }}
          >
            Before you pay
          </h2>
        </div>

        <div className="cc-faq-grid">
          {PRICING_FAQS.map((faq, idx) => {
            const staggerClass = `cc-stagger-${idx + 1}`;

            return (
              <div
                key={faq.num}
                className={`cc-faq-card cc-scroll-reveal ${staggerClass}`}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        color: "var(--accent-primary)",
                        fontSize: "14px",
                        fontWeight: 800,
                      }}
                    >
                      {faq.num}
                    </span>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "16.5px",
                        fontWeight: 800,
                        letterSpacing: "-0.015em",
                        color: "var(--bg-app)",
                      }}
                    >
                      {faq.question}
                    </h3>
                  </div>
                  <div className="cc-faq-chevron">
                    <ChevronDown size={19} strokeWidth={2.4} />
                  </div>
                </div>

                <div className="cc-faq-content">
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      lineHeight: 1.65,
                      color: "var(--bg-app)",
                      opacity: 0.78,
                      fontWeight: 500,
                      paddingLeft: "32px",
                    }}
                  >
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: FINAL CTA BANNER */}
      <section className="cc-scroll-reveal" style={{ maxWidth: "1160px", margin: "120px auto 0 auto" }}>
        <div
          style={{
            background: "var(--nav-bg)",
            border: "1px solid var(--box-border)",
            borderRadius: "24px",
            padding: "54px 32px",
            textAlign: "center",
            boxShadow: "var(--card-shadow)",
            position: "relative",
            transition: "all 0.2s ease",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 800,
              color: "var(--accent-primary)",
              background: "var(--accent-surface)",
              border: "1px solid var(--accent-primary)",
              padding: "5px 14px",
              borderRadius: "999px",
              marginBottom: "18px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            <Sparkles size={13} /> Start Creating Today
          </div>
          <h2
            style={{
              fontSize: "clamp(30px, 4.4vw, 42px)",
              fontWeight: 800,
              margin: "0 auto 14px auto",
              color: "var(--bg-app)",
              letterSpacing: "-0.035em",
              maxWidth: "720px",
            }}
          >
            Ready to elevate your Reels &amp; Shorts?
          </h2>
          <p
            style={{
              fontSize: "15.5px",
              color: "var(--bg-app)",
              opacity: 0.78,
              margin: "0 auto 32px auto",
              maxWidth: "600px",
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            Start for free with 3 test minutes, or unlock watermark-free exports across Telugu, Tenglish, and English instantly.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "14px" }}>
            <a
              href="/studio"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 28px",
                borderRadius: "11px",
                backgroundColor: "var(--accent-primary)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "14.5px",
                textDecoration: "none",
                boxShadow: "0 6px 18px var(--accent-surface)",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <span>Launch Studio Free</span>
              <ArrowRight size={16} />
            </a>
            <a
              href="/templates"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 26px",
                borderRadius: "11px",
                backgroundColor: "transparent",
                color: "var(--bg-app)",
                border: "1px solid var(--box-border)",
                fontWeight: 700,
                fontSize: "14.5px",
                textDecoration: "none",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-primary)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--box-border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>Browse 40+ Templates</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
