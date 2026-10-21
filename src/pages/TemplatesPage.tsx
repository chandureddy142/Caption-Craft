import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedTemplatePreview from "../components/AnimatedTemplatePreview";
import { CAPTION_SECTIONS, CAPTION_TEMPLATES } from "../utils/captionTemplates";

export default function TemplatesPage(): ReactElement {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const list = [
      { key: "all", label: "all", count: CAPTION_TEMPLATES.length },
    ];
    CAPTION_SECTIONS.forEach(sec => {
      const count = CAPTION_TEMPLATES.filter(t => t.category === sec.key).length;
      if (count > 0) {
        list.push({ key: sec.key, label: sec.title.toLowerCase(), count });
      }
    });
    return list;
  }, []);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "all") return CAPTION_TEMPLATES;
    return CAPTION_TEMPLATES.filter(t => t.category === selectedCategory);
  }, [selectedCategory]);

  const activeLabel = useMemo(() => {
    if (selectedCategory === "all") return "every template";
    const found = categories.find(c => c.key === selectedCategory);
    return found ? found.label : selectedCategory;
  }, [selectedCategory, categories]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app)", color: "var(--text-primary)", padding: "54px 32px 90px", transition: "background-color 0.2s ease, color 0.2s ease" }}>
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        
        {/* Kicker & Headline */}
        <div style={{ marginBottom: "28px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--accent-primary)" }}>
            viral caption presets
          </span>
          <h1 style={{ fontSize: "46px", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", margin: "10px 0 14px", lineHeight: 1.15 }}>
            turn every spoken word into high-retention video hooks
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", maxWidth: "660px", margin: 0, lineHeight: 1.6 }}>
            built specifically for instagram reels and youtube shorts. click any style to open it inside studio with your video, or preview how words light up in sync.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", margin: "32px 0 42px" }}>
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
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  background: isActive ? "var(--accent-primary)" : "var(--nav-bg)",
                  color: isActive ? "#ffffff" : "var(--card-text-secondary)",
                  border: isActive ? "1px solid var(--accent-primary)" : "1px solid var(--box-border)",
                  boxShadow: "var(--card-shadow)"
                }}
              >
                <span>{cat.label}</span>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: isActive ? "#ffffff" : "var(--card-text-muted)"
                }}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Section Title */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.01em" }}>
            {activeLabel} · {filteredTemplates.length} styles
          </h2>
        </div>

        {/* Templates Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "22px" }}>
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              onClick={() => navigate("/studio", { state: { templateId: template.id } })}
              style={{
                background: "var(--nav-bg)",
                border: "1px solid var(--box-border)",
                borderRadius: "18px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                cursor: "pointer",
                boxShadow: "var(--card-shadow)",
                transition: "all 0.2s ease",
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
              <div style={{
                position: "relative",
                aspectRatio: "16 / 9",
                borderRadius: "12px",
                overflow: "hidden",
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--box-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <AnimatedTemplatePreview template={template} isHovered={true} />
                
                <div style={{ position: "absolute", bottom: "10px", left: "10px", display: "flex", gap: "6px" }}>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    background: "var(--nav-btn-bg)",
                    color: "var(--card-text-secondary)",
                    padding: "2px 7px",
                    borderRadius: "5px",
                    border: "1px solid var(--box-border)"
                  }}>
                    {template.category}
                  </span>
                </div>
              </div>

              {/* Title & Badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 6px 4px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--card-text-primary)", letterSpacing: "-0.01em" }}>
                  {template.name}
                </span>
                {template.badge && (
                  <span style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: template.badge.toLowerCase() === "new" ? "var(--accent-primary)" : "#38bdf8",
                    color: "#ffffff",
                    textTransform: "lowercase",
                  }}>
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
