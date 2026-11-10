import { useEffect, useRef, useState } from "react";
import { SavedJobsContext } from "./saved-jobs-context";
import { savedJobsApi } from "../api/saved-jobs";

const STORAGE_KEY = "talenthub:saved-jobs";

function readSavedJobs() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function SavedJobsProvider({ children, account, sessionLoading = false }) {
  const [guestIds, setGuestIds] = useState(readSavedJobs);
  const [remote, setRemote] = useState({ accountId: null, ids: [], error: "" });
  const [attempt, setAttempt] = useState(0);
  const [pendingIds, setPendingIds] = useState([]);
  const pending = useRef(new Set());
  const accountId = account?.id;
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guestIds));
    } catch {
      /* Vẫn sử dụng được khi storage bị chặn. */
    }
  }, [guestIds]);
  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      savedJobsApi
        .list(controller.signal)
        .then((ids) => {
          if (!controller.signal.aborted) setRemote({ accountId, ids, error: "" });
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setRemote({ accountId, ids: [], error: failure.message });
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [accountId, attempt]);
  const savedIds = accountId ? (remote.accountId === accountId ? remote.ids : []) : guestIds;
  const savedLoading = sessionLoading || (!!accountId && remote.accountId !== accountId);
  const savedError = accountId && remote.accountId === accountId ? remote.error : "";

  async function toggleSaved(id) {
    if (savedLoading || savedError || pending.current.has(id)) return null;
    const saved = !savedIds.includes(id);
    if (!accountId) {
      setGuestIds((current) =>
        saved ? [...new Set([...current, id])] : current.filter((value) => value !== id),
      );
      return saved;
    }
    pending.current.add(id);
    setPendingIds([...pending.current]);
    try {
      await savedJobsApi.set(id, saved);
      setRemote((current) =>
        current.accountId === accountId
          ? {
              ...current,
              ids: saved
                ? [...new Set([...current.ids, id])]
                : current.ids.filter((value) => value !== id),
            }
          : current,
      );
      return saved;
    } finally {
      pending.current.delete(id);
      setPendingIds([...pending.current]);
    }
  }

  return (
    <SavedJobsContext.Provider
      value={{
        savedIds,
        toggleSaved,
        savedLoading,
        savedError,
        pendingIds,
        reloadSaved: () => setAttempt((value) => value + 1),
      }}
    >
      {children}
    </SavedJobsContext.Provider>
  );
}
