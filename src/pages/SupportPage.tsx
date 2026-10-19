import React, { useState } from "react";
import { LifeBuoy, Mail, MessageSquare, Clock, HelpCircle, Check, Send, ChevronDown, ChevronUp, ImagePlus, X } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Why does transcription happen completely on my device?",
    answer: "CaptionCraft runs the speech recognition model inside your browser using WebAssembly and WebGPU. This ensures complete privacy so your unedited videos and audio never leave your computer."
  },
  {
    question: "How do I switch between Telugu Lipi and Tenglish?",
    answer: "Before starting transcription or inside the editor, you can toggle between native Telugu Lipi and phonetic Tenglish. You can also re-transliterate any specific word directly from the timeline."
  },
  {
    question: "What video and audio formats are supported?",
    answer: "CaptionCraft supports MP4, MOV, WEBM for video files, as well as MP3, WAV, and M4A audio files. Rendered videos can be exported directly as 1080p MP4 or downloaded as SRT subtitle tracks."
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
      backgroundColor: "var(--bg-app, #0b0d11)",
      color: "#f3f6f4",
      padding: "60px 24px 100px",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
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
            color: "var(--accent-primary, #3b82f6)",
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            padding: "4px 14px",
            borderRadius: "999px",
            marginBottom: "16px",
            textTransform: "uppercase",
            letterSpacing: "0.06em"
          }}>
            <LifeBuoy size={14} /> Help Desk
          </div>
          <h1 style={{ fontSize: "clamp(32px, 4.5vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 12px 0" }}>
            How can we help you?
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.65)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.6 }}>
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
            background: "rgba(19, 23, 32, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(59, 130, 246, 0.12)",
              color: "var(--accent-primary, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>Response Window</div>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>Typically within 24 hours</div>
            </div>
          </div>

          <div style={{
            background: "rgba(19, 23, 32, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(59, 130, 246, 0.12)",
              color: "var(--accent-primary, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Mail size={20} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>Direct Email</div>
              <div style={{ fontSize: "12px", color: "var(--accent-primary, #3b82f6)" }}>support@captioncraft.in</div>
            </div>
          </div>
        </div>

        {/* Submit Ticket Form Card */}
        <div style={{
          background: "rgba(19, 23, 32, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "36px 32px",
          marginBottom: "56px",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.35)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <MessageSquare size={18} color="var(--accent-primary, #3b82f6)" />
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "#fff" }}>Submit a Support Ticket</h2>
          </div>
          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", margin: "0 0 24px 0" }}>
            Fill in the details below and our team will get back to your email address.
          </p>

          {ticketSubmitted ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "20px",
              borderRadius: "12px",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "#ffffff"
            }}>
              <Check size={22} color="var(--accent-primary, #3b82f6)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px" }}>Ticket Received</div>
                <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", marginTop: "2px" }}>
                  Thanks for reaching out! We will review your request and reply shortly.
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", marginBottom: "6px" }}>
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
                      backgroundColor: "rgba(11, 13, 17, 0.9)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", marginBottom: "6px" }}>
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
                      backgroundColor: "rgba(11, 13, 17, 0.9)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", marginBottom: "6px" }}>
                  Issue Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "rgba(11, 13, 17, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    color: "#fff",
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
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", marginBottom: "6px" }}>
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
                    backgroundColor: "rgba(11, 13, 17, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Screenshot Upload Dropzone */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", marginBottom: "6px" }}>
                  Attach Screenshot <span style={{ color: "rgba(255, 255, 255, 0.4)", fontWeight: 400 }}>(Optional, PNG/JPG up to 5MB)</span>
                </label>
                
                {screenshot ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: "rgba(11, 13, 17, 0.9)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    borderRadius: "10px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                      <img
                        src={screenshot.preview}
                        alt="Screenshot preview"
                        style={{ width: "42px", height: "42px", borderRadius: "6px", objectFit: "cover" }}
                      />
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>
                          {screenshot.file.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)" }}>
                          {(screenshot.file.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px",
                        color: "#fff",
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
                    border: "1px dashed rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    backgroundColor: "rgba(11, 13, 17, 0.5)",
                    cursor: "pointer",
                    transition: "border-color 0.15s ease"
                  }}>
                    <ImagePlus size={18} color="var(--accent-primary, #3b82f6)" />
                    <span style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)" }}>
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
                    background: "var(--accent-primary, #3b82f6)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px 24px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "0 0 16px var(--accent-glow, rgba(59, 130, 246, 0.25))"
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
            <HelpCircle size={20} color="var(--accent-primary, #3b82f6)" />
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "#fff" }}>Frequently Asked Questions</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  onClick={() => toggleFaq(index)}
                  style={{
                    background: "rgba(19, 23, 32, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "18px 20px",
                    cursor: "pointer",
                    transition: "border-color 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>{faq.question}</span>
                    {isOpen ? <ChevronUp size={18} color="var(--accent-primary, #3b82f6)" /> : <ChevronDown size={18} color="rgba(255, 255, 255, 0.4)" />}
                  </div>
                  {isOpen && (
                    <p style={{ margin: "12px 0 0 0", fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6 }}>
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
