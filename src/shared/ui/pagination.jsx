import { Fragment } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./pagination.css";

/** The caller owns routing, data loading and scroll behavior. */
export function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  disabled = false,
  compact = false,
  info,
  className = "",
  "aria-label": ariaLabel = "Phân trang",
}) {
  const lastPage = Math.max(1, Math.trunc(Number(totalPages)) || 1);
  const currentPage = Math.max(1, Math.min(lastPage, Math.trunc(Number(page)) || 1));
  const pages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, lastPage])]
    .filter((value) => value >= 1 && value <= lastPage)
    .sort((a, b) => a - b);

  function changePage(value) {
    if (!disabled && value !== currentPage && value >= 1 && value <= lastPage) {
      onPageChange?.(value);
    }
  }

  return (
    <nav
      className={`ui-pagination${compact ? " ui-pagination--compact" : ""}${info ? " ui-pagination--with-info" : ""} ${className}`.trim()}
      aria-label={ariaLabel}
      aria-busy={disabled || undefined}
    >
      {info && <span className="ui-pagination__info">{info}</span>}
      <div className="ui-pagination__controls">
        <button
          type="button"
          className="ui-pagination__button ui-pagination__arrow"
          aria-label="Trang trước"
          disabled={disabled || currentPage <= 1}
          onClick={() => changePage(currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <div className="ui-pagination__numbers">
          {pages.map((value, index) => (
            <Fragment key={value}>
              {index > 0 && value - pages[index - 1] > 1 && (
                <span className="ui-pagination__ellipsis" aria-hidden="true">
                  …
                </span>
              )}
              <button
                type="button"
                className="ui-pagination__button"
                aria-label={`Trang ${value}`}
                aria-current={value === currentPage ? "page" : undefined}
                disabled={disabled}
                onClick={() => changePage(value)}
              >
                {value}
              </button>
            </Fragment>
          ))}
        </div>
        <span className="ui-pagination__position">
          Trang <strong>{currentPage}</strong> / {lastPage}
        </span>
        <button
          type="button"
          className="ui-pagination__button ui-pagination__arrow"
          aria-label="Trang sau"
          disabled={disabled || currentPage >= lastPage}
          onClick={() => changePage(currentPage + 1)}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
