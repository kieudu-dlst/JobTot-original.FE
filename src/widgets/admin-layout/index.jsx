import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Building2, Users, Layers3, ShieldCheck, LogOut, ArrowLeft, FileText } from "lucide-react";
import { BrandLogo } from "@/shared/ui/brand-logo";
import {
  adminAuth,
  adminRequest,
  readAdminSession,
  clearAdminSession,
} from "@/shared/api/admin-session";
import "./admin.css";
const sections = {
  companies: {
    label: "Công ty",
    title: "Quản lý công ty",
    description: "Kiểm duyệt thông tin và quản lý trạng thái các doanh nghiệp.",
    icon: Building2,
  },
  users: {
    label: "Người dùng",
    title: "Quản lý người dùng",
    description: "Quản lý tài khoản, quyền truy cập và mật khẩu người dùng.",
    icon: Users,
  },
  industries: {
    label: "Nhóm ngành",
    title: "Quản lý nhóm ngành",
    description: "Cập nhật danh mục ngành nghề dùng trên nền tảng.",
    icon: Layers3,
  },
};
export function AdminLayout({ children }) {
  const [session, setSession] = useState(readAdminSession);
  const [me, setMe] = useState(null);
  const [authError, setAuthError] = useState("");
  const [authAttempt, setAuthAttempt] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const account = await adminRequest("auth/me", { signal: controller.signal });
        if (!controller.signal.aborted) {
          setMe(account);
          setAuthError("");
        }
      } catch (failure) {
        if (controller.signal.aborted) return;
        if (failure.status === 401 || failure.status === 403) {
          clearAdminSession();
          setSession(null);
          setMe(null);
        } else setAuthError(failure.message);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [session, authAttempt]);
  function expired() {
    clearAdminSession();
    setSession(null);
    setMe(null);
    setAuthError("");
  }
  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await adminAuth.logout();
    } catch {
      /* Local admin credentials are cleared by adminAuth even when offline. */
    } finally {
      expired();
      setLoggingOut(false);
    }
  }
  if (!session)
    return (
      <AdminLogin
        onLogin={(value) => {
          setSession(value);
          setAuthError("");
        }}
      />
    );
  return (
    <div className="admin-app font-roboto">
      <title>Quản trị Job Tốt</title>
      <aside className="admin-sidebar">
        <BrandLogo />
        <span className="admin-sidebar-label">TRUNG TÂM QUẢN TRỊ</span>
        <nav aria-label="Quản trị">
          {Object.entries(sections).map(([key, item]) => (
            <NavLink
              key={key}
              to={`/admin/${key}`}
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
          <NavLink
            className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
            to="/admin/cv-templates"
          >
            <FileText />
            Mẫu CV
          </NavLink>
          <NavLink
            to="/admin/career-articles"
            className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
          >
            <FileText />
            Cẩm nang & Báo cáo
          </NavLink>
        </nav>
        <div className="admin-sidebar-bottom">
          <ShieldCheck />
          <p>
            Khu vực quản trị<span>Chỉ dành cho tài khoản admin</span>
          </p>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <span>
            <ShieldCheck />
            Hệ thống quản trị
          </span>
          <div>
            <span>{me?.fullName || session.fullName}</span>
            <button disabled={loggingOut} onClick={logout}>
              <LogOut />
              {loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
            </button>
          </div>
        </header>
        <main className="admin-main">
          {authError ? (
            <div className="admin-notice error" role="alert">
              {authError}
              <button onClick={() => setAuthAttempt((value) => value + 1)}>Thử lại</button>
            </div>
          ) : !me ? (
            <p role="status">Đang kiểm tra quyền quản trị…</p>
          ) : (
            children({ me, onExpired: expired })
          )}
        </main>
      </div>
    </div>
  );
}

function AdminLogin({ onLogin }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login(event) {
    event.preventDefault();
    if (busy) return;
    const input = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      onLogin(
        await adminAuth.login({
          emailOrPhone: input.get("identifier"),
          password: input.get("password"),
        }),
      );
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-login-page font-roboto">
      <title>Đăng nhập quản trị | Job Tốt</title>
      <BrandLogo />
      <form className="admin-login-card" onSubmit={login}>
        <span className="admin-login-icon">
          <ShieldCheck />
        </span>
        <span className="admin-eyebrow">JOB TỐT ADMIN</span>
        <h1>Đăng nhập quản trị</h1>
        <p>Quản lý doanh nghiệp, người dùng và danh mục ngành nghề.</p>
        <label>
          Email hoặc số điện thoại
          <input name="identifier" required maxLength={320} autoComplete="username" />
        </label>
        <label>
          Mật khẩu
          <input
            name="password"
            type="password"
            required
            maxLength={128}
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p className="admin-notice error" role="alert">
            {error}
          </p>
        )}
        <button className="admin-primary" disabled={busy}>
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
        <Link className="admin-login-back" to="/">
          <ArrowLeft />
          Về trang chủ
        </Link>
      </form>
    </main>
  );
}
