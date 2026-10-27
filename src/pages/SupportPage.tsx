import React, { useState, useEffect } from "react";
import { LifeBuoy, Mail, Clock, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Why does transcription happen completely on my device?",
    answer: "Create Captions runs speech recognition directly inside your browser on your device. This ensures complete privacy so your unedited videos and audio never leave your computer."
  },
  {
    question: "How do I switch between Telugu and Tenglish?",
    answer: "Before starting transcription or inside the editor, you can toggle between native Telugu and Tenglish. You can also re-transliterate any specific word directly from the timeline."
  },
  {
    question: "What video and audio formats are supported?",
    answer: "Create Captions supports MP4, MOV, WEBM for video files, as well as MP3, WAV, and M4A audio files. Rendered videos can be exported directly as 1080p MP4 or downloaded as SRT subtitle tracks."
  },
  {
    question: "What should I do if a word is misheard by the AI?",
    answer: "Click on any word block directly in the timeline or transcript panel to edit its spelling or fine-tune its start/end timestamp without having to re-transcribe the entire video."
  }
];

export const SupportPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Initialize and load Tally embed auto-sizer
  useEffect(() => {
    const scriptSrc = "https://tally.so/widgets/embed.js";
    let script = document.querySelector(`script[src="${scriptSrc}"]`) as HTMLScriptElement | null;
    
    if (!script) {
      script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      script.onload = () => {
        if (typeof (window as any).Tally !== "undefined") {
          (window as any).Tally.loadEmbeds();
        }
      };
      document.body.appendChild(script);
    } else {
      if (typeof (window as any).Tally !== "undefined") {
        (window as any).Tally.loadEmbeds();
      }
    }
  }, []);

  
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

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-app)",
      color: "var(--text-primary)",
      padding: "60px 24px 100px",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      transition: "background-color 0.2s ease, color 0.2s ease"
    }}>
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
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--accent-primary)",
            background: "var(--accent-surface)",
            border: "1px solid var(--accent-primary)",
            padding: "4px 14px",
            borderRadius: "999px",
            marginBottom: "16px",
            textTransform: "uppercase",
            letterSpacing: "0.06em"
          }}>
            <LifeBuoy size={14} /> Help Desk
          </div>
          <h1 style={{
            fontSize: "clamp(32px, 4.5vw, 48px)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            margin: "0 0 12px 0",
            color: "var(--text-primary)"
          }}>
            How can we help you?
          </h1>
          <p style={{
            fontSize: "15px",
            color: "var(--text-secondary)",
            maxWidth: "560px",
            margin: "0 auto",
            lineHeight: 1.6,
            fontWeight: 500
          }}>
            Have a question, encountered a bug, or need help with typography? Check the quick answers below or submit a ticket.
          </p>
        </div>

        {/* Info Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "36px"
        }}>
          <div style={{
            background: "var(--nav-bg)",
            border: "1px solid var(--box-border)",
            borderRadius: "14px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "var(--card-shadow)"
          }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "var(--accent-surface)",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--card-text-primary)" }}>Response Window</div>
              <div style={{ fontSize: "12px", color: "var(--card-text-secondary)", marginTop: "2px" }}>Typically within 24 hours</div>
            </div>
          </div>

          <div style={{
            background: "var(--nav-bg)",
            border: "1px solid var(--box-border)",
            borderRadius: "14px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "var(--card-shadow)"
          }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "var(--accent-surface)",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Mail size={20} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--card-text-primary)" }}>Direct Email</div>
              <a
                href="mailto:support@createcaptions.in"
                style={{ fontSize: "12px", color: "var(--accent-primary)", fontWeight: 700, marginTop: "2px", display: "inline-block", textDecoration: "none" }}
              >
                support@createcaptions.in
              </a>
            </div>
          </div>
        </div>

        {/* Support Ticket Container - Crisp contrast & generous height so nothing is cropped */}
        <div style={{
          backgroundColor: "#ffffff",
          border: "1px solid var(--box-border)",
          borderRadius: "18px",
          padding: "32px 24px 28px",
          marginBottom: "56px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          overflow: "visible",
          position: "relative"
        }}>
          <iframe
            data-tally-src="https://tally.so/embed/peeyxq?alignLeft=1&hideTitle=1&transparentBackground=0&dynamicHeight=1"
            loading="lazy"
            width="100%"
            height="720"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            title="Submit a Support Ticket"
            style={{
              border: "none",
              width: "100%",
              minHeight: "720px",
              display: "block"
            }}
          />
        </div>

        {/* FAQ Section */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <HelpCircle size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Frequently Asked Questions</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  onClick={() => toggleFaq(index)}
                  style={{
                    background: "var(--nav-bg)",
                    border: "1px solid var(--box-border)",
                    borderRadius: "12px",
                    padding: "18px 20px",
                    cursor: "pointer",
                    boxShadow: "var(--card-shadow)",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--card-text-primary)" }}>{faq.question}</span>
                    {isOpen ? <ChevronUp size={18} color="var(--accent-primary)" /> : <ChevronDown size={18} color="var(--card-text-muted)" />}
                  </div>
                  {isOpen && (
                    <p style={{ margin: "12px 0 0 0", fontSize: "14px", color: "var(--card-text-secondary)", lineHeight: 1.6 }}>
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SupportPage;
