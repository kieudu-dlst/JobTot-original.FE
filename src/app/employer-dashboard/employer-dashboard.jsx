import { useState } from "react";
import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Megaphone,
  UsersRound,
  FileText,
  CalendarDays,
  MessageCircle,
  UserRound,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { Button } from "@/shared/ui/button";
import { AccountActions } from "@/widgets/auth-header";
import { useEmployerSession } from "@/features/authenticate";
import { EmployerDashboardContext } from "@/shared/lib/employer-dashboard-context";
import "./employer-dashboard.css";

const navigation = [
  ["/employer", "Tổng quan", LayoutDashboard],
  ["/employer/campaigns", "Chiến dịch tuyển dụng", Megaphone],
  ["/employer/candidates", "Hồ sơ ứng tuyển", FileText],
  ["/employer/discover", "Tìm nhân tài", UsersRound],
  ["/employer/talents", "Ứng viên đã lưu", UsersRound],
  ["/employer/interviews", "Lịch phỏng vấn", CalendarDays],
  ["/employer/messages", "Tin nhắn", MessageCircle],
];

export function EmployerDashboardLayout() {
  const { account, loading, error } = useEmployerSession();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  if (loading)
    return (
      <main className="ed-loading" role="status">
        Đang tải không gian tuyển dụng…
      </main>
    );
  if (!account)
    return error ? (
      <main role="alert">{error}</main>
    ) : (
      <Navigate to="/login?role=employer" replace />
    );
  const title =
    navigation.find(
      ([path]) => path === pathname || (path !== "/employer" && pathname.startsWith(path + "/")),
    )?.[1] ||
    {
      "/employer/assistant": "Trợ lý AI",
      "/employer/account": "Tài khoản",
      "/employer/company": "Thông tin doanh nghiệp",
    }[pathname] ||
    "Không gian tuyển dụng";
  return (
    <EmployerDashboardContext.Provider value={true}>
      <div
        className={`ed-shell font-roboto ${pathname === "/employer/assistant" ? "ed-shell--assistant" : ""}`}
      >
        {open && (
          <button
            className="ed-overlay"
            aria-label="Đóng điều hướng"
            onClick={() => setOpen(false)}
          />
        )}
        <aside className={`ed-sidebar ${open ? "ed-sidebar--open" : ""}`}>
          <div className="ed-brand">
            <BrandLogo />
            <button
              className="ed-mobile-toggle"
              aria-label="Đóng menu"
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
          </div>
          <span className="ed-caption">KHÔNG GIAN NHÀ TUYỂN DỤNG</span>
          <nav aria-label="Điều hướng nhà tuyển dụng">
            {navigation.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end={to === "/employer"} onClick={() => setOpen(false)}>
                <Icon size={19} />
                {label}
              </NavLink>
            ))}
            <NavLink className="ed-ai" to="/employer/assistant">
              <Sparkles size={19} />
              Trợ lý AI
            </NavLink>
          </nav>
          <nav className="ed-sidebar-bottom" aria-label="Tài khoản nhà tuyển dụng">
            <NavLink to="/employer/account" onClick={() => setOpen(false)}>
              <UserRound size={19} />
              Tài khoản
            </NavLink>
          </nav>
        </aside>
        <div className="ed-main">
          <header className="ed-topbar">
            <div className="ed-topbar-title">
              <button
                className="ed-mobile-toggle"
                aria-label="Mở menu"
                aria-expanded={open}
                onClick={() => setOpen(true)}
              >
                <Menu />
              </button>
              <div>
                <span>Nhà tuyển dụng</span>
                <h1>{title}</h1>
              </div>
            </div>
            <div className="ed-account">
              <NavLink className="ed-candidate-link" to="/" aria-label="Dành cho ứng viên">
                <UsersRound size={18} aria-hidden="true" />
                <span>Dành cho ứng viên</span>
              </NavLink>
              <AccountActions role="employer" userName={account.fullName} />
            </div>
          </header>
          <div className="ed-content">
            <Outlet />
          </div>
          <footer className="ed-footer">JobTốt · Không gian quản lý tuyển dụng</footer>
        </div>
      </div>
    </EmployerDashboardContext.Provider>
  );
}
