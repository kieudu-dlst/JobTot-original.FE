import { Link, useSearchParams } from "react-router-dom";
import { UserRound, BriefcaseBusiness } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { EmployerCredentialsForm } from "./employer-credentials-form";
import { CredentialsForm } from "./credentials-form";

export function AuthPanel({ mode }) {
  const [params, setParams] = useSearchParams();
  const role = params.get("role") === "employer" ? "employer" : "candidate";
  const tabParams = new URLSearchParams(params);
  if (role !== "employer") tabParams.delete("role");
  const tabSearch = tabParams.size ? `?${tabParams}` : "";
  return (
    <Card className="gap-0 rounded-2xl border bg-white p-[39px] shadow-none max-[1150px]:p-7 max-[950px]:px-5 max-[950px]:py-6 max-[700px]:row-start-1 max-[700px]:p-6 max-[380px]:px-4 max-[380px]:py-5">
      <Tabs
        className="gap-0"
        value={role}
        onValueChange={(value) => {
          const next = new URLSearchParams(params);
          if (value === "employer") next.set("role", value);
          else next.delete("role");
          setParams(next, { replace: true });
        }}
      >
        <TabsList
          className="h-[52px]! w-full rounded-xl bg-auth-surface-tabs p-1.5"
          aria-label="Loại tài khoản"
        >
          <TabsTrigger
            className="h-10 gap-2 rounded-[10px] text-base font-bold text-auth-text-tab data-[state=active]:bg-white! data-[state=active]:text-auth-text-selected data-[state=active]:shadow-[0_1px_3px_var(--color-auth-shadow-soft)] data-[state=active]:[&_svg]:text-auth-orange max-[950px]:gap-1 max-[950px]:text-xs max-[700px]:text-xs"
            value="candidate"
          >
            <UserRound />
            Ứng viên tìm việc
          </TabsTrigger>
          <TabsTrigger
            className="h-10 gap-2 rounded-[10px] text-base font-bold text-auth-text-tab data-[state=active]:bg-white! data-[state=active]:text-auth-text-selected data-[state=active]:shadow-[0_1px_3px_var(--color-auth-shadow-soft)] data-[state=active]:[&_svg]:text-auth-orange max-[950px]:gap-1 max-[950px]:text-xs max-[700px]:text-xs"
            value="employer"
          >
            <BriefcaseBusiness />
            Nhà tuyển dụng
          </TabsTrigger>
        </TabsList>
        <div className="mt-[22px] flex items-center justify-between gap-2.5">
          <nav className="flex gap-6 max-[950px]:gap-4" aria-label="Hình thức xác thực">
            <Link
              className="relative pb-2.5 text-base font-bold text-auth-text-nav aria-[current=page]:text-auth-ink aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-[3px] aria-[current=page]:after:rounded-lg aria-[current=page]:after:bg-auth-orange aria-[current=page]:after:content-[''] max-[950px]:text-sm max-[700px]:text-base"
              to={`/login${tabSearch}`}
              aria-current={mode === "login" ? "page" : undefined}
            >
              Đăng nhập
            </Link>
            <Link
              className="relative pb-2.5 text-base font-bold text-auth-text-nav aria-[current=page]:text-auth-ink aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-[3px] aria-[current=page]:after:rounded-lg aria-[current=page]:after:bg-auth-orange aria-[current=page]:after:content-[''] max-[950px]:text-sm max-[700px]:text-base"
              to={`/register${tabSearch}`}
              aria-current={mode === "register" ? "page" : undefined}
            >
              Đăng ký mới
            </Link>
          </nav>
          <span className="mb-[5px] whitespace-nowrap rounded-[20px] bg-auth-success-surface px-[9px] py-[3px] text-xs font-bold text-auth-success-badge max-[950px]:px-[5px] max-[950px]:text-xs">
            ● Miễn phí 100%
          </span>
        </div>
        <div className="mt-3.5 flex items-center gap-3 whitespace-nowrap text-base leading-[18px] text-auth-text-divider before:h-px before:flex-1 before:bg-auth-border before:content-[''] after:h-px after:flex-1 after:bg-auth-border after:content-[''] max-[700px]:gap-2 max-[700px]:text-xs">
          <span>
            {mode === "register" ? "đăng ký" : "đăng nhập"} bằng{" "}
            {role === "employer" ? "Email công việc" : "Email / Số điện thoại"}
          </span>
        </div>
        {["candidate", "employer"].map((value) => (
          <TabsContent key={value} value={value}>
            {value === "employer" ? (
              <EmployerCredentialsForm key={mode} mode={mode} />
            ) : (
              <CredentialsForm key={mode} mode={mode} role={value} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
