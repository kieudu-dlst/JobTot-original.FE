import { useCallback, useEffect, useRef, useState } from "react";

export function useTyping(chat, conversationId, accountId) {
  const [peerTyping, setPeerTyping] = useState(false);
  const activity = useRef({ active: false, lastSent: 0, idleTimer: null });
  const queue = useRef(Promise.resolve());
  const notify = useCallback(
    (isTyping) => {
      queue.current = queue.current
        .catch(() => {})
        .then(() => chat.invoke("typing", conversationId, { isTyping }))
        .catch(() => {});
    },
    [chat, conversationId],
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
    let expiry;
    const unsubscribe = chat.subscribe((event) => {
      if (event.type === "disconnected" || event.type === "ready") {
        clearTimeout(expiry);
        setPeerTyping(false);
      }
      if (
        event.type !== "typing" ||
        event.conversationId !== conversationId ||
        event.accountId === accountId
      )
        return;
      clearTimeout(expiry);
      const remaining = new Date(event.data.expiresAt).getTime() - Date.now();
      const visible = event.data.isTyping && remaining > 0;
      setPeerTyping(visible);
      if (visible) expiry = setTimeout(() => setPeerTyping(false), remaining);
    });
    const hidden = () => {
      if (document.visibilityState === "hidden") stopTyping();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", stopTyping);
    return () => {
      unsubscribe();
      clearTimeout(expiry);
      stopTyping();
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", stopTyping);
    };
  }, [chat, conversationId, accountId, stopTyping]);
  return { peerTyping, updateTyping, stopTyping };
}
