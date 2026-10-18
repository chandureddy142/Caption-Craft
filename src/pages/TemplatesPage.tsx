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
    <div style={{ minHeight: "100vh", background: "#050807", color: "#ecf2ee", padding: "54px 32px 90px" }}>
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        
        {/* kicker and headline */}
        <div style={{ marginBottom: "28px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#3b82f6" }}>
            viral caption presets
          </span>
          <h1 style={{ fontSize: "46px", fontWeight: 800, letterSpacing: "-0.03em", color: "#ffffff", margin: "10px 0 14px", lineHeight: 1.15 }}>
            turn every spoken word into high-retention video hooks
          </h1>
          <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.6)", maxWidth: "660px", margin: 0, lineHeight: 1.6 }}>
            built specifically for instagram reels and youtube shorts. click any style to open it inside studio with your video, or preview how words light up in sync.
          </p>
        </div>

        {/* filter pills */}
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
                  background: isActive ? "rgba(59, 130, 246, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  color: isActive ? "#3b82f6" : "rgba(255, 255, 255, 0.7)",
                  border: isActive ? "1px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <span>{cat.label}</span>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: isActive ? "#3b82f6" : "rgba(255, 255, 255, 0.4)"
                }}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* section title and counter */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>
            {activeLabel} · {filteredTemplates.length} styles
          </h2>
        </div>

        {/* templates grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "22px" }}>
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              onClick={() => navigate("/studio", { state: { templateId: template.id } })}
              style={{
                background: "#0c110e",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "18px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.55)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(59, 130, 246, 0.1)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* clean canvas area without internal borders */}
              <div style={{
                position: "relative",
                aspectRatio: "16 / 9",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#030504",
                border: "1px solid rgba(255, 255, 255, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <AnimatedTemplatePreview template={template} isHovered={true} />
                
                <div style={{ position: "absolute", bottom: "10px", left: "10px", display: "flex", gap: "6px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.7)", padding: "2px 7px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.12)" }}>
                    {template.category}
                  </span>
                </div>
              </div>

              {/* title and badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 6px 4px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
                  {template.name}
                </span>
                {template.badge && (
                  <span style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: template.badge.toLowerCase() === "new" ? "#3b82f6" : "#38bdf8",
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
