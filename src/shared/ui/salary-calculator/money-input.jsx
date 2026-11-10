import { useId } from "react";

const money = (value) => Math.round(value).toLocaleString("vi-VN");

export function MoneyInput({ label, value, onChange, hint, required = false }) {
  const hintId = useId();
  return (
    <label className="salary-field">
      {label}
      <span className="salary-money-input">
        <input
          type="text"
          inputMode="numeric"
          required={required}
          aria-label={label}
          aria-describedby={hint ? hintId : undefined}
          value={value === "" ? "" : money(Number(value))}
          onChange={(event) => {
            const text = event.target.value.replace(/[.,\s]/g, "");
            if (/^\d{0,10}$/.test(text)) onChange(text);
          }}
        />
        <span>VND</span>
      </span>
      {hint && <small id={hintId}>{hint}</small>}
    </label>
  );
}
