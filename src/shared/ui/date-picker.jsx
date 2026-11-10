import { Select } from "@/shared/ui/select";
import { useId, useState } from "react";
import { Popover } from "radix-ui";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import "./date-picker.css";

const isoDay = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
function display(value) {
  if (!value) return "";
  const [day, time] = value.split("T");
  return `${day.split("-").reverse().join("/")}${time ? ` ${time.slice(0, 5)}` : ""}`;
}
function parse(text, datetime) {
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (match && datetime && !match[4]) return null;
  const value = match
    ? `${match[3]}-${match[2]}-${match[1]}${datetime ? `T${match[4] || "00"}:${match[5] || "00"}` : ""}`
    : text;
  if (
    !new RegExp(datetime ? "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$" : "^\\d{4}-\\d{2}-\\d{2}$").test(
      value,
    )
  )
    return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime()) || isoDay(date) !== value.slice(0, 10)) return null;
  if (datetime && (Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59))
    return null;
  return value;
}

export function DatePicker({
  type = "date",
  value: rawValue = "",
  onChange,
  min,
  max,
  disabled,
  required,
  name,
  id,
  className = "",
  ...props
}) {
  const value = rawValue || "";
  const generatedId = useId();
  const datetime = type === "datetime-local";
  const [open, setOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState(undefined);
  const [draft, setDraft] = useState(null);
  const [month, setMonth] = useState(() =>
    value
      ? new Date(`${value.slice(0, 7)}-01T00:00:00`)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const currentMonth = Number.isNaN(month.getTime()) ? new Date() : month;
  const inputId = id || generatedId;
  const allowed = (next) => (!min || next >= min) && (!max || next <= max);
  function commit(next) {
    if (next && !allowed(next)) return;
    setDraft(null);
    document.getElementById(inputId)?.setCustomValidity("");
    onChange?.({ target: { value: next, name, type }, currentTarget: { value: next, name, type } });
  }
  const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const time = value.split("T")[1]?.slice(0, 5) || "09:00";
  const { maxLength: _maxLength, step: _step, placeholder: _placeholder, ...inputProps } = props;
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setPortalContainer(document.getElementById(inputId)?.closest("dialog") || undefined);
        setOpen(next);
        if (next && value) setMonth(new Date(`${value.slice(0, 7)}-01T00:00:00`));
      }}
    >
      <span className={`date-picker ${className}`}>
        <input
          {...inputProps}
          id={inputId}
          name={name}
          type="text"
          disabled={disabled}
          required={required}
          autoComplete="off"
          placeholder={datetime ? "dd/mm/yyyy hh:mm" : "dd/mm/yyyy"}
          value={draft ?? display(value)}
          onChange={(event) => {
            const text = event.target.value;
            setDraft(text);
            const next = text ? parse(text, datetime) : "";
            event.target.setCustomValidity(
              next === null || (next && !allowed(next))
                ? "Vui lòng nhập ngày hợp lệ theo dd/mm/yyyy."
                : "",
            );
            if (next !== null && (!next || allowed(next)))
              onChange?.({ ...event, target: { ...event.target, value: next, name, type } });
          }}
          onBlur={() => {
            if (draft !== null && (!draft || parse(draft, datetime))) setDraft(null);
          }}
        />
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label={`Chọn ${datetime ? "ngày và giờ" : "ngày"}: ${props["aria-label"] || name || "ngày"}`}
          >
            <CalendarDays />
          </button>
        </Popover.Trigger>
      </span>
      <Popover.Portal container={portalContainer}>
        <Popover.Content
          className="date-picker-panel font-roboto"
          sideOffset={7}
          collisionPadding={12}
          aria-label="Chọn ngày"
        >
          <div className="date-picker-heading">
            <button
              type="button"
              aria-label="Tháng trước"
              onClick={() => setMonth(new Date(first.getFullYear(), first.getMonth() - 1, 1))}
            >
              <ChevronLeft />
            </button>
            <Select
              density="compact"
              aria-label="Tháng"
              value={first.getMonth()}
              onChange={(event) =>
                setMonth(new Date(first.getFullYear(), Number(event.target.value), 1))
              }
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index} value={index}>
                  Tháng {index + 1}
                </option>
              ))}
            </Select>
            <Select
              density="compact"
              aria-label="Năm"
              value={first.getFullYear()}
              onChange={(event) =>
                setMonth(new Date(Number(event.target.value), first.getMonth(), 1))
              }
            >
              {Array.from({ length: 151 }, (_, index) => 1900 + index).map((year) => (
                <option key={year}>{year}</option>
              ))}
            </Select>
            <button
              type="button"
              aria-label="Tháng sau"
              onClick={() => setMonth(new Date(first.getFullYear(), first.getMonth() + 1, 1))}
            >
              <ChevronRight />
            </button>
          </div>
          <div className="date-picker-grid">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
              <span key={day}>{day}</span>
            ))}
            {Array.from({ length: offset }, (_, index) => (
              <span key={`empty-${index}`} />
            ))}
            {Array.from({ length: days }, (_, index) => {
              const day = isoDay(new Date(first.getFullYear(), first.getMonth(), index + 1));
              const next = datetime ? `${day}T${time}` : day;
              return (
                <button
                  type="button"
                  key={day}
                  aria-label={display(day)}
                  aria-pressed={value.slice(0, 10) === day}
                  disabled={!allowed(next)}
                  onClick={() => {
                    commit(next);
                    if (!datetime) setOpen(false);
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          {datetime && (
            <label className="date-picker-time">
              Thời gian
              <input
                type="time"
                aria-label="Giờ"
                value={time}
                onChange={(event) => {
                  if (event.target.value)
                    commit(`${value.slice(0, 10) || isoDay(new Date())}T${event.target.value}`);
                }}
              />
            </label>
          )}
          <div className="date-picker-footer">
            <button
              type="button"
              onClick={() => {
                commit(datetime ? `${isoDay(new Date())}T${time}` : isoDay(new Date()));
                setOpen(false);
              }}
            >
              Hôm nay
            </button>
            {!required && (
              <button
                type="button"
                onClick={() => {
                  commit("");
                  setOpen(false);
                }}
              >
                Xóa
              </button>
            )}
            <Popover.Close asChild>
              <button type="button">Xong</button>
            </Popover.Close>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function FormInput({ type = "text", ...props }) {
  return type === "date" || type === "datetime-local" ? (
    <DatePicker type={type} {...props} />
  ) : (
    <input type={type} {...props} />
  );
}
