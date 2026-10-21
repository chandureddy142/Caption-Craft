import { ThemeToggle } from "../lib/theme";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  Search,
  Play,
  Download,
  Trash2,
  Sparkles,
  LogOut,
  CheckCircle2,
  CreditCard,
  User,
  X,
  ShieldAlert,
  FolderOpen,
  Zap,
  Lock,
  Layers,
  ArrowRight,
  Globe
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getPersistentEmailUsage, recordPersistentUsage } from "../lib/usageTracker";
import { saveLocalProjectMedia, deleteLocalProjectMedia, getLocalExportMedia, getAllLocalExports, getAllLocalProjects, deleteLocalExportsForProject } from "../lib/localMediaStorage";

interface ProjectItem {
  id: string;
  title: string;
  duration: string;
  language: "Telugu" | "Tenglish" | "English";
  ratio: "9:16" | "16:9";
  wordsCount: number;
  updatedAt: string;
  status: "Draft" | "Ready";
  user_id?: string;
}

interface ExportItem {
  id: string;
  project_title: string;
  script_format: string;
  export_types: string;
  download_url?: string;
  created_at: string;
}

interface StudioDashboardProps {
  onOpenFile?: (file: File, projectId?: string) => void;
  onOpenEditor?: (projectId?: string) => void;
  onSignOut?: () => void;
}

function parseDurationToMinutes(durationStr?: string): number {
  if (!durationStr) return 0.5;
  const parts = durationStr.split(":").map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return Math.max(0.1, parts[0] + parts[1] / 60);
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return Math.max(0.1, parts[0] * 60 + parts[1] + parts[2] / 60);
  }
  return 0.5;
}

