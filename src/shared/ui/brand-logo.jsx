import { Link } from "react-router-dom";
import { BriefcaseBusiness, Check } from "lucide-react";

export function BrandLogo({ footer = false }) {
  return (
    <Link
      to="/"
      className={`inline-flex shrink-0 items-center gap-2.5 no-underline max-[700px]:gap-[7px] ${footer ? "mb-3.5 text-white" : ""}`}
      aria-label="Job Tốt — Trang chủ"
    >
      <span className="relative grid size-10 place-items-center rounded-xl bg-auth-orange text-white shadow-[0_3px_6px_var(--color-auth-shadow-brand)] max-[700px]:size-9">
        <BriefcaseBusiness
          data-brand-icon="true"
          aria-hidden="true"
          className="size-[23px] fill-white stroke-white"
        />
        <Check
          data-brand-icon="true"
          aria-hidden="true"
          className="absolute top-[15px] left-3 size-[15px] fill-none stroke-auth-orange stroke-[3] max-[700px]:top-[13px] max-[700px]:left-2.5"
        />
      </span>
      <span>
        <span
          className={`flex items-baseline leading-[23px] tracking-[-0.7px] ${footer ? "text-xl font-bold" : "text-xl font-extrabold max-[700px]:text-lg max-[380px]:text-base"}`}
        >
          Job
          <span className={`text-auth-orange ${footer ? "" : "ml-[3px]"}`}>Tốt</span>
          {!footer && (
            <i className="ml-[5px] size-[7px] self-center rounded-full bg-auth-success-indicator" />
          )}
        </span>
        {!footer && (
          <span className="block text-xs leading-[13px] font-extrabold tracking-[1px] text-auth-text-secondary max-[1150px]:text-xs max-[700px]:text-xs max-[700px]:tracking-[0.7px] max-[380px]:hidden">
            SỰ NGHIỆP VỮNG BỀN
          </span>
        )}
      </span>
    </Link>
  );
}
