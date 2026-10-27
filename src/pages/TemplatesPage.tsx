import type { ReactElement } from "react";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedTemplatePreview from "../components/AnimatedTemplatePreview";
import { CAPTION_SECTIONS, CAPTION_TEMPLATES } from "../utils/captionTemplates";
import { Sparkles } from "lucide-react";

export default function TemplatesPage(): ReactElement {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const list = [
      { key: "all", label: "All Styles", count: CAPTION_TEMPLATES.length },
    ];
    CAPTION_SECTIONS.forEach(sec => {
      const count = CAPTION_TEMPLATES.filter(t => t.category === sec.key).length;
      if (count > 0) {
        list.push({ key: sec.key, label: sec.title, count });
      }
    });
    return list;
  }, []);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "all") return CAPTION_TEMPLATES;
    return CAPTION_TEMPLATES.filter(t => t.category === selectedCategory);
  }, [selectedCategory]);

  
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
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );

    // Observe all current cards and animated elements
    const elements = document.querySelectorAll(".cc-scroll-reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [selectedCategory, filteredTemplates]);

  const activeLabel = useMemo(() => {
    if (selectedCategory === "all") return "All Templates";
    const found = categories.find(c => c.key === selectedCategory);
    return found ? found.label : selectedCategory;
  }, [selectedCategory, categories]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-app)",
        color: "var(--text-primary)",
        padding: "60px 32px 110px",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        transition: "background-color 0.2s ease, color 0.2s ease"
      }}
    >
      <div style={{ maxWidth: "1360px", margin: "0 auto" }}>

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
        
        {/* Kicker & Headline Header */}
        <div style={{ marginBottom: "34px", maxWidth: "860px" }}>
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
              marginBottom: "16px",
              letterSpacing: "0.03em",
              textTransform: "uppercase"
            }}
          >
            <Sparkles size={13} />
            Viral Caption Templates
          </div>

          <h1
            style={{
              fontSize: "clamp(34px, 4.8vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              color: "var(--text-primary)",
              margin: "0 0 16px 0",
              lineHeight: 1.15
            }}
          >
            Turn Every Spoken Word into High-Retention Hooks
          </h1>

          <p
            style={{
              fontSize: "15.5px",
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.6,
              fontWeight: 500
            }}
          >
            Optimized for Instagram Reels, YouTube Shorts, and regional creators.
            Click any style to launch directly inside the Studio with your clip, or preview synced word highlights.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", margin: "32px 0 38px" }}>
          {categories.map(cat => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 18px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  background: isActive ? "var(--accent-primary)" : "var(--nav-bg)",
                  color: isActive ? "#ffffff" : "var(--card-text-primary)",
                  border: isActive ? "1px solid var(--accent-primary)" : "1px solid var(--box-border)",
                  boxShadow: "var(--card-shadow)"
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.borderColor = "var(--accent-primary)";
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.borderColor = "var(--box-border)";
                }}
              >
                <span>{cat.label}</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: "999px",
                    background: isActive ? "rgba(0,0,0,0.22)" : "var(--accent-surface)",
                    color: isActive ? "#ffffff" : "var(--accent-primary)"
                  }}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Section Counter */}
        <div style={{ marginBottom: "22px", display: "flex", alignItems: "center", gap: "10px" }}>
          <h2
            style={{
              fontSize: "17px",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.015em"
            }}
          >
            {activeLabel}
          </h2>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--card-text-muted)",
              background: "var(--nav-btn-bg)",
              padding: "2px 8px",
              borderRadius: "6px",
              border: "1px solid var(--box-border)"
            }}
          >
            {filteredTemplates.length} styles
          </span>
        </div>

        {/* Templates Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          {filteredTemplates.map(template => (
            <div key={template.id} className="cc-scroll-reveal"
              onClick={() => navigate("/studio", { state: { templateId: template.id } })}
              style={{
                background: "var(--nav-bg)",
                border: "1px solid var(--box-border)",
                borderRadius: "20px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                cursor: "pointer",
                boxShadow: "var(--card-shadow)",
                transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "var(--accent-primary)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "var(--card-shadow-hover)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--box-border)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--card-shadow)";
              }}
            >
              {/* Inner Preview Area */}
              <div
                style={{
                  position: "relative",
                  aspectRatio: "16 / 9",
                  borderRadius: "14px",
                  overflow: "hidden",
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid var(--box-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <AnimatedTemplatePreview template={template} isHovered={true} />
                
                <div style={{ position: "absolute", bottom: "10px", left: "10px", display: "flex", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      background: "var(--nav-btn-bg)",
                      color: "var(--card-text-secondary)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--box-border)",
                      letterSpacing: "0.02em",
                      textTransform: "capitalize"
                    }}
                  >
                    {template.category}
                  </span>
                </div>
              </div>

              {/* Title & Badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px 2px" }}>
                <span
                  style={{
                    fontSize: "14.5px",
                    fontWeight: 800,
                    color: "var(--card-text-primary)",
                    letterSpacing: "-0.015em"
                  }}
                >
                  {template.name}
                </span>
                {template.badge && (
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 800,
                      padding: "3px 9px",
                      borderRadius: "999px",
                      background: "var(--accent-primary)",
                      color: "#ffffff",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em"
                    }}
                  >
                    {template.badge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
