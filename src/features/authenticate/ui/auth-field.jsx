import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function AuthField({
  name,
  label,
  icon: Icon,
  password = false,
  error,
  trailing,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div className={`flex min-h-4 items-center justify-between gap-2 mb-1`}>
        <Label htmlFor={name} className={`gap-[3px] text-auth-muted normal-case text-base`}>
          {label} <span className="text-auth-orange">*</span>
        </Label>
        {trailing}
      </div>
      <div className="relative">
        <Icon
          className={`pointer-events-none absolute left-[13px] size-[19px] text-auth-text-icon top-[13px]`}
          aria-hidden="true"
        />
        <Input
          id={name}
          name={name}
          type={password && !visible ? "password" : "text"}
          className={`px-[38px] py-2.5 text-sm text-auth-text-input shadow-[inset_0_1px_2px_var(--color-auth-shadow-inset)] h-[43px] rounded-lg border border-input bg-auth-surface-input pl-11 placeholder:text-auth-text-placeholder dark:bg-auth-surface-input ${name === "confirmPassword" ? "pr-[33px]" : ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          {...props}
        />
        {password && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-[5px] h-9 w-[34px] text-auth-text-icon [&_svg]:size-[18px]"
            aria-label={visible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </Button>
        )}
      </div>
      {error && (
        <p className="mt-[5px] text-xs text-auth-error" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
