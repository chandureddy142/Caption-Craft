import React, { useState, useEffect, useRef } from "react";
import { 
  UploadCloud, 
  Search, 
  Play, 
  Download, 
  Trash2, 
  Cpu, 
  Sparkles, 
  LogOut,
  CheckCircle2
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface ProjectItem {
  id: string;
  title: string;
  duration: string;
  language: "Telugu" | "Tenglish" | "English";
  ratio: "9:16" | "16:9";
  wordsCount: number;
  updatedAt: string;
  status: "Draft" | "Ready";
}

interface StudioDashboardProps {
  onOpenFile?: (file: File) => void;
  onOpenEditor?: (projectId?: string) => void;
  onSignOut?: () => void;
}

export const StudioDashboard: React.FC<StudioDashboardProps> = ({ onOpenFile, onOpenEditor, onSignOut }) => {
  const [userEmail, setUserEmail] = useState<string>("chandureddy0707@gmail.com");
  const [userName, setUserName] = useState<string>("Chandra");
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"projects" | "exports">("projects");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLang, setSelectedLang] = useState<string>("All");

  const menuRef = useRef<HTMLDivElement>(null);

  const [projects, setProjects] = useState<ProjectItem[]>([
    {
      id: "p1",
      title: "Insta Reel - Tech Tips Telugu",
      duration: "0:42",
      language: "Telugu",
      ratio: "9:16",
      wordsCount: 114,
      updatedAt: "2 hours ago",
      status: "Ready"
    },
    {
      id: "p2",
      title: "SaaS Product Demo Tenglish",
      duration: "1:15",
      language: "Tenglish",
      ratio: "16:9",
      wordsCount: 248,
      updatedAt: "Yesterday",
      status: "Draft"
    },
    {
      id: "p3",
      title: "Shorts - Coding Roadmap 2026",
      duration: "0:58",
      language: "Telugu",
      ratio: "9:16",
      wordsCount: 162,
      updatedAt: "3 days ago",
      status: "Ready"
    }
  ]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setUserEmail(data.user.email);
        const namePart = data.user.user_metadata?.full_name || data.user.email.split("@")[0];
        setUserName(namePart);
      }
    }).catch(() => {});

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newProject: ProjectItem = {
      id: "p" + Date.now(),
      title: file.name.replace(/.[^/.]+$/, ""),
      duration: "0:30",
      language: "Telugu",
      ratio: "9:16",
      wordsCount: 92,
      updatedAt: "Just now",
      status: "Draft"
    };
    setProjects(prev => [newProject, ...prev]);

    if (onOpenFile) {
      onOpenFile(file);
    } else if (onOpenEditor) {
      onOpenEditor(newProject.id);
    }
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(projects.filter(p => p.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onSignOut) {
      onSignOut();
    } else {
      window.location.href = "/";
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = selectedLang === "All" || p.language === selectedLang;
    return matchesSearch && matchesLang;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#070b09", color: "#f3f4f6", fontFamily: "inherit" }}>
      <header style={{
        height: "64px",
        borderBottom: "1px solid #14201a",
        background: "rgba(7, 11, 9, 0.95)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "34px",
            height: "34px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #3b82f6 0%, #00a87d 100%)",
            color: "#050a08",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: "14px"
          }}>
            cc
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", color: "#ffffff" }}>
              CaptionCraft
            </span>
            <span style={{
              fontSize: "10px",
              padding: "2px 7px",
              borderRadius: "4px",
              background: "rgba(59, 130, 246, 0.12)",
              color: "#3b82f6",
              fontWeight: 700,
              letterSpacing: "0.04em"
            }}>
              studio
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#0c1410",
            border: "1px solid #16241e",
            padding: "5px 12px",
            borderRadius: "20px",
            fontSize: "11px",
            color: "#8c9b93"
          }}>
            <Cpu size={13} color="#3b82f6" />
            <span>WebGPU local mode</span>
          </div>

          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#122019",
                border: "2px solid #1c3227",
                color: "#3b82f6",
                display: "grid",
                placeItems: "center",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                outline: "none"
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </button>

            {showProfileMenu && (
              <div style={{
                position: "absolute",
                top: "48px",
                right: 0,
                width: "240px",
                background: "#0a120e",
                border: "1px solid #1a2c23",
                borderRadius: "12px",
                boxShadow: "0 14px 35px rgba(0,0,0,0.6)",
                padding: "16px",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "#162820",
                    color: "#3b82f6",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: "13px"
                  }}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {userName}
                    </div>
                    <div style={{ fontSize: "11px", color: "#8c9b93", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {userEmail}
                    </div>
                  </div>
                </div>

                <div style={{ padding: "8px 10px", background: "#0e1a14", borderRadius: "8px", border: "1px solid #16261e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#8c9b93" }}>plan</span>
                  <span style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={12} /> creator free
                  </span>
                </div>

                <div style={{ height: "1px", background: "#16241e", margin: "2px 0" }}></div>

                <button
                  onClick={handleLogout}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#f87171",
                    padding: "6px 4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    textAlign: "left"
                  }}
                >
                  <LogOut size={14} />
                  <span>sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "1240px", margin: "0 auto", padding: "32px 28px" }}>
        <div style={{
          background: "linear-gradient(180deg, #0b1511 0%, #080f0c 100%)",
          border: "1px solid #162920",
          borderRadius: "16px",
          padding: "28px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px",
          marginBottom: "36px"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Sparkles size={16} color="#3b82f6" />
              <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 700 }}>
                telugu & tenglish kinetic captions
              </span>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 6px 0", color: "#ffffff", letterSpacing: "-0.02em" }}>
              Generate subtitles in seconds
            </h1>
            <p style={{ fontSize: "13px", color: "#8a9c92", margin: 0 }}>
              Zero server uploads. Your audio is transcribed right on your machine via local Whisper.
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <input
              type="file"
              accept="video/*,audio/*"
              onChange={handleFileUpload}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                cursor: "pointer",
                width: "100%",
                height: "100%",
                zIndex: 2
              }}
            />
            <button style={{
              background: "#3b82f6",
              color: "#ffffff",
              border: "none",
              padding: "12px 24px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(59, 130, 246, 0.3)"
            }}>
              <UploadCloud size={16} />
              <span>new caption project</span>
            </button>
          </div>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px"
        }}>
          <div style={{ display: "flex", gap: "8px", background: "#0b120f", padding: "4px", borderRadius: "10px", border: "1px solid #14201a" }}>
            <button
              onClick={() => setActiveTab("projects")}
              style={{
                background: activeTab === "projects" ? "#162820" : "transparent",
                color: activeTab === "projects" ? "#3b82f6" : "#9ca3af",
                border: "none",
                padding: "8px 18px",
                borderRadius: "7px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              projects {projects.length}
            </button>
            <button
              onClick={() => setActiveTab("exports")}
              style={{
                background: activeTab === "exports" ? "#162820" : "transparent",
                color: activeTab === "exports" ? "#3b82f6" : "#9ca3af",
                border: "none",
                padding: "8px 18px",
                borderRadius: "7px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              exports 1
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {["All", "Telugu", "Tenglish", "English"].map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  style={{
                    background: selectedLang === lang ? "#3b82f6" : "#0d1612",
                    color: selectedLang === lang ? "#040806" : "#8a9b92",
                    border: "1px solid " + (selectedLang === lang ? "#3b82f6" : "#172720"),
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#0c1410",
              border: "1px solid #172720",
              padding: "7px 12px",
              borderRadius: "8px",
              width: "200px"
            }}>
              <Search size={14} color="#6b7280" />
              <input
                type="text"
                placeholder="search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: "12px",
                  width: "100%"
                }}
              />
            </div>
          </div>
        </div>

        {activeTab === "projects" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px"
          }}>
            {filteredProjects.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (onOpenEditor) onOpenEditor(item.id);
                }}
                style={{
                  background: "#0a110e",
                  border: "1px solid #14231b",
                  borderRadius: "14px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, border-color 0.15s ease",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div style={{
                  height: "140px",
                  background: "radial-gradient(circle at 50% 50%, #12241c 0%, #08100c 100%)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderBottom: "1px solid #14231b"
                }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "rgba(59, 130, 246, 0.14)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    display: "grid",
                    placeItems: "center",
                    color: "#3b82f6"
                  }}>
                    <Play size={18} fill="#3b82f6" />
                  </div>

                  <span style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "3px 7px",
                    borderRadius: "4px",
                    background: "#050907",
                    color: "#9ca3af",
                    border: "1px solid #1a2c23"
                  }}>
                    {item.ratio}
                  </span>

                  <span style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: item.language === "Telugu" ? "rgba(59, 130, 246, 0.18)" : "rgba(255, 255, 255, 0.09)",
                    color: item.language === "Telugu" ? "#3b82f6" : "#e5e7eb"
                  }}>
                    {item.language}
                  </span>

                  <span style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#d1d5db",
                    background: "rgba(0, 0, 0, 0.65)",
                    padding: "2px 6px",
                    borderRadius: "4px"
                  }}>
                    {item.duration}
                  </span>
                </div>

                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <h3 style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#f9fafb",
                    margin: 0,
                    lineHeight: "1.4"
                  }}>
                    {item.title}
                  </h3>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "#6b7280" }}>
                    <span>{item.wordsCount} words</span>
                    <span>•</span>
                    <span>{item.updatedAt}</span>
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "auto",
                    paddingTop: "12px",
                    borderTop: "1px solid #111e17"
                  }}>
                    <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 700 }}>
                      open studio editor →
                    </span>
                    <button
                      onClick={(e) => deleteProject(item.id, e)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#6b7280",
                        cursor: "pointer",
                        padding: "4px"
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "#0a110e", border: "1px solid #14231b", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #14231b", color: "#6b7280", textAlign: "left" }}>
                  <th style={{ padding: "14px 18px", fontWeight: 600 }}>project name</th>
                  <th style={{ padding: "14px 18px", fontWeight: 600 }}>script format</th>
                  <th style={{ padding: "14px 18px", fontWeight: 600 }}>ready exports</th>
                  <th style={{ padding: "14px 18px", fontWeight: 600 }}>action</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #101a14" }}>
                  <td style={{ padding: "14px 18px", color: "#fff", fontWeight: 600 }}>Insta Reel - Tech Tips Telugu</td>
                  <td style={{ padding: "14px 18px", color: "#3b82f6" }}>Telugu Lipi</td>
                  <td style={{ padding: "14px 18px", color: "#9ca3af" }}>SRT, VTT, MP4 1080p</td>
                  <td style={{ padding: "14px 18px" }}>
                    <button style={{
                      background: "#111f19",
                      border: "1px solid #1e362b",
                      color: "#3b82f6",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <Download size={13} />
                      <span>download zip</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
