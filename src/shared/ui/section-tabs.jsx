import { Link } from "react-router-dom";
import "./section-tabs.css";

export function SectionTabs({ items, active, onChange, label, className = "" }) {
  return (
    <nav className={`section-tabs ${className}`} aria-label={label}>
      {items.map(({ value, label: title, icon: Icon, to, count }) => {
        const content = (
          <>
            {Icon && <Icon />}
            <span className="section-tab-label">{title}</span>
            {count !== undefined && <span className="section-tab-count">{count}</span>}
          </>
        );
        return to ? (
          <Link
            key={value}
            to={to}
            className="section-tab"
            aria-current={active === value ? "page" : undefined}
          >
            {content}
          </Link>
        ) : (
          <button
            key={value}
            type="button"
            className="section-tab"
            aria-pressed={active === value}
            onClick={() => onChange(value)}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
