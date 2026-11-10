import { useEffect, useState } from "react";

export function useDemoDataset(key, enabled = true) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
        const response = await fetch(`${base}/api/demo-data/${key}`, { signal: controller.signal });
        if (!response.ok) return;
        const value = await response.json();
        if (!controller.signal.aborted) setData(value);
      } catch {
        /* Optional promotional content stays hidden if unavailable. */
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, enabled]);
  return data;
}
