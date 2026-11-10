import { CareerResources } from "@/widgets/career-resources";
import { AuthHeader, EmployerHeader } from "@/widgets/auth-header";
import { AuthIntroduction } from "@/widgets/auth-introduction";
import { AuthFooter } from "@/widgets/auth-footer";
import { AuthPanel, useCandidateSession, useEmployerSession } from "@/features/authenticate";
import { Navigate, useLocation } from "react-router-dom";
import { authReturnPath } from "@/shared/lib/auth-return-path";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";

export function AuthPage({ mode = "register" }) {
  const { search } = useLocation();
  const candidate = useCandidateSession();
  const employer = useEmployerSession();
  const isEmployer = new URLSearchParams(search).get("role") === "employer";
  const { account, loading } = isEmployer ? employer : candidate;
  if (loading) return <div role="status">Đang kiểm tra phiên đăng nhập…</div>;
  if (account)
    return <Navigate to={isEmployer ? "/employer/account" : authReturnPath(search)} replace />;
  return (
    <div className="font-roboto bg-auth-surface-page text-sm leading-normal text-auth-ink [--primary:var(--color-auth-orange)] [--background:var(--color-auth-surface-page)] [--foreground:var(--color-auth-ink)] [--color-ring:var(--color-auth-brand-focus)] [--color-primary:var(--color-auth-orange)] [&_svg]:shrink-0 [&_button]:[-webkit-tap-highlight-color:transparent] [&_a]:[-webkit-tap-highlight-color:transparent] motion-reduce:[&_*]:transition-none! motion-reduce:[&_*]:animate-none! motion-reduce:[&_*::before]:transition-none! motion-reduce:[&_*::after]:transition-none! motion-reduce:[&_*::before]:animate-none! motion-reduce:[&_*::after]:animate-none!">
      <title>{mode === "register" ? "Đăng ký" : "Đăng nhập"} | Job Tốt</title>
      {isEmployer ? <EmployerHeader /> : <AuthHeader />}
      <main className="mx-auto max-w-[1284px] px-[34px] py-8 max-[950px]:px-6 max-[950px]:py-7 max-[700px]:px-4 max-[700px]:pt-6 max-[700px]:pb-8">
        <PageBreadcrumb current={mode === "register" ? "Đăng ký" : "Đăng nhập"} />
        <div className="grid grid-cols-2 items-start gap-12 max-[1150px]:gap-7 max-[950px]:gap-6 max-[700px]:grid-cols-1 max-[700px]:gap-7">
          <AuthIntroduction />
          <AuthPanel mode={mode} />
        </div>
        <CareerResources />
      </main>
      <AuthFooter />
    </div>
  );
}
