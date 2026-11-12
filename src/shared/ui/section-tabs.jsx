import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import "./section-tabs.css";

export function SectionTabs({ items, active, onChange, label, className = "" }) {
  const navRef = useRef(null);
  useEffect(() => {
    const nav = navRef.current;
    const selected = nav.querySelector('[aria-current="page"], [aria-pressed="true"]');
    if (!selected) return;
    const bounds = nav.getBoundingClientRect();
    const tab = selected.getBoundingClientRect();
    // Keep the selected tab visible on narrow screens without moving the page vertically.
    if (tab.left < bounds.left) nav.scrollLeft -= bounds.left - tab.left;
    else if (tab.right > bounds.right) nav.scrollLeft += tab.right - bounds.right;
  }, [active, items]);
  return (
    <nav ref={navRef} className={`section-tabs ${className}`} aria-label={label}>
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
