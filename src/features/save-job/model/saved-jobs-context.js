import { createContext, useContext } from "react";

export const SavedJobsContext = createContext(null);

export function useSavedJobs() {
  const context = useContext(SavedJobsContext);
  if (!context) throw new Error("useSavedJobs phải được dùng trong SavedJobsProvider");
  return context;
}
