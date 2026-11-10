import { formatDate } from "@/shared/lib/date-format";
import { candidateFetch } from "@/shared/api/candidate-session";
import { employerFetch } from "@/shared/api/employer-session";
import { useContext, useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DropdownMenu } from "radix-ui";
import { mediaUrl } from "@/shared/lib/media-url";
import {
  UserRound,
  Bell,
  MessageCircle,
  Eye,
  CalendarDays,
  ArrowRight,
  ChevronDown,
  BriefcaseBusiness,
  Building,
  LogOut,
  FileText,
} from "lucide-react";
import { useCandidateSession, useEmployerSession } from "@/features/authenticate";
import { HeaderDataContext } from "../model/header-data-context";
import "./account-actions.css";

function ago(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
  return formatDate(value);
}

export function AccountActions({ role, userName, mode = "all" }) {
  const candidate = useCandidateSession();
  const employer = useEmployerSession();
  const session = role === "employer" ? employer : candidate;
  const account = session.account;
  return (
    <AccountActionsContent
      key={`${role}:${account?.id || userName}`}
      role={role}
      accountId={account?.id}
      accountAvatar={account?.avatarUrl}
      accountEmail={account?.email}
      signOut={session.signOut}
      userName={userName}
      mode={mode}
    />
  );
}

