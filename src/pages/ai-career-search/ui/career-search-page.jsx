import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Send, X, ImagePlus, Plus, History, MessageSquare, ChevronDown } from "lucide-react";
import { useCandidateSession, useEmployerSession } from "@/features/authenticate";
import { AuthHeader, EmployerHeader } from "@/widgets/auth-header";
import { createSearchRunner, selectCareerRole } from "../model/career-search";
import { requestCareerSearch } from "../api/career-search";
import { readCvImage } from "../model/cv-image";
import { listConversations, readConversation } from "../api/conversations";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/shared/ui/button";
import "./career-search.css";

export function CareerSearchPage() {
  const candidate = useCandidateSession(),
    employer = useEmployerSession();
  const location = useLocation();
  const requested = location.pathname.startsWith("/employer/")
    ? "employer"
    : new URLSearchParams(location.search).get("role");
  const role = selectCareerRole(requested, candidate.account, employer.account);
  const session = role === "employer" ? employer : candidate;
  const Header = role === "employer" ? EmployerHeader : AuthHeader;
  const returnTo = `/ai/career-search?role=${role}`;
  const login = `/login?role=${role}&returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <div className="ai-page font-roboto">
      <title>Trợ lý AI | Job Tốt</title>
      <Header userName={session.account?.fullName} loading={session.loading} />
      <main className="ai-container">
        {candidate.loading || employer.loading ? (
          <p role="status">Đang kiểm tra phiên đăng nhập…</p>
        ) : !session.account ? (
          <section className="ai-card ai-guest">
            <h2>Đăng nhập để hỏi AI</h2>
            <p>
              Sử dụng tài khoản {role === "employer" ? "nhà tuyển dụng" : "ứng viên"} để mở trợ lý
              nghề nghiệp.
            </p>
            <Link className="ai-primary" to={login}>
              Đăng nhập và tiếp tục
            </Link>
          </section>
        ) : (
          <CareerSearchForm
            key={`${role}-${session.account.id}`}
            employer={role === "employer"}
            login={login}
          />
        )}
      </main>
    </div>
  );
}
export function CareerSearchForm({ employer, login }) {
  const [question, setQuestion] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyPanelId = useId();
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState("");
  const [readingImage, setReadingImage] = useState(false);
  const thread = useRef(null);
  const scrollAnchor = useRef(null);
  const fileInput = useRef(null);
  const imageRead = useRef(null);
  const historyRead = useRef(null);
  const loadedImages = useRef([]);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [hasOlder, setHasOlder] = useState(false);
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState({ phase: "idle" });
  const [waitUntil, setWaitUntil] = useState(0);
  const input = useRef(null),
    busy = useRef(false);
  const runner = useMemo(
    () =>
      createSearchRunner((text, signal, attachment, id) =>
        requestCareerSearch(employer, text, signal, attachment, id),
      ),
    [employer],
  );
  useEffect(
    () => () => {
      runner.cancel();
      imageRead.current?.abort();
      imageRead.current = null;
      historyRead.current?.abort();
      loadedImages.current.forEach((url) => URL.revokeObjectURL(url));
      loadedImages.current = [];
    },
    [runner],
  );
  useEffect(() => {
    const reset = () => {
      runner.cancel();
      busy.current = false;
      setQuestion("");
      imageRead.current?.abort();
      imageRead.current = null;
      setImage(null);
      setImageError("");
      setReadingImage(false);
      setMessages([]);
      historyRead.current?.abort();
      loadedImages.current.forEach((url) => URL.revokeObjectURL(url));
      loadedImages.current = [];
      setConversationId(null);
      setConversations([]);
      setHistoryLoading(false);
      setHasOlder(false);
      setState({ phase: "idle" });
      setWaitUntil(0);
    };
    const changed = (event) => {
      if (
        event.key === null ||
        event.key === `jobtot.${employer ? "employer" : "candidate"}.tokens`
      )
        reset();
    };
    const ended = `${employer ? "employer" : "candidate"}-session-ended`;
    window.addEventListener("storage", changed);
    window.addEventListener(ended, reset);
    return () => {
      window.removeEventListener("storage", changed);
      window.removeEventListener(ended, reset);
    };
  }, [runner, employer]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      listConversations(employer, controller.signal)
        .then((items) => {
          if (!controller.signal.aborted) {
            setConversations(items);
            setHistoryError("");
          }
        })
        .catch((error) => {
          if (!controller.signal.aborted) setHistoryError(error.message);
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [employer, historyRefresh]);
  useEffect(() => {
    const element = thread.current;
    if (!element) return;
    const anchor = scrollAnchor.current;
    element.scrollTop = anchor
      ? anchor.top + element.scrollHeight - anchor.height
      : element.scrollHeight;
    scrollAnchor.current = null;
  }, [messages, state.phase]);
  function newConversation() {
    if (busy.current) return;
    setHistoryOpen(false);
    historyRead.current?.abort();
    loadedImages.current.forEach((url) => URL.revokeObjectURL(url));
    loadedImages.current = [];
    imageRead.current?.abort();
    imageRead.current = null;
    setReadingImage(false);
    setConversationId(null);
    setMessages([]);
    setQuestion("");
    setImage(null);
    setImageError("");
    setState({ phase: "idle" });
    setHasOlder(false);
    setHistoryLoading(false);
    input.current?.focus();
  }
  async function openConversation(id, older = false) {
    if (busy.current) return;
    if (!id) {
      newConversation();
      return;
    }
    historyRead.current?.abort();
    const controller = new AbortController();
    historyRead.current = controller;
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const page = await readConversation(
        employer,
        id,
        older ? messages[0]?.id : null,
        controller.signal,
      );
      if (controller.signal.aborted) {
        page.urls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }
      if (!older) {
        loadedImages.current.forEach((url) => URL.revokeObjectURL(url));
        loadedImages.current = [];
        imageRead.current?.abort();
        imageRead.current = null;
        setReadingImage(false);
        setQuestion("");
        setImage(null);
        setImageError("");
        setState({ phase: "idle" });
      }
      loadedImages.current.push(...page.urls);
      if (older && thread.current) {
        scrollAnchor.current = {
          top: thread.current.scrollTop,
          height: thread.current.scrollHeight,
        };
      }
      setMessages((previous) => (older ? [...page.messages, ...previous] : page.messages));
      setConversationId(id);
      if (!older) setHistoryOpen(false);
      setHasOlder(page.hasMore);
    } catch (error) {
      if (!controller.signal.aborted) setHistoryError(error.message);
    } finally {
      if (historyRead.current === controller) setHistoryLoading(false);
    }
  }
  useEffect(() => {
    if (!waitUntil) return;
    const timer = setTimeout(() => setWaitUntil(0), Math.max(0, waitUntil - Date.now()));
    return () => clearTimeout(timer);
  }, [waitUntil]);
  async function selectImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    imageRead.current?.abort();
    const controller = new AbortController();
    imageRead.current = controller;
    setReadingImage(true);
    setImageError("");
    setImage(null);
    try {
      const selected = await readCvImage(file, controller.signal);
      if (!controller.signal.aborted) setImage(selected);
    } catch (error) {
      if (!controller.signal.aborted) setImageError(error.message);
    } finally {
      if (imageRead.current === controller) setReadingImage(false);
    }
  }
  async function submit(text) {
    if (busy.current || waitUntil || readingImage || historyLoading) return;
    if ((!text.trim() && !image) || text.length > 2000) {
      setState({
        phase: "error",
        question: text,
        error: {
          message: "Vui lòng nhập câu hỏi từ 1 đến 2000 ký tự.",
          code: "ai_invalid_question",
        },
      });
      input.current?.focus();
      return;
    }
    const attachment = image;
    const prompt = text.trim() || "Nhận xét và góp ý cải thiện CV trong ảnh giúp mình.";
    setQuestion("");
    setImage(null);
    setImageError("");
    setMessages((previous) => [
      ...previous,
      { role: "user", text: prompt, image: attachment?.preview },
    ]);
    busy.current = true;
    setState({ phase: "loading", question: prompt });
    const outcome = await runner.run(prompt, attachment, conversationId);
    if (!outcome) return;
    busy.current = false;
    if (outcome.error) {
      if (outcome.error.conversationId) setConversationId(outcome.error.conversationId);
      setState({ phase: "error", question: outcome.question, error: outcome.error });
      if (outcome.error.retryAfter) setWaitUntil(Date.now() + outcome.error.retryAfter * 1000);
    } else {
      if (outcome.result.conversationId) setConversationId(outcome.result.conversationId);
      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: outcome.result.answer, jobs: outcome.result.jobs },
      ]);
      setState({ phase: "success" });
    }
    setHistoryRefresh((value) => value + 1);
  }
  function cancel() {
    runner.cancel();
    busy.current = false;
    setState({ phase: "cancelled" });
    setHistoryRefresh((value) => value + 1);
  }
  return (
    <div className={`ai-conversation ai-conversation--${employer ? "employer" : "candidate"}`}>
      <Button
        type="button"
        variant="ghost"
        className="ai-history-toggle"
        aria-controls={historyPanelId}
        aria-expanded={historyOpen}
        onClick={() => setHistoryOpen((value) => !value)}
      >
        <History size={18} />
        Lịch sử trò chuyện
        <ChevronDown size={16} />
      </Button>
      {historyOpen && (
        <button
          className="ai-history-scrim"
          aria-label="Đóng lịch sử trò chuyện"
          onClick={() => setHistoryOpen(false)}
        />
      )}
      <aside
        id={historyPanelId}
        className={`ai-history-sidebar ${historyOpen ? "is-open" : ""}`}
        aria-label="Lịch sử trò chuyện"
      >
        <Button
          type="button"
          variant="outline"
          className="ai-new-conversation"
          onClick={newConversation}
          disabled={state.phase === "loading"}
        >
          <Plus size={18} />
          Cuộc trò chuyện mới
        </Button>
        <h2>
          <History size={16} aria-hidden="true" />
          Lịch sử trò chuyện
        </h2>
        <nav className="ai-history-list" aria-label="Các cuộc trò chuyện đã lưu">
          {conversationId && !conversations.some((item) => item.id === conversationId) && (
            <div className="ai-history-current">Cuộc trò chuyện hiện tại</div>
          )}
          {conversations.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              className="ai-history-item"
              aria-current={conversationId === item.id ? "page" : undefined}
              disabled={state.phase === "loading" || historyLoading}
              title={item.title}
              onClick={() => openConversation(item.id)}
            >
              <MessageSquare size={16} aria-hidden="true" />
              <span>{item.title}</span>
            </Button>
          ))}
          {conversations.length === 0 && !historyError && (
            <p className="ai-history-empty">Các cuộc trò chuyện của bạn sẽ xuất hiện ở đây.</p>
          )}
        </nav>
        {historyError && (
          <div role="alert" className="ai-chat-error">
            <p>{historyError}</p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setHistoryRefresh((value) => value + 1)}
            >
              Tải lại lịch sử
            </Button>
          </div>
        )}
      </aside>
      <section className="ai-chat-main" aria-label="Nội dung trò chuyện">
        <div className="ai-chat-topbar">
          <img src="/images/mascot/logo.png" alt="" width="32" height="32" />
          <h1>Trợ lý AI</h1>
        </div>
        {historyLoading && (
          <p role="status" className="ai-image-help">
            Đang tải cuộc trò chuyện…
          </p>
        )}
        <div
          ref={thread}
          className="ai-thread"
          role="log"
          aria-label="Cuộc trò chuyện với Trợ lý AI"
        >
          {hasOlder && (
            <Button
              type="button"
              variant="ghost"
              disabled={historyLoading || state.phase === "loading"}
              onClick={() => openConversation(conversationId, true)}
            >
              Tải tin nhắn cũ hơn
            </Button>
          )}
          {messages.length === 0 && (
            <div className="ai-empty">
              <picture className="ai-welcome-sticker">
                <source
                  media="(prefers-reduced-motion: reduce)"
                  srcSet="/images/mascot/welcome-transparent.png"
                />
                <img
                  src="/images/mascot/welcome-transparent.gif"
                  alt="Mascot JobTot chào bạn bên chiếc laptop"
                  width="320"
                  height="180"
                  decoding="async"
                />
              </picture>
              <p>Xin chào! Bạn muốn tìm hiểu điều gì hôm nay?</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`ai-message ai-message--${message.role}`}>
              {message.role === "assistant" && (
                <img
                  className="ai-avatar"
                  src="/images/mascot/logo.png"
                  alt=""
                  width="36"
                  height="36"
                />
              )}
              <div className="ai-message-body">
                <span className="ai-speaker">{message.role === "user" ? "Bạn" : "Trợ lý AI"}</span>
                {message.image && (
                  <img className="ai-sent-image" src={message.image} alt="Ảnh CV đã gửi" />
                )}
                {message.imageMissing && (
                  <p className="ai-image-help">Ảnh CV không còn khả dụng.</p>
                )}
                {message.role === "user" ? (
                  <p>{message.text}</p>
                ) : (
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    skipHtml
                    components={{
                      img: () => null,
                      a: ({ href, children }) => (
                        <a
                          href={
                            /^(https?:\/\/|\/jobs\/[0-9a-f-]{36}$)/i.test(href || "")
                              ? href
                              : undefined
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.text}
                  </Markdown>
                )}
                {message.role === "assistant" && message.jobs?.length > 0 && (
                  <div className="ai-job-results" aria-label="Việc làm phù hợp trên JobTot">
                    {message.jobs
                      .filter((job) => /^[0-9a-f-]{36}$/i.test(job.id))
                      .map((job) => (
                        <article key={job.id} className="ai-job-result">
                          <h3>{job.title}</h3>
                          <p>
                            {job.companyName} · {job.location}
                          </p>
                          <Link to={`/jobs/${job.id}`}>Xem việc làm</Link>
                        </article>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {state.phase === "loading" && (
            <div className="ai-typing" role="status">
              <img
                className="ai-typing-avatar"
                src="/images/mascot/logo.png"
                alt=""
                width="32"
                height="32"
              />
              <span>
                Anh hùng bàn phím đang gõ lia lịa
                <span className="ai-dots" aria-hidden="true">
                  <i>.</i>
                  <i>.</i>
                  <i>.</i>
                </span>
              </span>
            </div>
          )}
          {state.phase === "cancelled" && <p role="status">Đã dừng trả lời.</p>}
          {state.phase === "error" && (
            <div role="alert" className="ai-chat-error">
              <p>{state.error.message}</p>
              {state.error.code === "ai_unauthenticated" && <Link to={login}>Đăng nhập lại</Link>}
            </div>
          )}
        </div>
        <form
          className="ai-composer"
          onSubmit={(event) => {
            event.preventDefault();
            submit(question);
          }}
          aria-busy={state.phase === "loading"}
        >
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png"
            aria-label="Chọn ảnh CV JPG hoặc PNG"
            onChange={selectImage}
            disabled={state.phase === "loading"}
            tabIndex={-1}
          />
          {image && (
            <div className="ai-image-preview">
              <img src={image.preview} alt="Ảnh CV chuẩn bị gửi" />
              <span>{image.name}</span>
              <Button
                type="button"
                variant="ghost"
                aria-label="Xóa ảnh CV"
                onClick={() => setImage(null)}
              >
                <X size={16} />
              </Button>
            </div>
          )}
          {readingImage && (
            <p role="status" className="ai-image-help">
              Đang đọc ảnh CV…
            </p>
          )}
          {imageError && (
            <p role="alert" className="ai-chat-error">
              {imageError}
            </p>
          )}
          <label className="sr-only" htmlFor="career-question">
            Nhắn tin cho Trợ lý AI
          </label>
          <textarea
            id="career-question"
            ref={input}
            value={question}
            onInput={(event) => setQuestion(event.target.value)}
            maxLength={2000}
            rows={2}
            placeholder="Nhắn tin cho Trợ lý AI…"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit(question);
              }
            }}
          />
          <div className="ai-composer-actions">
            <div className="ai-attachment-actions">
              <Button
                type="button"
                variant="ghost"
                disabled={state.phase === "loading" || readingImage}
                onClick={() => fileInput.current?.click()}
                aria-label="Đính kèm ảnh CV"
              >
                <ImagePlus size={20} />
                <span>Ảnh CV</span>
              </Button>
              <span className="ai-image-help">JPG/PNG · tối đa 5 MB</span>
            </div>
            <span>{question.length}/2000</span>
            {state.phase === "loading" ? (
              <Button type="button" variant="ghost" className="ai-send" onClick={cancel}>
                <X size={18} />
                Dừng
              </Button>
            ) : (
              <Button
                type="submit"
                variant="ghost"
                className="ai-send"
                disabled={
                  !!waitUntil || readingImage || historyLoading || (!question.trim() && !image)
                }
              >
                <Send size={18} />
                Gửi
              </Button>
            )}
          </div>
        </form>
        <p className="ai-chat-note">AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.</p>
        {image && (
          <p className="ai-chat-note">
            Ảnh ở lượt này sẽ được gửi tới Gemini để phân tích. Bạn có thể che thông tin liên hệ
            trước khi gửi.
          </p>
        )}
      </section>
    </div>
  );
}
