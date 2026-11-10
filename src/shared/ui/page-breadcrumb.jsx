import "./page-breadcrumb.css";
import { Link } from "react-router-dom";
import { ChevronRight, House } from "lucide-react";

export function PageBreadcrumb({
  current,
  parents = [],
  root = { to: "/", label: "Trang chủ" },
  children,
}) {
  return (
    <div className="page-breadcrumb profile-breadcrumb">
      <nav
        aria-label="Đường dẫn"
        className="flex items-center gap-2 text-[13px] text-auth-text-secondary"
      >
        {root && (
          <Link
            to={root.to}
            aria-label={root.label}
            className="breadcrumb-home inline-flex items-center gap-1.5"
          >
            <House className="size-3.5" aria-hidden="true" />
            <span>{root.label}</span>
          </Link>
        )}
        {parents.map((item, index) => (
          <span key={item.to} className="inline-flex items-center gap-2">
            {(root || index > 0) && <ChevronRight className="size-3.5" />}
            <Link to={item.to}>{item.label}</Link>
          </span>
        ))}
        {(root || parents.length > 0) && <ChevronRight className="size-3.5" />}
        <strong aria-current="page" className="font-semibold text-auth-ink">
          {current}
        </strong>
      </nav>
      {children}
    </div>
  );
}
