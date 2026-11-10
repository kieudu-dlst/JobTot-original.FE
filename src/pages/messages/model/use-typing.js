import { useCallback, useEffect, useRef, useState } from "react";
import { messagesApi } from "./messages-api";

export function useTyping(employer, conversationId) {
  const [peerTyping, setPeerTyping] = useState(false);
  const activity = useRef({ active: false, lastSent: 0, idleTimer: null });
  const queue = useRef(Promise.resolve());
  const notify = useCallback(
    (isTyping) => {
      // Serialize updates so a delayed heartbeat cannot arrive after the stop event.
      queue.current = queue.current
        .catch(() => {})
        .then(() =>
          messagesApi(employer, `/${conversationId}/typing`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isTyping }),
          }),
        )
        .catch(() => {});
    },
    [employer, conversationId],
  );
  const stopTyping = useCallback(() => {
    clearTimeout(activity.current.idleTimer);
    if (activity.current.active) notify(false);
    activity.current.active = false;
    activity.current.lastSent = 0;
  }, [notify]);
  const updateTyping = useCallback(
    (value) => {
      if (!value.trim() || document.visibilityState === "hidden") return stopTyping();
      const now = Date.now();
      if (!activity.current.active || now - activity.current.lastSent >= 2000) {
        notify(true);
        activity.current.lastSent = now;
      }
      activity.current.active = true;
      clearTimeout(activity.current.idleTimer);
      activity.current.idleTimer = setTimeout(stopTyping, 3000);
    },
    [notify, stopTyping],
  );

  useEffect(() => {
    const controller = new AbortController();
    let running = false,
      expiryTimer;
    const load = async () => {
      if (running || document.visibilityState === "hidden") return;
      running = true;
      try {
        const data = await messagesApi(employer, `/${conversationId}/typing`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        clearTimeout(expiryTimer);
        const remaining = new Date(data.expiresAt).getTime() - Date.now();
        const visible = data.isTyping === true && remaining > 0;
        setPeerTyping(visible);
        if (visible) expiryTimer = setTimeout(() => setPeerTyping(false), remaining);
      } catch {
        if (!controller.signal.aborted) setPeerTyping(false);
      } finally {
        running = false;
      }
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") setPeerTyping(false);
      else load();
    };
    const timer = setTimeout(load, 0),
      interval = setInterval(load, 1000);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", stopTyping);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      clearTimeout(expiryTimer);
      controller.abort();
      stopTyping();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", stopTyping);
    };
  }, [employer, conversationId, stopTyping]);
  return { peerTyping, updateTyping, stopTyping };
}
