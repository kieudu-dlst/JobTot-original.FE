import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CandidateApp } from "./candidate-app";
import "./styles/index.css";
import "@/shared/ui/page-container.css";
import "@/shared/ui/select.css";
import "@/shared/ui/site-layout.css";
import "@/shared/ui/pagination.css";
import "@/shared/ui/responsive.css";
import "@/shared/ui/visual-system.css";
import "@/shared/ui/vibrant-theme.css";
import { SessionProvider, EmployerSessionProvider } from "@/features/authenticate";
import { HeaderDataProvider } from "@/widgets/auth-header";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SessionProvider>
      <EmployerSessionProvider>
        <HeaderDataProvider>
          <CandidateApp />
        </HeaderDataProvider>
      </EmployerSessionProvider>
    </SessionProvider>
  </StrictMode>,
);
