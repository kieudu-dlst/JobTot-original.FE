import { useEffect, useId, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import "./combobox.css";

function normalize(value) {
  return String(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLocaleLowerCase("vi")
    .trim();
}

/** Searchable single selection. Use Select for short lists without a search field. */
export function Combobox({
  id,
  label,
  ariaLabel = label,
  options,
  value = "",
  onChange,
  placeholder = "Chọn một lựa chọn",
  searchPlaceholder = "Tìm kiếm…",
  searchLabel = "Tìm lựa chọn",
  emptyMessage = "Không tìm thấy lựa chọn phù hợp.",
  disabled = false,
  className,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}) {
  const generatedId = useId();
  const triggerId = id || generatedId;
  const listId = `${triggerId}-options`;
  const input = useRef(null);
  const list = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(value);
  const selected = options.find((option) => option.value === value);
  // A non-filterable option can keep an "All" or "Clear" action visible during search.
  const visibleOptions = options.filter(
    (option) =>
      option.filterable === false ||
      normalize(option.searchText ?? option.label).includes(normalize(query)),
  );
  const enabledOptions = visibleOptions.filter((option) => !option.disabled);
  const activeOption =
    enabledOptions.find((option) => option.value === active) || enabledOptions[0];
  const activeIndex = visibleOptions.indexOf(activeOption);
  const noMatches = !visibleOptions.some((option) => option.filterable !== false);

  useEffect(() => {
    if (open && activeIndex >= 0)
      list.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, query]);

  function changeOpen(next) {
    setOpen(next);
    if (next) {
      setQuery("");
      setActive(value);
    }
  }

  function choose(option) {
    if (!option || option.disabled) return;
    setOpen(false);
    if (option.value !== value) onChange(option.value);
  }

  function search(next) {
    setQuery(next);
    const match = options.find(
      (option) =>
        !option.disabled &&
        option.filterable !== false &&
        normalize(option.searchText ?? option.label).includes(normalize(next)),
    );
    setActive(next.trim() ? match?.value : value);
  }

  function navigate(event) {
    if (event.nativeEvent.isComposing) return;
    const directions = { ArrowDown: 1, ArrowUp: -1 };
    if (event.key in directions || event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const current = enabledOptions.indexOf(activeOption);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? enabledOptions.length - 1
            : Math.max(0, Math.min(enabledOptions.length - 1, current + directions[event.key]));
      setActive(enabledOptions[next]?.value);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(activeOption);
    }
  }

  return (
    <div className={cn("ui-combobox", className)}>
      {label && (
        <label className="ui-combobox-label" htmlFor={triggerId}>
          {label}
        </label>
      )}
      <Popover.Root open={open && !disabled} onOpenChange={changeOpen}>
        <Popover.Trigger asChild>
          <button
            id={triggerId}
            type="button"
            className="ui-combobox-trigger"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          >
            <span>{selected?.label ?? placeholder}</span>
            <ChevronDown aria-hidden="true" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="ui-combobox-popover"
            aria-label={ariaLabel}
            sideOffset={7}
            align="start"
            collisionPadding={12}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              input.current?.focus();
            }}
          >
            <div className="ui-combobox-search">
              <Search aria-hidden="true" />
              <input
                ref={input}
                role="combobox"
                aria-label={searchLabel}
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
                placeholder={searchPlaceholder}
                autoComplete="off"
                value={query}
                onChange={(event) => search(event.target.value)}
                onKeyDown={navigate}
              />
            </div>
            <div
              ref={list}
              id={listId}
              className="ui-combobox-options"
              role="listbox"
              aria-label={ariaLabel}
            >
              {visibleOptions.map((option, index) => (
                <button
                  key={option.value}
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled || undefined}
                  disabled={option.disabled}
                  data-active={option === activeOption}
                  onMouseDown={(event) => event.preventDefault()}
                  onPointerMove={() => {
                    if (!option.disabled) setActive(option.value);
                  }}
                  onClick={() => choose(option)}
                >
                  <span>{option.label}</span>
                  {option.value === value && <Check aria-hidden="true" />}
                </button>
              ))}
            </div>
            {noMatches && (
              <p role="status" className="ui-combobox-empty">
                {emptyMessage}
              </p>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
