import type { ReactElement } from "react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StudioApp from "../studio/StudioApp";
import { StudioDashboard } from "../components/StudioDashboard";

function readTemplateId(state: unknown): string | undefined {
  if (typeof state === "object" && state !== null && "templateId" in state) {
    const value = (state as { templateId: unknown }).templateId;
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

export default function StudioPage(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [showEditor, setShowEditor] = useState<boolean>(false);

  if (showEditor) {
    return (
      <StudioApp 
        initialTemplateId={readTemplateId(location.state)} 
        initialFile={selectedFile}
        projectId={activeProjectId}
        onBackToDashboard={() => {
          setSelectedFile(null);
          setActiveProjectId(undefined);
          setShowEditor(false);
        }}
      />
    );
  }

  return (
    <StudioDashboard
      onOpenFile={(file: File, projId?: string) => {
        setSelectedFile(file);
        setActiveProjectId(projId);
        setShowEditor(true);
      }}
      onOpenEditor={(projId?: string) => {
        setActiveProjectId(projId);
        setShowEditor(true);
      }}
      onSignOut={() => navigate("/")}
    />
  );
}
