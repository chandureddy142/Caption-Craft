import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Languages,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  Sliders,
  Type,
  Eye,
  Film,
  Check,
  ChevronRight,
} from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
}

interface DemoWord {
  text: string;
  highlight: boolean;
  pill?: string;
  darkText?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [activeTab, setActiveTab] = useState<"tenglish" | "telugu" | "english">("tenglish");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [emailInput, setEmailInput] = useState("");
  const [signedUp, setSignedUp] = useState(false);

  const demoPhrases: Record<"tenglish" | "telugu" | "english", DemoWord[]> = {
    tenglish: [
      { text: "ee video ni", highlight: false },
      { text: "kacchithamga", highlight: true, pill: "#ec4899" },
      { text: "save cheskondi", highlight: false }
    ],
    telugu: [
      { text: "ఈ వీడియో ని", highlight: false },
      { text: "తప్పకుండా", highlight: true, pill: "#ffd000", darkText: true },
      { text: "సేవ్ చేసుకోండి", highlight: false }
    ],
    english: [
      { text: "make sure you", highlight: false },
      { text: "save this reel", highlight: true, pill: "#8b5cf6" },
      { text: "right now", highlight: false }
    ]
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSignedUp(true);
      setTimeout(() => {
        onStart();
      }, 1200);
    }
  };

  return (
    <div className="cc-root">
      <style>{`
        :root { color-scheme: dark; }
        html {
          scroll-behavior: smooth !important;
          overflow-y: auto !important;
          height: auto !important;
        }
        body {
          margin: 0;
          min-height: 100%;
          height: auto !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          background: #050807;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
        }
        #root {
          min-height: 100vh;
          height: auto !important;
          overflow: visible !important;
        }
        .cc-root {
          --cc-accent: #00e5a0;
          min-height: 100vh;
          height: auto !important;
          overflow-x: clip !important;
          overflow-y: visible !important;
          background: #050807;
          color: #f4f7f6;
          line-height: 1.6;
          letter-spacing: -0.015em;
          padding-top: 0 !important;
        }

        /* 1. Fixed Header */
        .cc-nav {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          box-sizing: border-box !important;
          z-index: 1000 !important;
          padding: 14px clamp(18px, 5vw, 76px);
          background: rgba(5, 8, 7, 0.88);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cc-root > .cc-nav + section#home {
          padding-top: 152px !important;
        }
        .cc-root [id="demo"],
        .cc-root [id="templates"],
        .cc-root [id="how-it-works"],
        .cc-root [id="pricing"],
        .cc-root [id="signup"] {
          scroll-margin-top: 86px !important;
        }

        .cc-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
        }
        .cc-brand-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #00e5a0, #0aa879);
          color: #04110c;
          box-shadow: 0 0 28px rgba(0, 229, 160, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 14px;
        }
        .cc-brand-text {
          display: flex;
          flex-direction: column;
        }
        .cc-brand-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cc-brand-name {
          font-size: 17px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .cc-pill-tag {
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 2px 7px;
          border-radius: 9999px;
          color: #00e5a0;
          background: rgba(0, 229, 160, 0.08);
          border: 1px solid rgba(0, 229, 160, 0.25);
        }
        .cc-brand-sub {
          font-size: 11px;
          color: #8c9c96;
          font-weight: 500;
        }

        .cc-menu {
          display: flex;
          align-items: center;
          gap: clamp(14px, 2.3vw, 32px);
        }
        .cc-menu-link {
          background: none;
          border: none;
          color: #9ca9a4;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.18s ease;
          padding: 6px 0;
          text-transform: capitalize;
        }
        .cc-menu-link:hover {
          color: #00e5a0;
        }
        .cc-nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cc-btn-ghost {
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #e2e8f0;
          padding: 8px 16px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .cc-btn-ghost:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.22);
        }
        .cc-btn-solid {
          background: #00e5a0;
          color: #03120c;
          border: none;
          padding: 9px 18px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 8px 26px rgba(0, 229, 160, 0.18);
          transition: all 0.18s ease;
        }
        .cc-btn-solid:hover {
          background: #21f5b4;
          transform: translateY(-1px);
        }

        /* 2. Hero Section */
        .cc-hero-wrap {
          min-height: min(740px, calc(100vh - 62px));
          box-sizing: border-box;
          position: relative;
          padding: clamp(64px, 8vw, 112px) clamp(20px, 7vw, 110px) 72px;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.85fr);
          align-items: center;
          gap: clamp(36px, 7vw, 100px);
          text-align: left;
          isolation: isolate;
        }
        .cc-hero-glow-1 {
          position: absolute;
          top: 45%;
          left: 72%;
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, rgba(0, 229, 160, 0.13), rgba(0, 130, 100, 0.04) 45%, transparent 72%);
          filter: blur(75px);
          z-index: -1;
          pointer-events: none;
        }
        .cc-hero-content {
          width: 100%;
          max-width: 690px;
          min-width: 0;
        }
        .cc-badge-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 9999px;
          color: #00e5a0;
          background: rgba(0, 229, 160, 0.08);
          border: 1px solid rgba(0, 229, 160, 0.24);
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .cc-h1 {
          max-width: 760px;
          margin: 0 0 22px;
          font-size: clamp(42px, 5.2vw, 72px);
          line-height: 1.05;
          letter-spacing: -0.055em;
          font-weight: 850;
        }
        .cc-h1-gradient {
          background: linear-gradient(105deg, #00e5a0 4%, #8affd9 58%, #d6fff0 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .cc-lead {
          max-width: 580px;
          margin: 0 0 30px;
          color: #9ca9a4;
          font-size: clamp(15px, 1.35vw, 17px);
          line-height: 1.8;
        }
        .cc-hero-btns {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          margin-bottom: 24px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .cc-cta-primary {
          background: #00e5a0;
          color: #03120c;
          padding: 13px 22px;
          min-height: 48px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 9px;
          box-shadow: 0 8px 26px rgba(0, 229, 160, 0.18);
          transition: all 0.18s ease;
        }
        .cc-cta-primary:hover {
          background: #21f5b4;
          transform: translateY(-2px);
        }
        .cc-cta-secondary {
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #e2e8f0;
          padding: 13px 22px;
          min-height: 48px;
          font-size: 15px;
          font-weight: 700;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.18s ease;
        }
        .cc-cta-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .cc-trust-row {
          max-width: 680px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
        }
        .cc-trust-box {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(255, 255, 255, 0.025);
          font-size: 12px;
          font-weight: 600;
          color: #bdc8c3;
        }

        /* Hero visual phone scene */
        .cc-hero-visual {
          position: relative;
          min-height: 470px;
          display: flex;
          align-items: center;
          justify-content: center;
          isolation: isolate;
        }
        .cc-phone-frame {
          position: relative;
          z-index: 2;
          width: min(100%, 294px);
          padding: 9px;
          border-radius: 34px;
          background: linear-gradient(145deg, #39433f, #101513 38%, #29332e);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.62), 0 0 70px rgba(0, 229, 160, 0.1);
          transform: rotate(2deg);
        }
        .cc-phone-screen {
          overflow: hidden;
          border-radius: 26px;
          background: #101815;
          border: 1px solid rgba(255, 255, 255, 0.09);
        }
        .cc-preview-topline {
          height: 38px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 12px;
          color: #a9b9b2;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }
        .cc-preview-topline span:last-child {
          margin-left: auto;
          color: #75867e;
        }
        .cc-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00e5a0;
          box-shadow: 0 0 10px #00e5a0;
        }
        .cc-video-scene {
          height: 370px;
          position: relative;
          overflow: hidden;
          background: radial-gradient(ellipse at 50% 30%, #294b43 0%, #142a25 38%, #09100e 78%);
        }
        .cc-scene-light {
          position: absolute;
          border-radius: 50%;
          filter: blur(24px);
          opacity: 0.75;
        }
        .cc-scene-light-one {
          width: 140px;
          height: 190px;
          background: #14775b;
          top: 4%;
          left: -28px;
        }
        .cc-scene-light-two {
          width: 120px;
          height: 180px;
          background: #205b50;
          top: 18%;
          right: -36px;
        }
        .cc-scene-person {
          position: absolute;
          width: 150px;
          height: 255px;
          bottom: -35px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 70px 70px 18px 18px;
          background: linear-gradient(90deg, #17211e, #d0d9d3 36%, #f0f4ee 58%, #5a7168);
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.24);
        }
        .cc-scene-person:before {
          content: "";
          position: absolute;
          width: 86px;
          height: 105px;
          top: -78px;
          left: 33px;
          border-radius: 48% 48% 44% 44%;
          background: linear-gradient(90deg, #17211e, #a8b7ad 55%, #273b33);
          box-shadow: 0 -10px 0 9px #111b17;
        }
        .cc-scene-person span {
          position: absolute;
          left: 17px;
          right: 17px;
          top: 48px;
          height: 130px;
          border-radius: 18px;
          background: linear-gradient(110deg, transparent 20%, rgba(255, 255, 255, 0.4) 50%, transparent 80%);
        }
        .cc-scene-mic {
          position: absolute;
          top: 45%;
          left: -8px;
          width: 105px;
          height: 15px;
          border-radius: 12px;
          background: linear-gradient(#353f3a, #070a09);
          transform: rotate(-8deg);
          box-shadow: 0 5px 12px #050806;
        }
        .cc-scene-mic i {
          position: absolute;
          right: -8px;
          top: -5px;
          width: 26px;
          height: 25px;
          border-radius: 8px;
          background: #00d99a;
          border: 2px solid #182a23;
        }
        .cc-preview-caption {
          position: absolute;
          z-index: 3;
          left: 10px;
          right: 10px;
          bottom: 43px;
          text-align: center;
          font-size: 15px;
          font-weight: 900;
          line-height: 1.4;
          transform: rotate(-2deg);
        }
        .cc-preview-caption span {
          display: inline-block;
          color: #07120d;
          background: #f3fff9;
          padding: 5px 8px;
          border-radius: 4px 4px 0 4px;
        }
        .cc-preview-caption strong {
          display: inline-block;
          color: #07120d;
          background: #00e5a0;
          padding: 5px 8px;
          border-radius: 0 4px 4px 0;
        }
        .cc-preview-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          color: #a6b8af;
          font-size: 9px;
        }
        .cc-preview-controls > span:first-child {
          color: #00e5a0;
        }
        .cc-preview-track {
          flex: 1;
          height: 3px;
          background: #34433b;
          border-radius: 9px;
          overflow: hidden;
        }
        .cc-preview-track i {
          display: block;
          height: 100%;
          width: 42%;
          background: #00e5a0;
          border-radius: 9px;
        }
        .cc-preview-orbit {
          position: absolute;
          border: 1px solid rgba(0, 229, 160, 0.13);
          border-radius: 50%;
          z-index: -1;
        }
        .cc-preview-orbit-one {
          width: 420px;
          height: 420px;
        }
        .cc-preview-orbit-two {
          width: 340px;
          height: 340px;
          border-style: dashed;
          opacity: 0.55;
        }
        .cc-floating-chip {
          position: absolute;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          background: rgba(13, 22, 18, 0.92);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.32);
          color: #d9e6df;
          font-size: 11px;
          font-weight: 700;
          backdrop-filter: blur(14px);
        }
        .cc-floating-chip svg {
          color: #00e5a0;
        }
        .cc-floating-language {
          top: 18%;
          left: -4%;
        }
        .cc-floating-sync {
          bottom: 16%;
          right: -7%;
        }

        /* Common wrappers */
        .cc-section-dark {
          background: #080d0b;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }
        .cc-wrap {
          padding: 84px 24px;
          max-width: 1120px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .cc-head-center {
          text-align: center;
          margin-bottom: 44px;
        }
        .cc-subtag {
          font-size: 11px;
          font-weight: 800;
          color: #00e5a0;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .cc-title {
          font-size: clamp(24px, 3.8vw, 36px);
          font-weight: 900;
          letter-spacing: -0.04em;
          margin: 8px 0 10px 0;
          color: #ffffff;
        }
        .cc-desc {
          font-size: 14px;
          color: #9ca9a4;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Demo Tab Pill */
        .cc-demo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 720px;
          margin: 0 auto;
        }
        .cc-tab-pill-bar {
          display: inline-flex;
          background: #0c1511;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 4px;
          gap: 6px;
          margin-bottom: 28px;
        }
        .cc-tab-item {
          background: transparent;
          border: none;
          color: #9ca9a4;
          font-size: 12px;
          font-weight: 700;
          padding: 8px 18px;
          border-radius: 9px;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .cc-tab-item.active {
          background: #00e5a0;
          color: #04130d;
          box-shadow: 0 2px 14px rgba(0, 229, 160, 0.18);
        }
        .cc-demo-mockup {
          background: radial-gradient(ellipse at top, rgba(0, 229, 160, 0.08), #0a100d 65%);
          border: 1px solid rgba(0, 229, 160, 0.2);
          border-radius: 20px;
          padding: 48px 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 160px;
          width: 100%;
          position: relative;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.55);
          box-sizing: border-box;
        }
        .cc-mockup-watermark {
          position: absolute;
          bottom: 12px;
          right: 18px;
          font-size: 11px;
          color: #64748b;
          font-family: monospace;
        }

        /* Templates */
        .cc-templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
        }
        .cc-tmpl-card {
          background: #0b110e;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }
        .cc-tmpl-card:hover {
          transform: translateY(-3px);
          border-color: rgba(0, 229, 160, 0.3);
        }
        .cc-tmpl-preview {
          height: 72px;
          border-radius: 10px;
          background: #06080d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 13px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* Features */
        .cc-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }
        .cc-feat-card {
          background: #0b110e;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 26px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: border-color 0.18s ease;
        }
        .cc-feat-card:hover {
          border-color: rgba(0, 229, 160, 0.3);
        }
        .cc-feat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          color: #00e5a0;
          background: rgba(0, 229, 160, 0.08);
          border: 1px solid rgba(0, 229, 160, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cc-feat-title {
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
        }
        .cc-feat-text {
          font-size: 13px;
          color: #9ca9a4;
          line-height: 1.6;
        }

        /* Steps */
        .cc-steps-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }
        .cc-step-box {
          background: #0b110e;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
        }
        .cc-step-index {
          font-size: 32px;
          font-weight: 900;
          color: rgba(0, 229, 160, 0.35);
          line-height: 1;
          margin-bottom: 12px;
        }

        /* Pricing */
        .cc-pricing-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 38px;
        }
        .cc-pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 22px;
          max-width: 980px;
          margin: 0 auto;
        }
        .cc-plan-card {
          background: #0b110e;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .cc-plan-card.featured {
          background: linear-gradient(180deg, #10231b, #0b110e);
          border-color: rgba(0, 229, 160, 0.4);
          box-shadow: 0 12px 36px rgba(0, 229, 160, 0.07);
        }
        .cc-plan-popular {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #00e5a0;
          color: #03120c;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 12px;
          border-radius: 9999px;
        }
        .cc-price-figure {
          font-size: 40px;
          font-weight: 900;
          color: #ffffff;
          line-height: 1;
          margin: 16px 0 8px 0;
        }
        .cc-price-period {
          font-size: 13px;
          color: #9ca9a4;
          font-weight: 500;
        }
        .cc-plan-perks {
          list-style: none;
          padding: 0;
          margin: 24px 0 32px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cc-perk-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #cbd5e1;
        }

        /* Sign up */
        .cc-signup-shell {
          background: radial-gradient(ellipse at top, rgba(0, 229, 160, 0.09), #0b110e 70%);
          border: 1px solid rgba(0, 229, 160, 0.2);
          border-radius: 24px;
          padding: 52px 32px;
          max-width: 820px;
          margin: 0 auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.5);
        }
        .cc-signup-form {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          max-width: 480px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .cc-input {
          flex: 1;
          min-width: 240px;
          background: #080a11;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          font-size: 14px;
          padding: 13px 18px;
          border-radius: 11px;
          outline: none;
          transition: border-color 0.18s ease;
        }
        .cc-input:focus {
          border-color: #00e5a0;
        }

        /* Footer */
        .cc-footer {
          background: #050807;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          padding: 32px 24px;
          text-align: center;
          font-size: 13px;
          color: #64748b;
        }

        @media (max-width: 980px) {
          .cc-hero-wrap {
            grid-template-columns: minmax(0, 1fr) minmax(250px, 0.75fr);
            gap: 28px;
            padding-left: 28px;
            padding-right: 28px;
          }
          .cc-h1 {
            font-size: clamp(38px, 5.3vw, 58px);
          }
          .cc-floating-language { left: -8%; }
          .cc-floating-sync { right: -9%; }
        }

        @media (max-width: 760px) {
          .cc-nav { padding: 10px 16px; }
          .cc-brand-sub { display: none; }
          .cc-nav-actions { gap: 8px; }
          .cc-nav-actions .cc-btn-ghost { display: none; }
          .cc-hero-wrap {
            min-height: auto;
            grid-template-columns: minmax(0, 1fr);
            gap: 34px;
            padding: 58px 20px 54px;
          }
          .cc-root > .cc-nav + section#home {
            padding-top: 118px !important;
          }
          .cc-hero-content {
            max-width: 680px;
            margin: 0 auto;
          }
          .cc-h1 {
            font-size: clamp(40px, 9vw, 62px);
          }
          .cc-lead {
            font-size: 15px;
          }
          .cc-hero-visual {
            min-height: 430px;
          }
          .cc-phone-frame {
            width: 252px;
          }
          .cc-video-scene {
            height: 320px;
          }
          .cc-floating-language {
            top: 16%;
            left: max(0px, calc(50% - 190px));
          }
          .cc-floating-sync {
            bottom: 12%;
            right: max(0px, calc(50% - 190px));
          }
          .cc-preview-orbit-one {
            width: 340px;
            height: 340px;
          }
          .cc-preview-orbit-two {
            width: 285px;
            height: 285px;
          }
          .cc-features-grid,
          .cc-steps-row,
          .cc-pricing-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .cc-trust-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .cc-trust-box {
            font-size: 10px;
            gap: 6px;
          }
          .cc-wrap {
            padding: 58px 20px;
          }
          .cc-menu {
            display: none !important;
          }
        }

        @media (max-width: 420px) {
          .cc-brand-name {
            font-size: 15px;
          }
          .cc-pill-tag {
            display: none;
          }
          .cc-nav-actions .cc-btn-solid {
            padding: 9px 12px;
            font-size: 11px;
          }
          .cc-h1 {
            font-size: 39px;
          }
          .cc-badge-chip {
            font-size: 10px;
            padding: 6px 10px;
          }
          .cc-hero-btns {
            align-items: stretch;
            flex-direction: column;
          }
          .cc-cta-primary,
          .cc-cta-secondary {
            justify-content: center;
            width: 100%;
            box-sizing: border-box;
          }
          .cc-trust-row {
            grid-template-columns: minmax(0, 1fr);
          }
          .cc-signup-shell {
            padding: 34px 18px;
          }
          .cc-input {
            min-width: 0;
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      {/* 1. Fixed Navbar */}
      <header className="cc-nav">
        <div className="cc-brand" onClick={() => scrollTo("home")}>
          <div className="cc-brand-badge">CC</div>
          <div className="cc-brand-text">
            <div className="cc-brand-row">
              <span className="cc-brand-name">CaptionCraft</span>
              <span className="cc-pill-tag">telugu ai</span>
            </div>
            <span className="cc-brand-sub">smart captions for telugu creators</span>
          </div>
        </div>

        <nav className="cc-menu">
          <button className="cc-menu-link" onClick={() => scrollTo("home")}>home</button>
          <button className="cc-menu-link" onClick={() => scrollTo("demo")}>demo</button>
          <button className="cc-menu-link" onClick={() => scrollTo("templates")}>templates</button>
          <button className="cc-menu-link" onClick={() => scrollTo("features")}>features</button>
          <button className="cc-menu-link" onClick={() => scrollTo("how-it-works")}>how it works</button>
          <button className="cc-menu-link" onClick={() => scrollTo("pricing")}>pricing</button>
        </nav>

        <div className="cc-nav-actions">
          <button onClick={() => scrollTo("signup")} className="cc-btn-ghost">sign in</button>
          <button onClick={onStart} className="cc-btn-solid">
            <span>open studio</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="home" className="cc-hero-wrap">
        <div className="cc-hero-glow-1" />
        <div className="cc-hero-content">
          <div className="cc-badge-chip">
            <Sparkles size={14} color="#00e5a0" />
            <span>tailored for instagram reels & youtube shorts creators</span>
          </div>

          <h1 className="cc-h1">
            viral captions for <br />
            <span className="cc-h1-gradient">telugu, tenglish & english videos.</span>
          </h1>

          <p className="cc-lead">
            stop using western caption apps that break telugu letters or turn conversational tenglish audio into broken words. CaptionCraft auto-syncs word-by-word subtitles right inside your browser with zero watermark.
          </p>

          <div className="cc-hero-btns">
            <button onClick={onStart} className="cc-cta-primary">
              <UploadCloud size={18} />
              <span>start captioning free</span>
            </button>
            <button onClick={() => scrollTo("demo")} className="cc-cta-secondary">
              <Eye size={18} color="#00e5a0" />
              <span>try interactive preview</span>
            </button>
          </div>

          <div className="cc-trust-row">
            <div className="cc-trust-box">
              <ShieldCheck size={16} color="#00e5a0" />
              <span>100% private in browser</span>
            </div>
            <div className="cc-trust-box">
              <Languages size={16} color="#00e5a0" />
              <span>telugu lipi & transliteration</span>
            </div>
            <div className="cc-trust-box">
              <Zap size={16} color="#00e5a0" />
              <span>word-by-word kinetic sync</span>
            </div>
            <div className="cc-trust-box">
              <CheckCircle2 size={16} color="#00e5a0" />
              <span>no watermark or signup lock</span>
            </div>
          </div>
        </div>

        {/* Visual Phone Frame */}
        <div className="cc-hero-visual" aria-label="CaptionCraft caption preview">
          <div className="cc-preview-orbit cc-preview-orbit-one" />
          <div className="cc-preview-orbit cc-preview-orbit-two" />
          <div className="cc-phone-frame">
            <div className="cc-phone-screen">
              <div className="cc-preview-topline">
                <span className="cc-live-dot" /> CAPTIONCRAFT STUDIO <span>•••</span>
              </div>
              <div className="cc-video-scene">
                <div className="cc-scene-light cc-scene-light-one" />
                <div className="cc-scene-light cc-scene-light-two" />
                <div className="cc-scene-person"><span /></div>
                <div className="cc-scene-mic"><i /></div>
                <div className="cc-preview-caption">
                  <span>మాటలు కాదు,</span><strong> IMPACT ✦</strong>
                </div>
              </div>
              <div className="cc-preview-controls">
                <span>▶</span>
                <div className="cc-preview-track"><i /></div>
                <span>00:08</span>
              </div>
            </div>
          </div>
          <div className="cc-floating-chip cc-floating-language">
            <Languages size={15} /> తెలుగు · Tenglish
          </div>
          <div className="cc-floating-chip cc-floating-sync">
            <Zap size={15} /> Word-level sync
          </div>
        </div>
      </section>

      {/* 3. Demo Interactive Section */}
      <div id="demo" className="cc-section-dark">
        <section className="cc-wrap">
          <div className="cc-head-center">
            <span className="cc-subtag">real-time sample</span>
            <h2 className="cc-title">switch scripts in one click</h2>
            <p className="cc-desc">see how spoken telugu audio renders seamlessly across scripts with kinetic word highlights.</p>
          </div>

          <div className="cc-demo-container">
            <div className="cc-tab-pill-bar">
              {(["tenglish", "telugu", "english"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`cc-tab-item ${activeTab === tab ? "active" : ""}`}
                >
                  {tab === "tenglish" && "tenglish (romanized)"}
                  {tab === "telugu" && "తెలుగు (native script)"}
                  {tab === "english" && "english"}
                </button>
              ))}
            </div>

            <div className="cc-demo-mockup">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", alignItems: "center" }}>
                {demoPhrases[activeTab].map((item, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: item.highlight ? item.pill : "transparent",
                      color: item.highlight && item.darkText ? "#111827" : "#ffffff",
                      borderRadius: item.highlight ? "8px" : "0px",
                      padding: item.highlight ? "5px 14px" : "0px",
                      transform: item.highlight ? "scale(1.05) rotate(-1.5deg)" : "none",
                      fontWeight: 900,
                      fontSize: "26px",
                      textShadow: item.highlight ? "none" : "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
                      transition: "all 0.18s ease"
                    }}
                  >
                    {item.text}
                  </span>
                ))}
              </div>
              <span className="cc-mockup-watermark">preset: boxes-pink-bubble</span>
            </div>
          </div>
        </section>
      </div>

      {/* 4. Templates Section */}
      <section id="templates" className="cc-wrap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "36px", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <span className="cc-subtag">38+ animation templates</span>
            <h2 className="cc-title">tailored for viral short-form retention</h2>
            <p className="cc-desc">every preset is tuned for high-energy vertical reels, bounce physics, and neon glow effects.</p>
          </div>
          <button onClick={onStart} className="cc-btn-solid">
            <span>open all in studio</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="cc-templates-grid">
          {[
            { cat: "trending", title: "hormozi punch", border: "#f59e0b" },
            { cat: "boxes", title: "pink bubble", border: "#ec4899" },
            { cat: "boxes", title: "yellow marker", border: "#eab308" },
            { cat: "animations", title: "neon glow", border: "#00e5a0" },
            { cat: "transitions", title: "split stagger", border: "#0aa879" },
            { cat: "typo", title: "serif luxury", border: "#78716c" }
          ].map((item, idx) => (
            <div key={idx} className="cc-tmpl-card" style={{ borderTop: `2px solid ${item.border}` }}>
              <div className="cc-tmpl-preview">
                <span>Caption Craft</span>
              </div>
              <div>
                <span style={{ fontSize: "9px", fontWeight: 800, color: item.border, textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                  {item.cat}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#f1f5f9" }}>
                  {item.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Features Section */}
      <div id="features" className="cc-section-dark">
        <section className="cc-wrap">
          <div className="cc-head-center">
            <span className="cc-subtag">client-side advantages</span>
            <h2 className="cc-title">why top telugu creators pick CaptionCraft</h2>
          </div>

          <div className="cc-features-grid">
            <div className="cc-feat-card">
              <div className="cc-feat-icon"><Languages size={20} /></div>
              <h3 className="cc-feat-title">tenglish & telugu transliteration</h3>
              <p className="cc-feat-text">switch between native telugu script and clean phonetic tenglish without manual typing. Slang and regional idioms are transcribed naturally.</p>
            </div>

            <div className="cc-feat-card">
              <div className="cc-feat-icon"><ShieldCheck size={20} /></div>
              <h3 className="cc-feat-title">local webgpu whisper engine</h3>
              <p className="cc-feat-text">transcription runs inside your web browser. Your video never uploads to an external server; no bandwidth wait times and absolute data privacy.</p>
            </div>

            <div className="cc-feat-card">
              <div className="cc-feat-icon"><Sliders size={20} /></div>
              <h3 className="cc-feat-title">word-by-word timeline editing</h3>
              <p className="cc-feat-text">nudge word timestamps down to the millisecond. Split phrases, retune styling, and sync emphasis boxes with the speaker rhythm.</p>
            </div>

            <div className="cc-feat-card">
              <div className="cc-feat-icon"><Type size={20} /></div>
              <h3 className="cc-feat-title">safe typography for compound ligatures</h3>
              <p className="cc-feat-text">custom font cascade prevents telugu ottulu and matras from breaking or cutting off across canvas margins.</p>
            </div>

            <div className="cc-feat-card">
              <div className="cc-feat-icon"><Eye size={20} /></div>
              <h3 className="cc-feat-title">reels & shorts safe zone overlays</h3>
              <p className="cc-feat-text">preview real mobile interface masks for instagram reels and youtube shorts so captions never get obscured by usernames or buttons.</p>
            </div>

            <div className="cc-feat-card">
              <div className="cc-feat-icon"><Film size={20} /></div>
              <h3 className="cc-feat-title">fast local canvas mp4 rendering</h3>
              <p className="cc-feat-text">render high-definition burned-in video directly from the browser canvas or download standard srt files in seconds.</p>
            </div>
          </div>
        </section>
      </div>

      {/* 6. How it works */}
      <section id="how-it-works" className="cc-wrap">
        <div className="cc-head-center">
          <span className="cc-subtag">3 simple steps</span>
          <h2 className="cc-title">how to create captions</h2>
          <p className="cc-desc">from raw video clip to viral post in under 3 minutes.</p>
        </div>

        <div className="cc-steps-row">
          <div className="cc-step-box">
            <div className="cc-step-index">01</div>
            <h4 style={{ fontWeight: 800, fontSize: "15px", marginBottom: "8px" }}>upload media</h4>
            <p style={{ fontSize: "13px", color: "#9ca9a4", lineHeight: 1.6 }}>
              drag and drop any audio or video file; audio extraction begins immediately in your browser tab.
            </p>
          </div>

          <div className="cc-step-box">
            <div className="cc-step-index">02</div>
            <h4 style={{ fontWeight: 800, fontSize: "15px", marginBottom: "8px" }}>select script & preset</h4>
            <p style={{ fontSize: "13px", color: "#9ca9a4", lineHeight: 1.6 }}>
              choose telugu, tenglish, or english, then apply any of the 38+ presets with custom boxes and glow.
            </p>
          </div>

          <div className="cc-step-box">
            <div className="cc-step-index">03</div>
            <h4 style={{ fontWeight: 800, fontSize: "15px", marginBottom: "8px" }}>export watermark-free</h4>
            <p style={{ fontSize: "13px", color: "#9ca9a4", lineHeight: 1.6 }}>
              preview frame-by-frame with safe zones and download high-resolution video directly to your desktop.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Pricing Section */}
      <div id="pricing" className="cc-section-dark">
        <section className="cc-wrap">
          <div className="cc-head-center">
            <span className="cc-subtag">transparent creator pricing</span>
            <h2 className="cc-title">simple, affordable plans for creators</h2>
            <p className="cc-desc">use the free tier locally forever, or upgrade for cloud whisper models and 4k exports.</p>
          </div>

          <div className="cc-pricing-toggle">
            <span style={{ fontSize: "13px", color: billingCycle === "monthly" ? "#ffffff" : "#64748b", fontWeight: 700 }}>monthly</span>
            <button
              onClick={() => setBillingCycle(prev => prev === "monthly" ? "yearly" : "monthly")}
              style={{
                width: "48px",
                height: "26px",
                borderRadius: "14px",
                background: "#00e5a0",
                border: "none",
                position: "relative",
                cursor: "pointer",
                padding: "3px"
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#050807",
                  transform: billingCycle === "yearly" ? "translateX(22px)" : "translateX(0px)",
                  transition: "transform 0.18s ease"
                }}
              />
            </button>
            <span style={{ fontSize: "13px", color: billingCycle === "yearly" ? "#ffffff" : "#64748b", fontWeight: 700 }}>
              yearly <span style={{ color: "#00e5a0", fontSize: "11px", fontWeight: 800 }}>save 20%</span>
            </span>
          </div>

          <div className="cc-pricing-grid">
            <div className="cc-plan-card">
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#9ca9a4", textTransform: "uppercase" }}>starter</span>
              <div className="cc-price-figure">₹0</div>
              <span className="cc-price-period">free forever for individual creators</span>

              <ul className="cc-plan-perks">
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> 100% in-browser local whisper</li>
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> telugu, tenglish & english support</li>
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> all 38+ animation presets</li>
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> zero watermark on exports</li>
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> 1080p canvas video rendering</li>
              </ul>

              <button onClick={onStart} className="cc-btn-ghost" style={{ marginTop: "auto", width: "100%", padding: "12px" }}>
                start free studio
              </button>
            </div>

            <div className="cc-plan-card featured">
              <div className="cc-plan-popular">most popular</div>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#00e5a0", textTransform: "uppercase" }}>creator pro</span>
              <div className="cc-price-figure">
                {billingCycle === "monthly" ? "₹499" : "₹399"}
                <span style={{ fontSize: "14px", color: "#9ca9a4", fontWeight: 500 }}>/month</span>
              </div>
              <span className="cc-price-period">billed {billingCycle === "yearly" ? "annually at ₹4,788" : "monthly"}</span>

              <ul className="cc-plan-perks">
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> everything in starter</li>
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> cloud gemini telugu transcription</li>
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> 4k 60fps video export support</li>
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> priority multi-speaker diarization</li>
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> custom brand fonts & color presets</li>
              </ul>

              <button onClick={() => scrollTo("signup")} className="cc-btn-solid" style={{ marginTop: "auto", width: "100%", justifyContent: "center", padding: "12px" }}>
                upgrade to pro
              </button>
            </div>

            <div className="cc-plan-card">
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#9ca9a4", textTransform: "uppercase" }}>studio / agency</span>
              <div className="cc-price-figure">
                {billingCycle === "monthly" ? "₹1,499" : "₹1,199"}
                <span style={{ fontSize: "14px", color: "#9ca9a4", fontWeight: 500 }}>/month</span>
              </div>
              <span className="cc-price-period">unlimited team members & batch rendering</span>

              <ul className="cc-plan-perks">
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> batch captioning queue</li>
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> custom team preset library</li>
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> shared cloud workspace</li>
                <li className="cc-perk-item"><Check size={16} color="#00e5a0" /> dedicated creator support</li>
              </ul>

              <button onClick={() => scrollTo("signup")} className="cc-btn-ghost" style={{ marginTop: "auto", width: "100%", padding: "12px" }}>
                contact sales
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* 8. Sign Up & Open Studio Card */}
      <section id="signup" className="cc-wrap">
        <div className="cc-signup-shell">
          <span className="cc-subtag">start in seconds</span>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 900, margin: "8px 0 12px 0", color: "#ffffff" }}>
            ready to style your next video?
          </h2>
          <p style={{ fontSize: "14px", color: "#9ca9a4", maxWidth: "520px", margin: 0, lineHeight: 1.6 }}>
            create an account to save custom presets across devices, or enter the studio immediately without signing up.
          </p>

          {signedUp ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#00e5a0", fontWeight: 700, marginTop: "24px", fontSize: "14px" }}>
              <CheckCircle2 size={18} />
              <span>welcome! opening studio now...</span>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="cc-signup-form">
              <input
                type="email"
                placeholder="enter your email address"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                required
                className="cc-input"
              />
              <button type="submit" className="cc-btn-solid" style={{ padding: "13px 22px" }}>
                <span>create account</span>
                <ChevronRight size={16} />
              </button>
            </form>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "26px" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>or skip registration</span>
            <button
              onClick={onStart}
              style={{
                background: "none",
                border: "none",
                color: "#00e5a0",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              launch studio directly
            </button>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="cc-footer">
        <p>© 2026 CaptionCraft. Built with love for Telugu content creators.</p>
      </footer>
    </div>
  );
};
