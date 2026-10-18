import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import SiteLayout from "./components/SiteLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PricingPage from "./pages/PricingPage";
import TemplatesPage from "./pages/TemplatesPage";
import StudioPage from "./pages/StudioPage";

export default function App(): ReactElement {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="studio" element={<StudioPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
