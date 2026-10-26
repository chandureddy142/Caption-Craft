import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock } from "lucide-react";

export const PrivacyPage: React.FC = () => {
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
            <Shield size={14} /> Creator Data Protection
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
            Privacy Policy
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            Last revised: 26 October 2026 • Governed under the Digital Personal Data Protection Act, 2023 (India)
          </p>
        </div>

        <section style={{ marginBottom: "32px", lineHeight: 1.7, fontSize: "14.5px", color: "var(--text-secondary)" }}>
          <p style={{ margin: "0 0 14px 0" }}>
            This Privacy Policy governs the operations of <strong>Create Captions</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), registered in India. It details our commitments regarding the information we gather when creators access our web studio, how media files and transcripts are processed, our subprocessor safeguards, and your data sovereignty rights under Indian and international privacy statutes.
          </p>
          <p style={{ margin: 0 }}>
            By registering for an account, accessing our studio tools, or uploading media for caption generation, you acknowledge and agree to the procedures outlined in this policy.
          </p>
        </section>

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
          <Lock size={24} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h3 style={{ color: "var(--card-text-primary)", fontWeight: 800, fontSize: "16px", margin: "0 0 8px 0" }}>
              Zero AI Model Training Guarantee
            </h3>
            <p style={{ color: "var(--card-text-secondary)", fontSize: "13.5px", lineHeight: 1.6, margin: 0 }}>
              Your footage, spoken audio, and written subtitles remain strictly your proprietary creative property. Create Captions does not sell your creative assets, nor do we feed, retain, or repurpose your uploaded recordings or generated transcripts to train our own artificial intelligence systems or any third-party foundation models.
            </p>
          </div>
        </div>

        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            1. Information We Collect
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "14px" }}>
            We adhere strictly to data minimization standards, capturing only what is required to execute video transcription, synchronize typography, maintain your subscription, and secure our systems:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "var(--nav-bg)", border: "1px solid var(--box-border)", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--card-text-primary)", marginBottom: "4px" }}>
                Account & Authentication Identifiers
              </div>
              <div style={{ fontSize: "13.5px", color: "var(--card-text-secondary)", lineHeight: 1.6 }}>
                Your email address, hashed credentials, and unique system user token generated upon registration. If SMS or mobile verification is activated, phone numbers and one-time verification tokens are converted to irreversible cryptographic hashes rather than stored in plaintext.
              </div>
            </div>

            <div style={{ background: "var(--nav-bg)", border: "1px solid var(--box-border)", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--card-text-primary)", marginBottom: "4px" }}>
                Creator Workspace & Timeline Data
              </div>
              <div style={{ fontSize: "13.5px", color: "var(--card-text-secondary)", lineHeight: 1.6 }}>
                Project titles, timestamp cues, phonetic Telugu Lipi and Tenglish transliteration selections, font choices, animation templates, and color preferences needed to allow you to resume editing across browser sessions.
              </div>
            </div>

            <div style={{ background: "var(--nav-bg)", border: "1px solid var(--box-border)", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--card-text-primary)", marginBottom: "4px" }}>
                Billing & Transaction Records
              </div>
              <div style={{ fontSize: "13.5px", color: "var(--card-text-secondary)", lineHeight: 1.6 }}>
                Payment confirmation tokens, transaction timestamps, purchased plan categories (monthly subscriptions or export bundles), and invoice identifiers. We never handle or archive complete credit card numbers, CVVs, or UPI PINs; all transactions are processed through certified, bank-grade payment gateways.
              </div>
            </div>

            <div style={{ background: "var(--nav-bg)", border: "1px solid var(--box-border)", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--card-text-primary)", marginBottom: "4px" }}>
                Technical, Security & Abuse Prevention Logs
              </div>
              <div style={{ fontSize: "13.5px", color: "var(--card-text-secondary)", lineHeight: 1.6 }}>
                Browser type, operating system details, anonymous browser environment hashes (used exclusively to protect against automated registration abuse), and server access logs containing IP addresses recorded during login. These IP logs are held temporarily and retained strictly for security diagnostics and rate limiting.
              </div>
            </div>

            <div style={{ background: "var(--nav-bg)", border: "1px solid var(--box-border)", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--card-text-primary)", marginBottom: "4px" }}>
                Support Tickets & Visual Diagnostics
              </div>
              <div style={{ fontSize: "13.5px", color: "var(--card-text-secondary)", lineHeight: 1.6 }}>
                Communications, feedback notes, and voluntary screenshot attachments uploaded through our Help Desk to assist engineering in resolving timeline, typography, or rendering bugs.
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            2. Video & Audio Processing Architecture
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "12px" }}>
            Create Captions is built with a localized processing approach:
          </p>
          <ul style={{ paddingLeft: "22px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.8 }}>
            <li>
              <strong>On-Device Speech Inference:</strong> When you select a video for transcription, audio decoding and phonetic recognition take place using browser execution environments. Audio waveforms are parsed in transient, volatile device memory.
            </li>
            <li>
              <strong>Transient Buffer Lifecycles:</strong> Raw media files are not permanently stored on our external servers. Once your editing session ends or your final video is rendered and saved to your device, temporary in-browser media caches are cleared.
            </li>
            <li>
              <strong>Strict Internal Access Limitations:</strong> No member of our team inspects your uploaded media unless you explicitly submit a support request asking us to review a specific playback or transcription failure, after which access is revoked immediately upon ticket resolution.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            3. How We Share Data (Subprocessors)
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "14px" }}>
            We do not sell, rent, or trade your personal data. We coordinate solely with verified service providers who operate under contractual data protection terms to perform essential software infrastructure functions:
          </p>
          <ul style={{ paddingLeft: "22px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.8 }}>
            <li><strong>Encrypted Database & Auth Clusters:</strong> Managed database infrastructure providing authenticated account access, credential hashing, and row-level data segregation.</li>
            <li><strong>Payment Gateways:</strong> Certified PCI-DSS compliant payment networks managing subscription autopay billing, card verification, and UPI payment routing.</li>
            <li><strong>Transactional Email Relays:</strong> Certified messaging services delivering account recovery instructions, invoice receipts, and mandatory security notifications.</li>
            <li><strong>Error Monitoring & Performance Telemetry:</strong> Diagnostic tools that detect front-end browser crashes and memory bottlenecks without recording unrendered video files or audio streams.</li>
            <li><strong>Support Desk Hosting:</strong> Dedicated ticketing infrastructure that manages user correspondence and holds optional troubleshooting screenshots until an inquiry is completed.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            4. Data Retention Schedules
          </h2>
          <div style={{ borderLeft: "3px solid var(--accent-primary)", paddingLeft: "18px", margin: "14px 0" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, margin: "0 0 10px 0" }}>
              <strong>Active Account Data:</strong> Your project preferences, subtitle cues, and account records are kept while your account remains active.
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, margin: "0 0 10px 0" }}>
              <strong>Account Deletion:</strong> If you delete your account or submit a formal erasure request, your profile, authentication keys, and workspace metadata are permanently deleted or irreversibly anonymized within ninety (90) days, excluding statutory tax and billing records we are mandated by law to retain.
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, margin: "0 0 10px 0" }}>
              <strong>Support Screenshots:</strong> Diagnostic images attached to tickets are automatically removed upon ticket closure.
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
              <strong>Billing & Tax Receipts:</strong> Financial audit records are stored in compliance with Indian regulatory and taxation requirements.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            5. Your Rights Under the DPDP Act, 2023
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "12px" }}>
            As a data principal under the Digital Personal Data Protection Act of India, you are entitled to enforceable statutory protections:
          </p>
          <ul style={{ paddingLeft: "22px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.8 }}>
            <li><strong>Right to Summary & Access:</strong> You can request a summary of the personal information we maintain concerning your account.</li>
            <li><strong>Right to Correction & Erasure:</strong> You can request the rectification of inaccurate records or the complete removal of your profile and data.</li>
            <li><strong>Right to Withdraw Consent:</strong> Where data processing is rooted in voluntary consent, you may withdraw that consent at any time from your account settings.</li>
            <li><strong>Right to Nominate:</strong> You have the right to nominate an individual to handle your digital data assets in accordance with applicable legal provisions.</li>
            <li>
              <strong>Mandatory 72-Hour Breach Notification:</strong> In the event of a verified personal data breach threatening the safety or rights of data principals, Create Captions will inform affected creators and the Data Protection Board of India within 72 hours of becoming cognizant of the incident.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            6. Government & Law Enforcement Requests
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "12px" }}>
            If contacted by law enforcement agencies, judiciary bodies, or regulatory authorities requesting creator information:
          </p>
          <ul style={{ paddingLeft: "22px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.8 }}>
            <li>We independently verify that the inquiry possesses proper statutory validity and official legal jurisdiction.</li>
            <li>We reject or formally challenge subpoenas and notices that are overly broad, vague, or procedurally deficient.</li>
            <li>We furnish strictly the narrowest scope of data legally demanded to satisfy the order.</li>
            <li>We inform the affected account owner regarding the disclosure demand, unless explicitly prohibited under statutory non-disclosure directives.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            7. Minors & Children&apos;s Privacy
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
            Create Captions is intended exclusively for creators who are 18 years of age or older. We do not intentionally capture or maintain personal information from individuals below 18 years of age. If you discover that a minor has registered an account without parental or guardian authorization, contact our Help Desk and we will promptly remove the associated records.
          </p>
        </section>

        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            8. Policy Modifications
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
            We may periodically revise this Privacy Policy to reflect enhancements to our captioning engines, new typography capabilities, or statutory regulatory adjustments. Whenever material modifications are implemented, we will update the revision timestamp at the top of this document. Continued engagement with Create Captions subsequent to updates indicates acceptance of the amended terms.
          </p>
        </section>

        <section style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px" }}>
            9. Grievance Officer & Official Inquiries
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.7, marginBottom: "14px" }}>
            To exercise your DPDP rights, submit a data removal directive, or address a formal grievance, contact our designated Grievance Officer:
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
            <div><strong>Data Fiduciary:</strong> Create Captions (India)</div>
            <div><strong>Grievance Officer:</strong> Grievance Redressal Cell</div>
            <div><strong>Email Address:</strong> <a href="mailto:support@createcaptions.in" style={{ color: "var(--accent-primary)", fontWeight: 700, textDecoration: "none" }}>support@createcaptions.in</a></div>
            <div><strong>Online Help Desk:</strong> <Link to="/support" style={{ color: "var(--accent-primary)", fontWeight: 700, textDecoration: "none" }}>Support Ticket Portal</Link></div>
            <div style={{ marginTop: "10px", fontSize: "12.5px", color: "var(--card-text-secondary)", borderTop: "1px solid var(--box-border)", paddingTop: "10px" }}>
              In compliance with Indian IT and DPDP regulations, all formal complaints and requests will be acknowledged within forty-eight (48) hours and resolved within thirty (30) days of receipt.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
