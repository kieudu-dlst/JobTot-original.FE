import { cn } from "@/shared/lib/utils";
import "./select.css";

/** Preserve native form submission, validation, keyboard and mobile picker behavior. */
export function Select({
  className,
  options,
  children,
  variant = "default",
  density = "comfortable",
  ...props
}) {
  return (
    <select
      {...props}
      data-ui="select"
      data-variant={variant}
      data-density={density}
      className={cn("ui-select", className)}
    >
      {options
        ? options.map(({ value, label, disabled }) => (
            <option key={value} value={value} disabled={disabled}>
              {label}
            </option>
          ))
        : children}
    </select>
  );
}