export const StudioDashboard: React.FC<StudioDashboardProps> = ({ onOpenFile, onOpenEditor, onSignOut }) => {
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string>("");
  const [persistentHistoricalMinutes, setPersistentHistoricalMinutes] = useState<number>(0);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("Creator");
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showBillingModal, setShowBillingModal] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "danger">("general");

  const [editName, setEditName] = useState<string>("");
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>("");
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<"projects" | "exports">("projects");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLang, setSelectedLang] = useState<string>("All");

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const activeProjectsMinutes = Math.round(projects.reduce((sum, p) => sum + parseDurationToMinutes(p.duration), 0) * 10) / 10;
  const totalTranscriptionMinutes = Math.round(Math.max(activeProjectsMinutes, persistentHistoricalMinutes) * 10) / 10;
  const [exportsList, setExportsList] = useState<ExportItem[]>([]);

  useEffect(() => {
    async function loadUserData() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          if (user.email) {
            setUserEmail(user.email);
            const historical = await getPersistentEmailUsage(user.email);
            setPersistentHistoricalMinutes(historical);
          }
          const metaName = user.user_metadata?.full_name || (user.email ? user.email.split("@")[0] : "Creator");
          setUserName(metaName);
          setEditName(metaName);

          let combinedProjects: ProjectItem[] = [];
          try {
            const { data: dbProjects } = await supabase
              .from("projects")
              .select("*")
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false });

            if (dbProjects && dbProjects.length > 0) {
              combinedProjects = dbProjects.map((p: any) => ({
                id: p.id,
                title: p.title || "Untitled Project",
                duration: p.duration || "0:30",
                language: p.language || "Telugu",
                ratio: p.ratio || "9:16",
                wordsCount: p.words_count || 0,
                updatedAt: p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "Recently",
                status: p.status || "Ready",
                user_id: p.user_id
              }));
            }
          } catch (e) {
            console.warn("Supabase project fetch skipped:", e);
          }

          try {
            const localProjs = await getAllLocalProjects();
            for (const loc of localProjs) {
              if (!combinedProjects.some(p => p.id === loc.id)) {
                combinedProjects.push({
                  id: loc.id,
                  title: loc.name.replace(/.[^/.]+$/, "") || "Untitled Project",
                  duration: "0:30",
                  language: "Telugu",
                  ratio: "9:16",
                  wordsCount: 0,
                  updatedAt: new Date(loc.createdAt).toLocaleDateString(),
                  status: "Draft",
                  user_id: user.id
                });
              }
            }
          } catch (err) {
            console.warn("Could not read local projects from IndexedDB:", err);
          }

          setProjects(combinedProjects);

          let combinedExports: ExportItem[] = [];
          try {
            const { data: dbExports } = await supabase
              .from("exports")
              .select("*")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false });

            if (dbExports && dbExports.length > 0) {
              combinedExports = dbExports.map((e: any) => ({
                id: e.id,
                project_title: e.project_title || "Exported Video",
                script_format: e.script_format || "Telugu Lipi",
                export_types: e.export_types || "MP4 1080p, Subtitles (Burned-in)",
                download_url: e.download_url || "#",
                created_at: e.created_at ? new Date(e.created_at).toLocaleDateString() : "Recently"
              }));
            }
          } catch (e) {
            console.warn("Supabase export fetch skipped:", e);
          }

          try {
            const localExps = await getAllLocalExports();
            for (const loc of localExps) {
              if (!combinedExports.some(x => x.id === loc.id)) {
                combinedExports.push({
                  id: loc.id,
                  project_title: loc.name.replace(/.[^/.]+$/, "") || "Rendered Video",
                  script_format: "Telugu Lipi",
                  export_types: "MP4 1080p (Local IndexedDB)",
                  download_url: "local:" + loc.id,
                  created_at: new Date(loc.createdAt).toLocaleDateString()
                });
              }
            }
          } catch (err) {
            console.warn("Could not read local exports from IndexedDB:", err);
          }

          setExportsList(combinedExports);
        }
      } catch (err) {
        console.warn("Could not load user data from Supabase", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const processSelectedFile = async (file: File) => {
    const projectTitle = file.name.replace(/.[^/.]+$/, "");
    let createdId = "p" + Date.now();

    if (userId) {
      try {
        const { data, error } = await supabase
          .from("projects")
          .insert({
            user_id: userId,
            title: projectTitle,
            duration: "0:30",
            language: "Telugu",
            ratio: "9:16",
            words_count: 0,
            status: "Draft"
          })
          .select()
          .single();

        if (!error && data) {
          createdId = data.id;
        }
      } catch (err) {
        console.error("Failed to insert project into Supabase", err);
      }
    }

    const newProject: ProjectItem = {
      id: createdId,
      title: projectTitle,
      duration: "0:30",
      language: "Telugu",
      ratio: "9:16",
      wordsCount: 0,
      updatedAt: "Just now",
      status: "Draft",
      user_id: userId
    };

    try {
      await saveLocalProjectMedia(createdId, file, file.name);
    } catch (err) {
      console.warn("Could not save to local IndexedDB:", err);
    }

    setProjects(prev => [newProject, ...prev]);
    if (userEmail) {
      recordPersistentUsage(userEmail, 0.5).then(updated => setPersistentHistoricalMinutes(updated));
    }

    if (onOpenFile) {
      onOpenFile(file, createdId);
    } else if (onOpenEditor) {
      onOpenEditor(createdId);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processSelectedFile(file);
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const projToDelete = projects.find(p => p.id === id);
    const projTitle = projToDelete?.title;

    setProjects(prev => prev.filter(p => p.id !== id));
    if (projTitle) {
      setExportsList(prev => prev.filter(x => !x.project_title.toLowerCase().includes(projTitle.toLowerCase())));
    }

    try {
      await supabase.from("projects").delete().eq("id", id);
      await supabase.from("exports").delete().eq("project_id", id);
      await deleteLocalProjectMedia(id);
      await deleteLocalExportsForProject(id, projTitle);
    } catch (err) {
      console.error("Error during project cleanup:", err);
    }
  };

  const handleDownloadExport = async (exportItem: ExportItem) => {
    try {
      const stored = await getLocalExportMedia(exportItem.id);
      if (stored) {
        const url = URL.createObjectURL(stored.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = stored.name || (exportItem.project_title + ".mp4");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("Export file was not found in browser storage. Please re-export from the project.");
      }
    } catch (err) {
      console.error("Failed to download export from local IndexedDB:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onSignOut) {
      onSignOut();
    } else {
      window.location.href = "/";
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingSettings(true);
    try {
      await supabase.auth.updateUser({
        data: { full_name: editName }
      });
      setUserName(editName);
      setShowSettingsModal(false);
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    try {
      if (userId) {
        await supabase.from("projects").delete().eq("user_id", userId);
        await supabase.from("exports").delete().eq("user_id", userId);
      }
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error("Account deletion error:", err);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = selectedLang === "All" || p.language === selectedLang;
    return matchesSearch && matchesLang;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-[var(--card-bg)]pp)", color: "var(--text-primary)", fontFamily: "inherit" }}>
      {/* Top Navbar */}
      <nav style={{
        height: "64px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--nav-bg)",
        backdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxSizing: "border-box"
      }}>
        <div
          onClick={() => navigate("/")}
          style={{ display: "inline-flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
          title="Back to Landing Page"
        >
          <img
            src="/media/logo.png"
            alt="CaptionCraft"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              objectFit: "contain",
              border: "1.5px solid rgba(255, 255, 255, 0.85)",
              padding: "2px"
            }}
          />
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              <span style={{ color: "var(--card-text-primary)", fontWeight: 700, fontSize: "16px", letterSpacing: "-0.02em" }}>CaptionCraft</span>
            </span>
            <span style={{
              fontSize: "10px",
              padding: "2px 7px",
              borderRadius: "4px",
              background: "rgba(59, 130, 246, 0.12)",
              color: "var(--accent-primary)",
              fontWeight: 700,
              letterSpacing: "0.04em"
            }}>
              studio
            </span>
          </div>
        </div>

        {/* Right side: ThemeToggle beside Profile Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ position: "relative" }} ref={menuRef}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
          <ThemeToggle />
          <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "var(--bg-surface-elevated)",
                border: "2px solid var(--border-subtle)",
                color: "var(--accent-primary)",
                display: "grid",
                placeItems: "center",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                outline: "none"
              }}
            >
              {userName ? userName.charAt(0).toUpperCase() : "C"}
            </button>
        </div>

            {showProfileMenu && (
              <div style={{
                position: "absolute",
                top: "48px",
                right: 0,
                width: "270px",
                background: "var(--card-bg, var(--bg-surface))",
                border: "1px solid var(--box-border)",
                borderRadius: "14px",
                boxShadow: "var(--card-shadow, 0 16px 40px rgba(0,0,0,0.5))",
                padding: "16px",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--bg-surface-elevated)",
                    color: "var(--accent-primary)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: "14px"
                  }}>
                    {userName ? userName.charAt(0).toUpperCase() : "C"}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {userName}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {userEmail}
                    </div>
                  </div>
                </div>

                <div style={{ padding: "10px", background: "var(--bg-surface-elevated)", borderRadius: "10px", border: "1px solid var(--box-border)", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>plan</span>
                    <span style={{ fontSize: "11px", color: "var(--accent-primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={12} /> creator free
                    </span>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      <span>transcription usage</span>
                      <span>{totalTranscriptionMinutes} / 60 min</span>
                    </div>
                    <div style={{ width: "100%", height: "4px", background: "var(--border-subtle)", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ width: Math.min(100, (totalTranscriptionMinutes / 60) * 100) + "%", height: "100%", background: "var(--accent-primary)", borderRadius: "99px" }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setSettingsTab("general");
                      setShowSettingsModal(true);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-primary)",
                      padding: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      textAlign: "left"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-elevated)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <User size={14} color="var(--accent-primary)" />
                    <span style={{ color: "var(--card-text-secondary)" }}>Profile Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowBillingModal(true);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-primary)",
                      padding: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      textAlign: "left"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-elevated)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <CreditCard size={14} color="var(--accent-primary)" />
                    <span style={{ color: "var(--card-text-secondary)" }}>Billing & Subscription</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate("/");
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-primary)",
                      padding: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      textAlign: "left"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-elevated)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Globe size={14} color="var(--accent-primary)" />
                    <span style={{ color: "var(--card-text-secondary)" }}>Landing Page</span>
                  </button>
                </div>

                <div style={{ height: "1px", background: "var(--box-border)" }} />

                <button
                  onClick={handleLogout}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#f87171",
                    padding: "6px 8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    textAlign: "left"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <LogOut size={14} />
                  <span>sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: "1240px", margin: "0 auto", padding: "32px 28px" }}>
        {/* Command Center Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            position: "relative",
            background: isDragging
              ? "var(--bg-surface-elevated)"
              : "var(--card-bg, var(--bg-surface))",
            border: isDragging ? "2px dashed var(--accent-primary)" : "1.5px dashed var(--border-subtle)",
            borderRadius: "20px",
            padding: "44px 32px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "32px",
            boxShadow: "var(--card-shadow, 0 10px 30px rgba(0,0,0,0.15))"
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />

          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "rgba(59, 130, 246, 0.12)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            display: "grid",
            placeItems: "center",
            color: "var(--accent-primary)",
            marginBottom: "16px"
          }}>
            <UploadCloud size={28} />
          </div>

          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
            <span style={{ color: "var(--card-text-primary)", fontWeight: 600 }}>Drop your video or audio clip here</span>
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 18px 0", maxWidth: "460px", lineHeight: "1.5" }}>
            <span style={{ color: "var(--card-text-secondary)" }}>Auto-generate word-by-word synced Telugu or Tenglish subtitles without server uploads.</span>
          </p>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              style={{
                background: "var(--accent-primary)",
                color: "#ffffff",
                border: "none",
                padding: "10px 22px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(59, 130, 246, 0.25)"
              }}
            >
              <UploadCloud size={14} />
              <span>browse media file</span>
            </button>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>MP4, MOV, WEBM, WAV, MP3</span>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginTop: "26px",
            paddingTop: "20px",
            borderTop: "1px solid var(--border-subtle)",
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-secondary)" }}>
              <Zap size={13} color="var(--accent-primary)" />
              <span>WebGPU Hardware Acceleration</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#10b981" }}>
              <Lock size={13} color="#10b981" />
              <span>100% Private (Runs In-Browser)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-secondary)" }}>
              <Sparkles size={13} color="#f59e0b" />
              <span>Telugu Lipi & Tenglish Dual Engine</span>
            </div>
          </div>
        </div>

        {/* Single Quick-Start Format */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Layers size={14} color="var(--text-secondary)" />
            <h3 style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>
              Quick-Start Format
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "var(--card-bg, var(--bg-surface))",
                border: "1px solid var(--box-border)",
                borderRadius: "14px",
                padding: "20px 24px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px", background: "rgba(59, 130, 246, 0.14)", color: "var(--accent-primary)" }}>
                    9:16 vertical
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                    <span style={{ color: "var(--card-text-primary)", fontWeight: 600 }}>Instagram Reel & YouTube Shorts</span>
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  <span style={{ color: "var(--card-text-secondary)" }}>1–3 word kinetic chunks with Instagram and YouTube Shorts UI safe-zone guides and high-contrast word highlights.</span>
                </div>
              </div>

              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--box-border)",
                display: "grid",
                placeItems: "center",
                color: "var(--accent-primary)",
                flexShrink: 0
              }}>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Header & Filter Controls */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px"
        }}>
          <div style={{ display: "flex", gap: "8px", background: "var(--card-bg, var(--bg-surface))", padding: "4px", borderRadius: "10px", border: "1px solid var(--box-border)" }}>
            <button
              onClick={() => setActiveTab("projects")}
              style={{
                background: activeTab === "projects" ? "var(--bg-surface-elevated)" : "transparent",
                color: activeTab === "projects" ? "var(--accent-primary)" : "var(--text-secondary)",
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
                background: activeTab === "exports" ? "var(--bg-surface-elevated)" : "transparent",
                color: activeTab === "exports" ? "var(--accent-primary)" : "var(--text-secondary)",
                border: "none",
                padding: "8px 18px",
                borderRadius: "7px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              exports {exportsList.length}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {["All", "Telugu", "Tenglish", "English"].map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  style={{
                    background: selectedLang === lang ? "var(--accent-primary)" : "var(--card-bg, var(--bg-surface))",
                    color: selectedLang === lang ? "#ffffff" : "var(--text-secondary)",
                    border: "1px solid " + (selectedLang === lang ? "var(--accent-primary)" : "var(--box-border)"),
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
              background: "var(--card-bg, var(--bg-surface))",
              border: "1px solid var(--box-border)",
              padding: "7px 12px",
              borderRadius: "8px",
              width: "200px"
            }}>
              <Search size={14} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  width: "100%"
                }}
              />
            </div>

            </div>
        </div>

        {/* Project Cards or Exports Table */}
        {isLoading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
            Loading creator workspace...
          </div>
        ) : activeTab === "projects" ? (
          filteredProjects.length === 0 ? (
            <div style={{
              background: "var(--card-bg, var(--bg-surface))",
              border: "1px dashed var(--box-border)",
              borderRadius: "14px",
              padding: "48px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px"
            }}>
              <FolderOpen size={32} color="var(--text-secondary)" />
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>No active projects yet</div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", maxWidth: "340px", margin: 0 }}>
                Drop a file into the command center above or pick a quick-start format to begin editing.
              </p>
            </div>
          ) : (
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
                    background: "var(--card-bg, var(--bg-surface))",
                    border: "1px solid var(--box-border)",
                    borderRadius: "14px",
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "var(--card-shadow, 0 4px 12px rgba(0,0,0,0.06))"
                  }}
                >
                  <div style={{
                    height: "140px",
                    background: "var(--bg-surface-elevated)",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderBottom: "1px solid var(--box-border)"
                  }}>
                    <div style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: "rgba(59, 130, 246, 0.14)",
                      border: "1px solid var(--accent-primary)",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--accent-primary)"
                    }}>
                      <Play size={18} fill="var(--accent-primary)" />
                    </div>

                    <span style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "3px 7px",
                      borderRadius: "4px",
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff"
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
                      background: item.language === "Telugu" ? "rgba(59, 130, 246, 0.18)" : "rgba(255, 255, 255, 0.14)",
                      color: item.language === "Telugu" ? "var(--accent-primary)" : "#fff"
                    }}>
                      {item.language}
                    </span>

                    <span style={{
                      position: "absolute",
                      bottom: "10px",
                      right: "12px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#fff",
                      background: "rgba(0, 0, 0, 0.75)",
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
                      color: "var(--text-primary)",
                      margin: 0,
                      lineHeight: "1.4"
                    }}>
                      {item.title}
                    </h3>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "var(--text-secondary)" }}>
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
                      borderTop: "1px solid var(--box-border)"
                    }}>
                      <span style={{ fontSize: "12px", color: "var(--accent-primary)", fontWeight: 700 }}>
                        open studio editor →
                      </span>
                      <button
                        onClick={(e) => deleteProject(item.id, e)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-secondary)",
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
          )
        ) : (
          exportsList.length === 0 ? (
            <div style={{
              background: "var(--card-bg, var(--bg-surface))",
              border: "1px dashed var(--box-border)",
              borderRadius: "14px",
              padding: "48px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px"
            }}>
              <Download size={32} color="var(--text-secondary)" />
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>No exports yet</div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", maxWidth: "340px", margin: 0 }}>
                When you render a video or download SRT captions in the editor, your export history appears here.
              </p>
            </div>
          ) : (
            <div style={{ background: "var(--card-bg, var(--bg-surface))", border: "1px solid var(--box-border)", borderRadius: "12px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--box-border)", color: "var(--text-secondary)", textAlign: "left" }}>
                    <th style={{ padding: "14px 18px", fontWeight: 600 }}>project name</th>
                    <th style={{ padding: "14px 18px", fontWeight: 600 }}>script format</th>
                    <th style={{ padding: "14px 18px", fontWeight: 600 }}>ready exports</th>
                    <th style={{ padding: "14px 18px", fontWeight: 600 }}>date</th>
                    <th style={{ padding: "14px 18px", fontWeight: 600 }}>action</th>
                  </tr>
                </thead>
                <tbody>
                  {exportsList.map(exp => (
                    <tr key={exp.id} style={{ borderBottom: "1px solid var(--box-border)" }}>
                      <td style={{ padding: "14px 18px", color: "var(--text-primary)", fontWeight: 600 }}>{exp.project_title}</td>
                      <td style={{ padding: "14px 18px", color: "var(--accent-primary)" }}>{exp.script_format}</td>
                      <td style={{ padding: "14px 18px", color: "var(--text-secondary)" }}>{exp.export_types}</td>
                      <td style={{ padding: "14px 18px", color: "var(--text-secondary)", fontSize: "12px" }}>{exp.created_at}</td>
                      <td style={{ padding: "14px 18px" }}>
                        <button
                          type="button"
                          onClick={() => handleDownloadExport(exp)}
                          style={{
                            background: "var(--bg-surface-elevated)",
                            border: "1px solid var(--box-border)",
                            color: "var(--accent-primary)",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <Download size={13} />
                          <span>download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </main>

      {/* Standalone Billing & Subscription Modal */}
      {showBillingModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(6px)",
          display: "grid",
          placeItems: "center",
          zIndex: 200,
          padding: "20px"
        }}>
          <div style={{
            background: "var(--card-bg, var(--bg-surface))",
            border: "1px solid var(--box-border)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "560px",
            boxShadow: "var(--card-shadow, 0 24px 60px rgba(0, 0, 0, 0.5))",
            overflow: "hidden"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 24px",
              borderBottom: "1px solid var(--box-border)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CreditCard size={18} color="var(--accent-primary)" />
                <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Billing & Subscription
                </h2>
              </div>
              <button
                onClick={() => setShowBillingModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--box-border)",
                borderRadius: "12px",
                padding: "18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px"
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Creator Free Tier</span>
                    <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(59, 130, 246, 0.14)", color: "var(--accent-primary)", fontWeight: 700 }}>active</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    60 minutes free client-side transcription per month
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBillingModal(false);
                    navigate("/pricing");
                  }}
                  style={{
                    background: "var(--accent-primary)",
                    color: "#fff",
                    border: "none",
                    padding: "9px 16px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Upgrade to Pro
                </button>
              </div>

              <div>
                <h4 style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px 0" }}>
                  Billing History
                </h4>
                <div style={{ background: "var(--bg-[var(--card-bg)]pp)", border: "1px solid var(--box-border)", borderRadius: "8px", padding: "14px 16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  No previous invoices found for this free account.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {showSettingsModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(6px)",
          display: "grid",
          placeItems: "center",
          zIndex: 200,
          padding: "20px"
        }}>
          <div style={{
            background: "var(--card-bg, var(--bg-surface))",
            border: "1px solid var(--box-border)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "600px",
            boxShadow: "var(--card-shadow, 0 24px 60px rgba(0, 0, 0, 0.5))",
            overflow: "hidden"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 24px",
              borderBottom: "1px solid var(--box-border)"
            }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                Account Settings
              </h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", borderBottom: "1px solid var(--box-border)", padding: "0 24px", gap: "16px" }}>
              <button
                onClick={() => setSettingsTab("general")}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: settingsTab === "general" ? "2px solid var(--accent-primary)" : "2px solid transparent",
                  color: settingsTab === "general" ? "var(--accent-primary)" : "var(--text-secondary)",
                  padding: "12px 4px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Profile Settings
              </button>
              <button
                onClick={() => setSettingsTab("danger")}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: settingsTab === "danger" ? "2px solid #ef4444" : "2px solid transparent",
                  color: settingsTab === "danger" ? "#ef4444" : "var(--text-secondary)",
                  padding: "12px 4px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Danger Zone
              </button>
            </div>

            <div style={{ padding: "24px", minHeight: "260px" }}>
              {settingsTab === "general" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your creator name"
                      style={{
                        width: "100%",
                        background: "var(--bg-[var(--card-bg)]pp)",
                        border: "1px solid var(--box-border)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        color: "var(--text-primary)",
                        fontSize: "13px",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Registered Email
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      disabled
                      style={{
                        width: "100%",
                        background: "var(--bg-[var(--card-bg)]pp)",
                        border: "1px solid var(--box-border)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                        cursor: "not-allowed"
                      }}
                    />
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingSettings}
                    style={{
                      marginTop: "12px",
                      background: "var(--accent-primary)",
                      color: "#fff",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      alignSelf: "flex-end"
                    }}
                  >
                    {isSavingSettings ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              )}

              {settingsTab === "danger" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "10px",
                    padding: "14px",
                    display: "flex",
                    gap: "12px"
                  }}>
                    <ShieldAlert size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div style={{ fontSize: "12px", color: "#fca5a5", lineHeight: "1.5" }}>
                      Deleting your account will erase all your saved projects, transcripts, and preferences permanently. This action cannot be reversed.
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Type <strong>DELETE</strong> below to confirm account deletion:
                    </label>
                    <input
                      type="text"
                      placeholder="DELETE"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      style={{
                        width: "100%",
                        background: "var(--bg-[var(--card-bg)]pp)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        color: "#ef4444",
                        fontSize: "13px",
                        outline: "none"
                      }}
                    />
                  </div>

                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "DELETE"}
                    style={{
                      background: deleteConfirmText === "DELETE" ? "#dc2626" : "rgba(220, 38, 38, 0.2)",
                      color: deleteConfirmText === "DELETE" ? "#ffffff" : "var(--text-secondary)",
                      border: "none",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: deleteConfirmText === "DELETE" ? "pointer" : "not-allowed",
                      alignSelf: "flex-end"
                    }}
                  >
                    Permanently Delete Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
