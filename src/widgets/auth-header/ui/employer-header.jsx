import { Link, useLocation } from "react-router-dom";
import { FileText, Megaphone, UsersRound } from "lucide-react";
import { AuthHeader } from "./auth-header";
import { employerArea } from "@/shared/lib/employer-navigation";

function Navigation() {
  const { pathname } = useLocation();
  const active = employerArea(pathname);
  return (
    <>
      <Link
        to="/employer/campaigns"
        aria-current={active === "campaigns" ? "page" : undefined}
        className="aria-[current=page]:text-auth-orange! aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
      >
        <Megaphone />
        Chiến dịch
      </Link>
      <Link
        to="/employer/discover"
        aria-current={active === "discover" ? "page" : undefined}
        className="aria-[current=page]:text-auth-orange! aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
      >
        <UsersRound />
        Tìm nhân tài
      </Link>
      <Link
        to="/employer/candidates"
        aria-current={active === "candidates" ? "page" : undefined}
        className="aria-[current=page]:text-auth-orange! aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
      >
        <FileText />
        Quản lý CV
      </Link>
    </>
  );
}
export function EmployerHeader({ userName, loading }) {
  return (
    <AuthHeader
      authRole="employer"
      userName={userName}
      loading={loading}
      accountHref="/employer/account"
      navigation={<Navigation />}
    />
  );
}
