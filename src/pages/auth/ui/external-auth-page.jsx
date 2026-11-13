import { AuthHeader, EmployerHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { ExternalAuthPanel } from "@/features/authenticate";
import { useSearchParams } from "react-router-dom";

export function ExternalAuthPage() {
  const [params] = useSearchParams();
  const employer = params.get("role") === "employer";
  return (
    <div className="min-h-screen bg-auth-surface-page font-roboto text-auth-ink">
      <title>Hoàn tất xác thực | Job Tốt</title>
      {employer ? <EmployerHeader /> : <AuthHeader />}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <ExternalAuthPanel key={`${params.get("role")}-${params.get("flow")}`} />
      </main>
      <AuthFooter />
    </div>
  );
}
