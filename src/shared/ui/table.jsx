import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";
import "./table.css";

export function Table({ className, caption, children, ...props }) {
  return (
    <table {...props} data-ui="table" className={cn("ui-table", className)}>
      {caption && <caption className="ui-table-caption">{caption}</caption>}
      {children}
    </table>
  );
}

/** Contain wide tables and make the scroll area keyboard accessible when needed. */
export function TableScroll({ className, label = "Bảng dữ liệu", children, ...props }) {
  const root = useRef(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const measure = () => setOverflow(node.scrollWidth > node.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, [children]);
  return (
    <div className="ui-table-container">
      <div
        {...props}
        ref={root}
        className={cn("ui-table-scroll", className)}
        role="region"
        aria-label={label}
        tabIndex={overflow ? 0 : undefined}
      >
        {children}
      </div>
      {overflow && (
        <p className="ui-table-hint">Vuốt ngang hoặc dùng phím mũi tên để xem đầy đủ bảng</p>
      )}
    </div>
  );
}
