import { NavLink, Link } from "react-router-dom";
import { BriefcaseBusiness } from "lucide-react";
import { JobsMenu } from "@/shared/ui/jobs-menu";
import { ToolsMenu } from "@/shared/ui/tools-menu";
import { cn } from "@/shared/lib/utils";
import { useState } from "react";
import { useCandidateSession } from "@/features/authenticate";

export function SiteHeader() {
  const { account, loading, error: sessionError, signOut } = useCandidateSession();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function logout() {
    setPending(true);
    setError("");
    try {
      await signOut();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-5">
        <Link to="/jobs" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="rounded-lg bg-emerald-700 p-2 text-white">
            <BriefcaseBusiness className="size-5" />
          </span>
          TalentHub<span className="text-emerald-600">.</span>
        </Link>
        <nav aria-label="Điều hướng chính" className="flex gap-6 text-sm font-medium">
          <JobsMenu />
          <ToolsMenu />
          {[
            ["/companies", "Doanh nghiệp"],
            ["/profile", "Hồ sơ cá nhân"],
          ].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "py-2 transition-colors hover:text-emerald-700",
                  isActive ? "text-emerald-700" : "text-muted-foreground",
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        {account ? (
          <div className="flex items-center gap-3 text-sm">
            <span>Xin chào, {account.fullName}</span>
            <button type="button" disabled={pending} onClick={logout}>
              {pending ? "Đang đăng xuất…" : "Đăng xuất"}
            </button>
          </div>
        ) : (
          !loading && <Link to="/login">Đăng nhập</Link>
        )}
        {(error || sessionError) && <p role="alert">{error || sessionError}</p>}
      </div>
    </header>
  );
}
