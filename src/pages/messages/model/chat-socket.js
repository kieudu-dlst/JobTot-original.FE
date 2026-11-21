export function createChatSocket(
  employer,
  {
    WebSocketImpl = WebSocket,
    request,
    baseUrl = import.meta.env?.VITE_API_BASE_URL || window.location.origin,
  } = {},
) {
  const listeners = new Set();
  const pending = new Map();
  let socket,
    connecting,
    retryTimer,
    stopped = true,
    failures = 0;
  const emit = (event) => listeners.forEach((listener) => listener(event));
  function rejectPending() {
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(new Error("Kết nối chat bị ngắt. Bạn có thể gửi lại tin nhắn."));
    }
    pending.clear();
  }
  async function connect() {
    if (stopped) throw new Error("Kết nối chat đã đóng.");
    if (socket?.readyState === 1) return;
    if (connecting) return connecting;
    connecting = (async () => {
      const response = await request("messages/socket-ticket", { method: "POST" });
      if (!response.ok) {
        if (response.status === 404 || response.status === 405)
          throw new Error(
            "API đang chạy chưa có endpoint chat WebSocket. Vui lòng khởi động lại backend bản mới.",
          );
        if (response.status === 401 || response.status === 403)
          throw new Error("Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.");
        throw new Error(`Không thể mở kết nối chat (HTTP ${response.status}). Vui lòng thử lại.`);
      }
      const { ticket } = await response.json();
      if (typeof ticket !== "string" || !ticket)
        throw new Error("Backend không trả về ticket chat hợp lệ.");
      if (stopped) return;
      const base = baseUrl.replace(/\/$/, "");
      const url = new URL(
        `${base}/api/${employer ? "employer" : "candidate"}/messages/socket`,
        window.location.origin,
      );
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.searchParams.set("ticket", ticket);
      await new Promise((resolve, reject) => {
        const current = new WebSocketImpl(url);
        socket = current;
        const opening = setTimeout(() => current.close(), 15000);
        current.onopen = () => {
          clearTimeout(opening);
          if (stopped) {
            current.close();
            return;
          }
          failures = 0;
          emit({ type: "ready" });
          resolve();
        };
        current.onmessage = ({ data }) => {
          let event;
          try {
            event = JSON.parse(data);
          } catch {
            return;
          }
          if (event.type === "result") {
            const entry = pending.get(event.id);
            if (!entry) return;
            clearTimeout(entry.timer);
            pending.delete(event.id);
            if (event.ok) entry.resolve(event.data);
            else
              entry.reject(new Error(event.data?.detail || "Không thể thực hiện thao tác chat."));
          } else emit(event);
        };
        current.onerror = () => current.close();
        current.onclose = () => {
          clearTimeout(opening);
          reject(new Error("Không thể kết nối chat."));
          if (socket === current) socket = null;
          rejectPending();
          emit({ type: "disconnected" });
          schedule();
        };
      });
    })()
      .catch((error) => {
        emit({ type: "error", message: error.message });
        throw error;
      })
      .finally(() => {
        connecting = null;
      });
    return connecting;
  }
  function schedule() {
    if (stopped || retryTimer) return;
    retryTimer = setTimeout(
      () => {
        retryTimer = null;
        connect().catch(() => schedule());
      },
      Math.min(30000, 1000 * 2 ** Math.min(failures++, 5)),
    );
  }
  function stop() {
    stopped = true;
    clearTimeout(retryTimer);
    retryTimer = null;
    socket?.close();
    rejectPending();
    window.removeEventListener(
      employer ? "employer-session-ended" : "candidate-session-ended",
      stop,
    );
  }
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start() {
      stopped = false;
      window.addEventListener(
        employer ? "employer-session-ended" : "candidate-session-ended",
        stop,
      );
      connect().catch(() => schedule());
    },
    stop,
    async invoke(type, conversationId, data) {
      await connect();
      if (stopped || socket?.readyState !== 1)
        throw new Error("Chat đang kết nối lại. Vui lòng thử lại.");
      const id = crypto.randomUUID();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error("Chưa nhận được xác nhận. Bạn có thể gửi lại tin nhắn."));
        }, 20000);
        pending.set(id, { resolve, reject, timer });
        try {
          socket.send(JSON.stringify({ id, type, conversationId, data }));
        } catch (error) {
          clearTimeout(timer);
          pending.delete(id);
          reject(error);
        }
      });
    },
  };
}
