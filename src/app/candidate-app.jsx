import { RouterProvider } from "react-router-dom";
import { useCandidateSession } from "@/features/authenticate";
import { SavedJobsProvider } from "@/features/save-job";
import { ToastProvider } from "@/shared/ui/toast";
import { router } from "./router";

export function CandidateApp() {
  const { account, loading } = useCandidateSession();
  return (
    <SavedJobsProvider account={account} sessionLoading={loading}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </SavedJobsProvider>
  );
}
