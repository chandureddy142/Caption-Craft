import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { LandingPage } from "../components/LandingPage";

export default function HomePage(): ReactElement {
  const navigate = useNavigate();
  return <LandingPage onStart={() => navigate("/studio")} />;
}
