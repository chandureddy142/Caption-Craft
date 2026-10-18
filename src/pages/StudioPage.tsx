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
  const [showEditor, setShowEditor] = useState<boolean>(false);

  if (showEditor) {
    return (
      <StudioApp 
        initialTemplateId={readTemplateId(location.state)} 
        initialFile={selectedFile}
        onBackToDashboard={() => {
          setSelectedFile(null);
          setShowEditor(false);
        }}
      />
    );
  }

  return (
    <StudioDashboard
      onOpenFile={(file: File) => {
        setSelectedFile(file);
        setShowEditor(true);
      }}
      onOpenEditor={() => {
        setShowEditor(true);
      }}
      onSignOut={() => navigate("/")}
    />
  );
}