function AccountActionsContent({ role, accountAvatar, accountEmail, signOut, userName, mode }) {
  const notificationsId = useId();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [seen, setSeen] = useState({});
  const [readError, setReadError] = useState("");
  const { data, error, retry } = useContext(HeaderDataContext)[role];
  const avatarUrl = mediaUrl(
    role === "employer"
      ? data?.companyLogoUrl
      : accountAvatar !== undefined
        ? accountAvatar
        : data?.avatarUrl,
  );
  const [open, setOpen] = useState(false);
  const [brokenAvatar, setBrokenAvatar] = useState(null);
  const root = useRef(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const notices = data?.notifications || [];
  const unread = notices.filter((item) => !item.isRead && !seen[item.id]).length;
  const messages =
    data?.unreadConversationCount ??
    new Set((data?.messages || []).map((item) => item.conversationId)).size;
  async function mark(ids) {
    try {
      const response = await (role === "employer" ? employerFetch : candidateFetch)("header/read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error("Không thể đánh dấu đã đọc. Vui lòng thử lại.");
      setSeen((current) => ({ ...current, ...Object.fromEntries(ids.map((id) => [id, true])) }));
      setReadError("");
      retry();
    } catch (failure) {
      setReadError(failure.message);
    }
  }
  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    // SessionProvider clears local credentials even if the logout endpoint is unavailable.
    try {
      await signOut();
    } catch {
      /* Local logout is complete; return to the login screen. */
    } finally {
      navigate(role === "employer" ? "/login?role=employer" : "/login", { replace: true });
    }
  }
  const avatar = (
    <span className="header-user-avatar">
      {avatarUrl && brokenAvatar !== avatarUrl ? (
        <img
          key={avatarUrl}
          src={avatarUrl}
          alt={role === "employer" ? "Logo doanh nghiệp" : `Avatar của ${userName}`}
          onError={() => setBrokenAvatar(avatarUrl)}
        />
      ) : role === "employer" ? (
        <Building />
      ) : (
        <UserRound />
      )}
    </span>
  );
  return (
    <div className="header-account-actions" ref={root}>
      {mode !== "account" && (
        <>
          <button
            type="button"
            className="header-action-icon"
            aria-label="Thông báo"
            aria-expanded={open}
            aria-controls={open ? notificationsId : undefined}
            onClick={() => {
              setAccountOpen(false);
              if (!open) retry();
              setOpen((value) => !value);
            }}
          >
            <Bell />
            {unread > 0 && (
              <span className="header-action-count">{unread > 99 ? "99+" : unread}</span>
            )}
          </button>
          <Link
            className="header-action-icon"
            aria-label="Tin nhắn"
            to={role === "employer" ? "/employer/messages" : "/messages"}
          >
            <MessageCircle />
            {messages > 0 && (
              <span className="header-action-count">{messages > 99 ? "99+" : messages}</span>
            )}
          </Link>
        </>
      )}
      {mode !== "icons" && (
        <DropdownMenu.Root
          open={accountOpen}
          onOpenChange={(value) => {
            setAccountOpen(value);
            if (value) setOpen(false);
          }}
        >
          <DropdownMenu.Trigger
            className="header-account-link header-account-trigger"
            aria-label={`Tài khoản của ${userName}`}
          >
            {avatar}
            <span className="header-user-name">{userName}</span>
            <ChevronDown className="header-account-chevron" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="header-account-menu font-roboto"
              align="end"
              sideOffset={10}
              collisionPadding={12}
              aria-label="Menu tài khoản"
            >
              <div className="header-account-summary">
                <span className="header-account-summary-avatar">{avatar}</span>
                <div className="header-account-summary-info">
                  <strong>{userName}</strong>
                  {accountEmail && <span className="header-account-email">{accountEmail}</span>}
                  <span className="header-account-role">
                    {role === "employer" ? "Nhà tuyển dụng" : "Ứng viên"}
                  </span>
                </div>
              </div>
              <DropdownMenu.Separator className="header-account-separator" />
              {role === "employer" ? (
                <DropdownMenu.Item asChild>
                  <Link to="/employer/company" className="header-account-menu-item">
                    <Building />
                    Hồ sơ doanh nghiệp
                  </Link>
                </DropdownMenu.Item>
              ) : (
                <>
                  <DropdownMenu.Item asChild>
                    <Link to="/profile" className="header-account-menu-item">
                      <UserRound />
                      Hồ sơ cá nhân
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link to="/my-cvs" className="header-account-menu-item">
                      <FileText />
                      CV của tôi
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link to="/my-jobs" className="header-account-menu-item">
                      <BriefcaseBusiness />
                      Việc làm của tôi
                    </Link>
                  </DropdownMenu.Item>
                </>
              )}
              <DropdownMenu.Separator className="header-account-separator" />
              <DropdownMenu.Item
                className="header-account-menu-item header-account-logout"
                disabled={loggingOut}
                onSelect={logout}
              >
                <LogOut />
                {loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
      {open && (
        <section
          id={notificationsId}
          className="header-notifications"
          aria-label="Danh sách thông báo"
        >
          <div className="header-notifications-heading">
            <h2>Thông báo</h2>
            <button
              type="button"
              disabled={!unread}
              onClick={() => mark(notices.map((item) => item.id))}
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>
          <div className="header-notifications-list">
            {readError && (
              <p role="alert" className="header-notifications-empty">
                {readError}
              </p>
            )}
            {error ? (
              <div className="header-notifications-empty" role="alert">
                {error}
                <button onClick={() => retry()}>Thử lại</button>
              </div>
            ) : !data ? (
              <p className="header-notifications-empty" role="status">
                Đang tải thông báo…
              </p>
            ) : !notices.length ? (
              <p className="header-notifications-empty">Bạn chưa có thông báo mới.</p>
            ) : (
              notices.map((item) => {
                const Icon =
                  item.kind === "interview"
                    ? CalendarDays
                    : item.kind === "application"
                      ? FileText
                      : Eye;
                return (
                  <Link
                    key={item.id}
                    className={`header-notice ${item.isRead || seen[item.id] ? "is-read" : ""}`}
                    to={item.href}
                    onClick={() => {
                      mark([item.id]);
                      setOpen(false);
                    }}
                  >
                    <span className={`header-notice-icon ${item.kind}`}>
                      <Icon />
                    </span>
                    <span className="header-notice-content">
                      <span className="header-notice-top">
                        <strong>{item.title}</strong>
                        <time dateTime={item.at}>{ago(item.at)}</time>
                      </span>
                      <span className="header-notice-description">{item.text}</span>
                    </span>
                    {!item.isRead && !seen[item.id] && <span className="header-notice-dot" />}
                  </Link>
                );
              })
            )}
          </div>
          <Link
            className="header-notifications-all"
            to={role === "employer" ? "/employer/interviews" : "/my-jobs"}
            onClick={() => setOpen(false)}
          >
            Xem hoạt động tuyển dụng <ArrowRight />
          </Link>
        </section>
      )}
    </div>
  );
}
