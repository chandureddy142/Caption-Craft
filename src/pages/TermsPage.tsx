import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

export const TermsPage: React.FC = () => {

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("cc-in-view");
          } else {
            entry.target.classList.remove("cc-in-view");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    const elements = document.querySelectorAll(".cc-scroll-reveal");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-app)",
        color: "var(--text-primary)",
        transition: "background-color 0.2s ease, color 0.2s ease",
        padding: "48px 24px 100px",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

      <style>{`
        .cc-scroll-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .cc-scroll-reveal.cc-in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .cc-stagger-1 { transition-delay: 0.05s; }
        .cc-stagger-2 { transition-delay: 0.12s; }
        .cc-stagger-3 { transition-delay: 0.20s; }
        .cc-stagger-4 { transition-delay: 0.28s; }
        .cc-stagger-5 { transition-delay: 0.36s; }
        .cc-stagger-6 { transition-delay: 0.44s; }
      `}</style>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--accent-primary)",
            textDecoration: "none",
            marginBottom: "32px"
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div style={{ marginBottom: "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--accent-primary)",
              background: "var(--accent-surface)",
              border: "1px solid var(--border-strong)",
              padding: "4px 14px",
              borderRadius: "999px",
              marginBottom: "16px",
              textTransform: "uppercase",
              letterSpacing: "0.06em"
            }}
          >
            <FileText size={14} /> Comprehensive Legal Agreement
          </div>
          <h1
            style={{
              fontSize: "clamp(32px, 4.5vw, 44px)",
              fontWeight: 900,
              margin: "0 0 12px 0",
              letterSpacing: "-0.03em",
              color: "var(--text-primary)"
            }}
          >
            Terms of Service
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            Last revised: 26 October 2026 • Governed by the Laws of the Republic of India
          </p>
        </div>

        <div
          style={{
            background: "var(--nav-bg)",
            border: "1px solid var(--box-border)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "40px",
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
            boxShadow: "var(--card-shadow)"
          }}
        >
          <ShieldCheck size={24} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h3 style={{ color: "var(--card-text-primary)", fontWeight: 800, fontSize: "16px", margin: "0 0 8px 0" }}>
              Creator Sovereignty & Rights Summary
            </h3>
            <p style={{ color: "var(--card-text-secondary)", fontSize: "13.5px", lineHeight: 1.6, margin: 0 }}>
              You retain 100% intellectual property ownership of your media, raw footage, transcripts, and final rendered videos. Create Captions operates strictly as an in-browser software suite to transcribe spoken speech, format regional typography, and burn stylized subtitles upon your direct instruction.
            </p>
          </div>
        </div>

        <section className="cc-scroll-reveal" style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            1. Acceptance, Eligibility & Account Responsibilities
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "12px" }}>
            These Terms of Service constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Creator&rdquo;, or &ldquo;you&rdquo;) and Create Captions (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By creating an account, accessing our editor, or transcribing audio files, you affirm that:
          </p>
          <ul style={{ paddingLeft: "22px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.8 }}>
            <li>You are at least 18 years of age and legally competent to enter into enforceable contracts under Indian law.</li>
            <li>You will maintain the strict confidentiality of your authentication credentials and accept sole responsibility for all timeline edits, video exports, and billing actions initiated under your account.</li>
            <li>You will immediately notify our support team if you suspect any unauthorized access or security breach involving your credentials.</li>
          </ul>
        </section>

        <section className="cc-scroll-reveal" style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            2. Video Ownership & Intellectual Property Rights
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "12px" }}>
            You maintain complete and unencumbered ownership of all intellectual property rights in and to your original audio tracks, video footage, script texts, and rendered subtitle files:
          </p>
          <ul style={{ paddingLeft: "22px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.8 }}>
            <li>
              <strong>Scope of License:</strong> You grant Create Captions only a limited, non-exclusive, non-transferable license to decode, extract, transliterate, and render subtitles onto your media strictly to execute the features you trigger in the studio.
            </li>
            <li>
              <strong>No Secondary Rights or Marketing Usage:</strong> We do not claim any copyright, distribution, or ownership rights over your creative output, nor do we publicly display, license, or publish your unedited or captioned media without your prior explicit written authorization.
            </li>
            <li>
              <strong>Warranties of Title:</strong> You represent and warrant that you own or possess all necessary rights, licenses, and releases for all audio and visual assets you import into our studio.
            </li>
          </ul>
        </section>

        <section className="cc-scroll-reveal" style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            3. Acceptable Use & Creator Conduct
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "12px" }}>
            Create Captions is engineered to empower authentic creators. You agree not to utilize our platform to process, generate subtitles for, or export content that:
          </p>
          <ul style={{ paddingLeft: "22px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.8 }}>
            <li>Infringes upon third-party copyrights, trademarks, privacy rights, or publicity rights.</li>
            <li>Contains unlawful, harmful, defamatory, sexually explicit, abusive, or terroristic material under Indian statutory law.</li>
            <li>Attempts to bypass, interfere with, or reverse-engineer software verification routines, export quotas, watermark mechanics, or service tiers.</li>
            <li>Distributes automated scripts, scraping bots, or network denial-of-service traffic designed to degrade platform availability for other creators.</li>
          </ul>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginTop: "10px" }}>
            We reserve the right to suspend or terminate accounts found violating these conduct provisions without prior warning.
          </p>
        </section>

        <section className="cc-scroll-reveal" style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            4. Service Tiers, Minutes Billing & Export Limits
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "var(--nav-bg)", border: "1px solid var(--box-border)", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--card-text-primary)", marginBottom: "4px" }}>
                Free Evaluation Tier
              </div>
              <div style={{ fontSize: "13.5px", color: "var(--card-text-secondary)", lineHeight: 1.6 }}>
                New accounts receive a complimentary monthly quota (including 3 evaluation minutes and standard exports with a subtle Create Captions watermark). Free minutes and monthly export allowances refresh on the 1st of each calendar month and do not roll over.
              </div>
            </div>

            <div style={{ background: "var(--nav-bg)", border: "1px solid var(--box-border)", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--card-text-primary)", marginBottom: "4px" }}>
                Minutes Deduction Logic
              </div>
              <div style={{ fontSize: "13.5px", color: "var(--card-text-secondary)", lineHeight: 1.6 }}>
                Transcription minutes are deducted once when an uploaded audio or video track is first processed. Usage is calculated in 15-second billing increments with a 30-second minimum duration per uploaded file to account for model runtime initialization. Re-styling fonts, editing words, modifying timestamps, or re-exporting the same project does not consume additional minutes.
              </div>
            </div>

            <div style={{ background: "var(--nav-bg)", border: "1px solid var(--box-border)", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--card-text-primary)", marginBottom: "4px" }}>
                Paid Subscriptions & Export Bundles
              </div>
              <div style={{ fontSize: "13.5px", color: "var(--card-text-secondary)", lineHeight: 1.6 }}>
                Paid subscriptions provide expanded monthly minutes, unrestricted watermark-free 1080p rendering, and prioritized regional font templates. Allocations reset at each recurring billing cycle.
              </div>
            </div>
          </div>
        </section>

        <section className="cc-scroll-reveal" style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            5. Subscriptions, UPI Autopay & Cancellation Rules
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "12px" }}>
            All commercial transactions are processed in Indian Rupees (INR / ₹) through PCI-DSS compliant Indian payment gateways:
          </p>
          <ul style={{ paddingLeft: "22px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.8 }}>
            <li>
              <strong>Autopay Mandates:</strong> Recurring monthly plans are automatically renewed via your authorized UPI Autopay mandate, debit card, or credit card until cancelled by the user.
            </li>
            <li>
              <strong>Cancellation at Any Time:</strong> You may cancel your subscription at any moment from your account settings. Cancellation stops all future scheduled recurring charges. Your paid benefits and remaining plan minutes will remain fully active until the natural end of your current paid billing period.
            </li>
            <li>
              <strong>Digital Delivery:</strong> Create Captions delivers entirely digital software functionality. No tangible goods are shipped. Access rights, quota increments, and export capabilities are provisioned electronically immediately upon successful payment confirmation.
            </li>
          </ul>
        </section>

        <section className="cc-scroll-reveal" style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            6. Refund Policy & Dispute Protocols
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "12px" }}>
            Because speech recognition and video export pipelines consume real-time computational infrastructure upon initiation:
          </p>
          <ul style={{ paddingLeft: "22px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.8 }}>
            <li>
              <strong>7-Day Initial Subscription Window:</strong> First-time monthly subscribers may request a full refund within seven (7) days of their initial purchase, provided that fewer than three (3) total minutes of transcription or export have been utilized.
            </li>
            <li>
              <strong>Non-Refundable Transactions:</strong> One-time minute packs, discounted multi-month passes, or accounts that have exported watermark-free videos are final and non-refundable.
            </li>
            <li>
              <strong>Service Non-Delivery:</strong> In the event of a verified technical platform failure where payment succeeded but quota minutes were not credited to your workspace, our engineering team will promptly credit the missing minutes or issue a full refund upon verification.
            </li>
          </ul>
        </section>

        <section className="cc-scroll-reveal" style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            7. Speech Accuracy & Technical Disclaimers
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "10px" }}>
            Create Captions is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, whether express or implied.
          </p>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
            While our regional speech processing pipeline is optimized for Telugu syntax and conversational Tenglish, transcription accuracy is naturally dependent on audio recording clarity, background ambient noise, musical overlap, and regional dialect variations. Creators are advised to preview their subtitle timeline before rendering final video exports.
          </p>
        </section>

        <section className="cc-scroll-reveal" style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            8. Limitation of Liability
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
            To the maximum extent permitted under applicable law, Create Captions, its founders, and affiliates shall not be liable for any indirect, incidental, special, punitive, or consequential damages, or any loss of profits, audience reach, social media standing, or data. Our total cumulative liability arising out of or related to your use of Create Captions shall be capped at the total amount paid by you to the platform in the twelve (12) months preceding the claim, or ₹1,000, whichever is greater.
          </p>
        </section>

        <section className="cc-scroll-reveal" style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            9. Indemnification
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
            You agree to defend, indemnify, and hold harmless Create Captions and its operators from and against any third-party claims, liabilities, damages, judgments, or expenses (including reasonable legal fees) arising from content you upload, your violation of third-party intellectual property rights, or your breach of these Terms of Service.
          </p>
        </section>

        <section className="cc-scroll-reveal" style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            10. Governing Law & Dispute Resolution
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "14px" }}>
            These terms and any legal actions arising from the platform are governed exclusively by the laws of India. Courts situated in India shall possess exclusive jurisdiction over disputes, subject to statutory consumer protection provisions.
          </p>
          <div style={{
            background: "var(--nav-bg)",
            border: "1px solid var(--box-border)",
            borderRadius: "14px",
            padding: "20px 22px",
            fontSize: "14px",
            color: "var(--card-text-primary)",
            lineHeight: 1.7,
            boxShadow: "var(--card-shadow)"
          }}>
            <div><strong>Entity:</strong> Create Captions (India)</div>
            <div><strong>Grievance Redressal:</strong> Legal & Billing Inquiries</div>
            <div><strong>Email Address:</strong> <a href="mailto:support@createcaptions.in" style={{ color: "var(--accent-primary)", fontWeight: 700, textDecoration: "none" }}>support@createcaptions.in</a></div>
            <div><strong>Online Help Desk:</strong> <Link to="/support" style={{ color: "var(--accent-primary)", fontWeight: 700, textDecoration: "none" }}>Support Ticket Portal</Link></div>
            <div style={{ marginTop: "10px", fontSize: "12.5px", color: "var(--card-text-secondary)", borderTop: "1px solid var(--box-border)", paddingTop: "10px" }}>
              Formal billing complaints or legal notices submitted to our grievance desk are acknowledged within forty-eight (48) hours and addressed within thirty (30) business days.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
