import { Link } from "react-router-dom";
import { FileText, Megaphone, Menu, UsersRound } from "lucide-react";
import { AuthHeader } from "./auth-header";

function Navigation({ active }) {
  return (
    <>
      <Link
        to="/employer/campaigns"
        aria-current={active === "campaigns" ? "page" : undefined}
        className="aria-[current=page]:text-auth-orange!"
      >
        <Megaphone />
        Chiến dịch
      </Link>
      <Link
        to="/employer/discover"
        aria-current={active === "discover" ? "page" : undefined}
        className="aria-[current=page]:text-auth-orange!"
      >
        <UsersRound />
        Tìm nhân tài
      </Link>
      <Link
        to="/employer/candidates"
        aria-current={active === "candidates" ? "page" : undefined}
        className="aria-[current=page]:text-auth-orange!"
      >
        <FileText />
        Quản lý CV
      </Link>
    </>
  );
}
export function EmployerHeader({ userName, loading, active }) {
  return (
    <AuthHeader
      authRole="employer"
      userName={userName}
      loading={loading}
      accountHref="/employer/account"
      navigation={<Navigation active={active} />}
      compactNavigation={
        <details className="relative">
          <summary
            aria-label="Menu nhà tuyển dụng"
            className="flex size-9 cursor-pointer list-none items-center justify-center rounded-lg border border-auth-border [&::-webkit-details-marker]:hidden"
          >
            <Menu className="size-4" />
          </summary>
          <nav
            aria-label="Điều hướng nhà tuyển dụng"
            className="absolute right-0 top-full z-50 mt-2 grid w-52 max-w-[calc(100vw-32px)] gap-4 rounded-xl border border-auth-border bg-white p-4 shadow-lg [&_a]:flex [&_a]:items-center [&_a]:gap-2 [&_button]:flex [&_button]:items-center [&_button]:gap-2 [&_svg]:size-4"
          >
            <Navigation active={active} />
          </nav>
        </details>
      }
    />
  );
}
