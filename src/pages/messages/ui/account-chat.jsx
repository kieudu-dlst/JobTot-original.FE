import { formatDateTime } from "@/shared/lib/date-format";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Search,
  MessageCircle,
  Send,
  ArrowLeft,
  RefreshCw,
  UserRound,
  UsersRound,
} from "lucide-react";
import { AuthHeader, EmployerHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { messagesApi } from "../model/messages-api";
import { useTyping } from "../model/use-typing";
import { useSearchParams } from "react-router-dom";
import { mediaUrl } from "@/shared/lib/media-url";

export function AccountChat({ session, employer }) {
  const [searchParams] = useSearchParams();
  const recruiterEmail = searchParams.get("hr");
  const companyId = searchParams.get("company");
  const contactAccountId = searchParams.get("account");
  const [contactError, setContactError] = useState("");
  const [contactConversation, setContactConversation] = useState(null);
  const [conversations, setConversations] = useState([]),
    [activeId, setActiveId] = useState(null),
    [query, setQuery] = useState(""),
    [people, setPeople] = useState([]),
    [error, setError] = useState(""),
    [searchError, setSearchError] = useState(""),
    [loading, setLoading] = useState(true),
    [attempt, setAttempt] = useState(0),
    [starting, setStarting] = useState(false),
    [mobileOpen, setMobileOpen] = useState(false);
  const active =
    conversations.find((c) => c.id === activeId) ||
    (contactConversation?.id === activeId ? contactConversation : null);
  useEffect(() => {
    if ((!recruiterEmail && !companyId && !contactAccountId) || (employer && !contactAccountId))
      return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const result = await messagesApi(employer, "", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            contactAccountId
              ? { accountId: contactAccountId }
              : companyId
                ? { companyId }
                : { recruiterEmail },
          ),
        });
        if (!result.peer)
          throw new Error("Không thể mở thông tin HR. Vui lòng khởi động lại API rồi thử lại.");
        if (!controller.signal.aborted) {
          setContactConversation(result);
          setConversations((current) => [result, ...current.filter((c) => c.id !== result.id)]);
          setActiveId(result.id);
          setMobileOpen(true);
          setContactError("");
        }
      } catch (cause) {
        if (!controller.signal.aborted) setContactError(cause.message);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [recruiterEmail, companyId, contactAccountId, employer, attempt]);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const rows = await messagesApi(employer, "", { signal: controller.signal });
        if (!controller.signal.aborted) {
          setConversations(
            contactConversation && !rows.some((c) => c.id === contactConversation.id)
              ? [contactConversation, ...rows]
              : rows,
          );
          setError("");
          setLoading(false);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause.message);
          setLoading(false);
        }
      }
    };
    const timer = setTimeout(load, 0),
      interval = setInterval(load, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      controller.abort();
    };
  }, [employer, attempt, contactConversation]);
  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const rows = await messagesApi(employer, `/people?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setPeople(rows);
          setSearchError("");
        }
      } catch (cause) {
        if (!controller.signal.aborted) setSearchError(cause.message);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [employer, query]);
  async function start(person) {
    if (starting) return;
    setStarting(true);
    setError("");
    try {
      const result = await messagesApi(employer, "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: person.id }),
      });
      setConversations((current) =>
        current.some((c) => c.id === result.id)
          ? current
          : [{ id: result.id, peer: person, lastText: "" }, ...current],
      );
      setActiveId(result.id);
      setMobileOpen(true);
      setQuery("");
      setPeople([]);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setStarting(false);
    }
  }
  return (
    <div className="messages-page font-roboto">
      <title>Tin nhắn | Job Tốt</title>
      {employer ? (
        <EmployerHeader active="messages" userName={session.account.fullName} />
      ) : (
        <AuthHeader userName={session.account.fullName} />
      )}
      <main className="page-container company-container chat-container">
        <PageBreadcrumb current="Tin nhắn" />
        <div className="chat-page-heading">
          <div>
            <span className="chat-eyebrow">
              <UsersRound />
              KẾT NỐI CỘNG ĐỒNG JOB TỐT
            </span>
            <h1>Tin nhắn</h1>
            <p>Trò chuyện với ứng viên và nhà tuyển dụng trong cộng đồng.</p>
          </div>
          <button className="account-chat-refresh" onClick={() => setAttempt((n) => n + 1)}>
            <RefreshCw />
            Làm mới
          </button>
        </div>
        {(error || contactError) && (
          <p role="alert" className="chat-error">
            {contactError || error}
          </p>
        )}
        <div className={`chat-workspace ${mobileOpen ? "chat-mobile-open" : ""}`}>
          <aside className="chat-sidebar">
            <div className="chat-sidebar-top">
              <label className="chat-search">
                <Search />
                <input
                  aria-label="Tìm tài khoản để trò chuyện"
                  placeholder="Tìm người bằng tên (ít nhất 2 ký tự)…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPeople([]);
                    setSearchError("");
                  }}
                />
              </label>
              <p className="account-chat-hint">Tìm ứng viên hoặc nhà tuyển dụng để bắt đầu.</p>
            </div>
            <div className="chat-conversations">
              {query.trim().length >= 2 ? (
                <>
                  {searchError && <p role="alert">{searchError}</p>}
                  {people.map((person) => (
                    <button
                      className="chat-conversation"
                      key={person.id}
                      disabled={starting}
                      onClick={() => start(person)}
                    >
                      <PersonAvatar name={person.name} avatarUrl={person.avatarUrl} />
                      <span className="chat-conversation-copy">
                        <strong>{person.name}</strong>
                        <span className="chat-conversation-person">{roleName(person.role)}</span>
                      </span>
                    </button>
                  ))}
                  {!people.length && !searchError && (
                    <p className="chat-empty">Chưa có kết quả tìm kiếm.</p>
                  )}
                </>
              ) : (
                <>
                  {conversations.map((c) => (
                    <button
                      className={`chat-conversation ${c.id === activeId ? "chat-active" : ""}`}
                      aria-pressed={c.id === activeId}
                      key={c.id}
                      onClick={() => {
                        setActiveId(c.id);
                        setMobileOpen(true);
                      }}
                    >
                      <PersonAvatar name={c.peer.name} avatarUrl={c.peer.avatarUrl} />
                      <span className="chat-conversation-copy">
                        <strong>{c.peer.name}</strong>
                        <span className="chat-conversation-person">{roleName(c.peer.role)}</span>
                        <span className="chat-last-message">
                          {c.lastText || "Bắt đầu cuộc trò chuyện"}
                        </span>
                      </span>
                    </button>
                  ))}
                  {!conversations.length && (
                    <div className="chat-empty">
                      <MessageCircle />
                      <p>
                        {loading
                          ? "Đang tải hội thoại…"
                          : "Bạn chưa có hội thoại. Tìm một người để bắt đầu trò chuyện."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
          {active ? (
            <MessageThread
              key={active.id}
              conversation={active}
              accountId={session.account.id}
              employer={employer}
              back={() => setMobileOpen(false)}
              sent={(message) =>
                setConversations((current) =>
                  current.map((c) => (c.id === active.id ? { ...c, lastText: message.text } : c)),
                )
              }
            />
          ) : (
            <section className="chat-thread account-chat-welcome">
              <UsersRound />
              <h2>Trò chuyện cùng mọi người</h2>
              <p>Chọn một hội thoại hoặc tìm tài khoản để kết nối.</p>
            </section>
          )}
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}

function MessageThread({ conversation, accountId, employer, back, sent }) {
  const { peerTyping, updateTyping, stopTyping } = useTyping(employer, conversation.id);
  const [messages, setMessages] = useState([]),
    [draft, setDraft] = useState(""),
    [error, setError] = useState(""),
    [sending, setSending] = useState(false),
    [hasMore, setHasMore] = useState(false),
    [olderLoading, setOlderLoading] = useState(false);
  const list = useRef(null),
    pending = useRef(null),
    keepScroll = useRef(false),
    busy = useRef(false),
    cursor = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    let running = false;
    const load = async () => {
      if (running) return;
      running = true;
      try {
        const data = await messagesApi(
          employer,
          `/${conversation.id}${cursor.current === null ? "" : `?after=${cursor.current}`}`,
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) {
          setMessages((current) => mergeMessages(current, data.items));
          if (cursor.current === null) setHasMore(data.hasMore);
          cursor.current = data.items.at(-1)?.id ?? cursor.current ?? 0;
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause.message);
      } finally {
        running = false;
      }
    };
    const timer = setTimeout(load, 0),
      interval = setInterval(load, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      controller.abort();
    };
  }, [conversation.id, employer]);
  useEffect(() => {
    const controller = new AbortController();
    const mark = async () => {
      if (document.visibilityState !== "visible") return;
      const ids = messages
        .filter((message) => message.senderAccountId !== accountId)
        .map((message) => message.id);
      if (!ids.length) return;
      try {
        for (let offset = 0; offset < ids.length; offset += 100) {
          await messagesApi(employer, `/${conversation.id}/read`, {
            method: "PUT",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageIds: ids.slice(offset, offset + 100) }),
          });
        }
        if (!controller.signal.aborted) window.dispatchEvent(new Event("account-read-updated"));
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      }
    };
    const timer = setTimeout(mark, 0);
    document.addEventListener("visibilitychange", mark);
    return () => {
      clearTimeout(timer);
      controller.abort();
      document.removeEventListener("visibilitychange", mark);
    };
  }, [messages, accountId, employer, conversation.id]);
  useLayoutEffect(() => {
    if (list.current && !keepScroll.current) list.current.scrollTop = list.current.scrollHeight;
    keepScroll.current = false;
  }, [messages]);
  async function older() {
    if (olderLoading || !messages.length) return;
    setOlderLoading(true);
    try {
      const data = await messagesApi(employer, `/${conversation.id}?before=${messages[0].id}`);
      keepScroll.current = true;
      setMessages((current) => mergeMessages(current, data.items));
      setHasMore(data.hasMore);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setOlderLoading(false);
    }
  }
  async function send(e) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || busy.current) return;
    stopTyping();
    busy.current = true;
    setSending(true);
    setError("");
    if (!pending.current || pending.current.text !== text)
      pending.current = { text, clientMessageId: crypto.randomUUID() };
    try {
      const message = await messagesApi(employer, `/${conversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending.current),
      });
      setMessages((current) => mergeMessages(current, [message]));
      setDraft("");
      pending.current = null;
      sent(message);
    } catch (cause) {
      setError(cause.message);
    } finally {
      busy.current = false;
      setSending(false);
    }
  }
  return (
    <section className="chat-thread" aria-label={`Hội thoại với ${conversation.peer.name}`}>
      <div className="chat-thread-header">
        <button
          className="chat-back"
          aria-label="Quay lại danh sách hội thoại"
          onClick={() => {
            stopTyping();
            back();
          }}
        >
          <ArrowLeft />
        </button>
        <PersonAvatar name={conversation.peer.name} avatarUrl={conversation.peer.avatarUrl} />
        <div>
          <h2>{conversation.peer.name}</h2>
          <p>{roleName(conversation.peer.role)}</p>
        </div>
      </div>
      <div className="chat-message-list" ref={list} aria-label="Nội dung hội thoại">
        {hasMore && (
          <button className="account-chat-older" disabled={olderLoading} onClick={older}>
            {olderLoading ? "Đang tải…" : "Xem tin nhắn trước"}
          </button>
        )}
        {!messages.length && (
          <p className="chat-empty">Bắt đầu cuộc trò chuyện bằng một lời chào.</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-message chat-${m.senderAccountId === accountId ? "sent" : "received"}`}
          >
            <div>
              <div className="chat-bubble">
                <p>{m.text}</p>
              </div>
              <div className="chat-message-meta">
                <time dateTime={m.sentAt}>{formatDateTime(m.sentAt)}</time>
              </div>
            </div>
          </div>
        ))}
      </div>
      <span className="chat-typing-status" role="status" aria-live="polite">
        {peerTyping ? "Đang nhập..." : ""}
      </span>
      <form className="chat-composer" onSubmit={send}>
        {error && (
          <p role="alert" className="chat-error">
            {error}
          </p>
        )}
        <div className="chat-compose-box">
          <textarea
            aria-label="Nội dung tin nhắn"
            placeholder="Nhập tin nhắn… (Shift + Enter để xuống dòng)"
            maxLength={4000}
            value={draft}
            disabled={sending}
            onChange={(e) => {
              setDraft(e.target.value);
              updateTyping(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
          />
          <div className="chat-compose-actions">
            <span className="chat-character-count">{draft.length}/4000</span>
            <button className="chat-send" disabled={!draft.trim() || sending}>
              {sending ? "Đang gửi…" : "Gửi tin"}
              <Send />
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
function PersonAvatar({ name, avatarUrl }) {
  const src = mediaUrl(avatarUrl);
  const [brokenUrl, setBrokenUrl] = useState(null);
  return (
    <span className="chat-avatar" aria-hidden="true">
      {src && src !== brokenUrl ? (
        <img key={src} src={src} alt="" onError={() => setBrokenUrl(src)} />
      ) : (
        name
          ?.split(" ")
          .slice(-2)
          .map((w) => w[0])
          .join("") || <UserRound />
      )}
    </span>
  );
}
function roleName(role) {
  return role === "Employer" ? "Nhà tuyển dụng" : "Ứng viên";
}
function mergeMessages(current, next) {
  if (next.every((m) => current.some((old) => old.id === m.id))) return current;
  return [...new Map([...current, ...next].map((m) => [m.id, m])).values()].sort(
    (a, b) => a.id - b.id,
  );
}
