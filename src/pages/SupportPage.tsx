import React, { useState } from "react";
import { LifeBuoy, Mail, MessageSquare, Clock, HelpCircle, Check, Send, ChevronDown, ChevronUp, ImagePlus, X } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Why does transcription happen completely on my device?",
    answer: "Create Captions runs the speech recognition model inside your browser using WebAssembly and WebGPU. This ensures complete privacy so your unedited videos and audio never leave your computer."
  },
  {
    question: "How do I switch between Telugu Lipi and Tenglish?",
    answer: "Before starting transcription or inside the editor, you can toggle between native Telugu Lipi and phonetic Tenglish. You can also re-transliterate any specific word directly from the timeline."
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
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [screenshot, setScreenshot] = useState<{ file: File; preview: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "Technical issue",
    message: ""
  });

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Please upload an image smaller than 5MB");
        return;
      }
      const preview = URL.createObjectURL(file);
      setScreenshot({ file, preview });
    }
  };

  const removeScreenshot = () => {
    if (screenshot) {
      URL.revokeObjectURL(screenshot.preview);
      setScreenshot(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim() || !formData.email.trim()) return;
    setTicketSubmitted(true);
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
            Have a question, encountered a bug, or need help with Telugu typography? Check the quick answers below or submit a ticket.
          </p>
        </div>

        {/* Info Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "48px"
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
              <div style={{ fontSize: "12px", color: "var(--accent-primary)", fontWeight: 600, marginTop: "2px" }}>support@createcaptions.in</div>
            </div>
          </div>
        </div>

        {/* Submit Ticket Form Card */}
        <div style={{
          background: "var(--nav-bg)",
          border: "1px solid var(--box-border)",
          borderRadius: "16px",
          padding: "36px 32px",
          marginBottom: "56px",
          boxShadow: "var(--card-shadow)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <MessageSquare size={18} color="var(--accent-primary)" />
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--card-text-primary)" }}>Submit a Support Ticket</h2>
          </div>
          <p style={{ fontSize: "14px", color: "var(--card-text-secondary)", margin: "0 0 24px 0" }}>
            Fill in the details below and our team will get back to your email address.
          </p>

          {ticketSubmitted ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "20px",
              borderRadius: "12px",
              backgroundColor: "var(--accent-surface)",
              border: "1px solid var(--accent-primary)",
              color: "var(--card-text-primary)"
            }}>
              <Check size={22} color="var(--accent-primary)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px" }}>Ticket Received</div>
                <div style={{ fontSize: "13px", color: "var(--card-text-secondary)", marginTop: "2px" }}>
                  Thanks for reaching out! We will review your request and reply shortly.
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--card-text-primary)", marginBottom: "6px" }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      backgroundColor: "var(--bg-surface-elevated)",
                      border: "1px solid var(--box-border)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      color: "var(--card-text-primary)",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--card-text-primary)", marginBottom: "6px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="creator@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      backgroundColor: "var(--bg-surface-elevated)",
                      border: "1px solid var(--box-border)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      color: "var(--card-text-primary)",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--card-text-primary)", marginBottom: "6px" }}>
                  Issue Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--box-border)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    color: "var(--card-text-primary)",
                    fontSize: "14px",
                    outline: "none"
                  }}
                >
                  <option value="Technical issue">Technical or playback issue</option>
                  <option value="Telugu transcription">Telugu Lipi / Tenglish transcription</option>
                  <option value="Export & rendering">Export & rendering problem</option>
                  <option value="Feature suggestion">Feature request or feedback</option>
                  <option value="Account & billing">Account or other</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--card-text-primary)", marginBottom: "6px" }}>
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what happened or what assistance you need..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--box-border)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    color: "var(--card-text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Screenshot Upload Dropzone */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--card-text-primary)", marginBottom: "6px" }}>
                  Attach Screenshot <span style={{ color: "var(--card-text-muted)", fontWeight: 500 }}>(Optional, PNG/JPG up to 5MB)</span>
                </label>
                
                {screenshot ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: "1px solid var(--accent-primary)",
                    borderRadius: "10px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                      <img
                        src={screenshot.preview}
                        alt="Screenshot preview"
                        style={{ width: "42px", height: "42px", borderRadius: "6px", objectFit: "cover" }}
                      />
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--card-text-primary)", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>
                          {screenshot.file.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--card-text-muted)" }}>
                          {(screenshot.file.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      style={{
                        background: "var(--nav-btn-bg)",
                        border: "1px solid var(--box-border)",
                        borderRadius: "8px",
                        padding: "6px",
                        color: "var(--card-text-primary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "18px",
                    border: "1px dashed var(--box-border)",
                    borderRadius: "10px",
                    backgroundColor: "var(--bg-surface-elevated)",
                    cursor: "pointer",
                    transition: "border-color 0.15s ease"
                  }}>
                    <ImagePlus size={18} color="var(--accent-primary)" />
                    <span style={{ fontSize: "13px", color: "var(--card-text-secondary)", fontWeight: 500 }}>
                      Click to upload an error or timeline screenshot
                    </span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "var(--accent-primary)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px 24px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "0 2px 12px var(--accent-surface)",
                    transition: "all 0.15s ease"
                  }}
                >
                  <Send size={15} /> Submit Request
                </button>
              </div>
            </form>
          )}
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
