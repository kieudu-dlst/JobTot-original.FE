import { Bookmark } from "lucide-react";
import { useToast } from "@/shared/ui/toast-context";
import { Button } from "@/shared/ui/button";
import { useSavedJobs } from "../model/saved-jobs-context";

export function SaveJobButton({ jobId, title }) {
  const notify = useToast();
  const { savedIds, toggleSaved, savedLoading, savedError, pendingIds } = useSavedJobs();
  const saved = savedIds.includes(jobId);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={saved}
      aria-label={`${saved ? "Bỏ lưu" : "Lưu"} ${title}`}
      disabled={savedLoading || !!savedError || pendingIds.includes(jobId)}
      title={savedError || undefined}
      onClick={async () => {
        try {
          const next = await toggleSaved(jobId);
          if (next !== null) notify(next ? `Đã lưu ${title}.` : `Đã bỏ lưu ${title}.`);
        } catch (failure) {
          notify(failure.message, { type: "error" });
        }
      }}
    >
      <Bookmark className={saved ? "fill-emerald-600 text-emerald-600" : "text-muted-foreground"} />
    </Button>
  );
}
