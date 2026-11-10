import { CareerResources } from "@/widgets/career-resources";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  candidateAuth,
  useCandidateSession,
  employerAuth,
  useEmployerSession,
} from "@/features/authenticate";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";

export function ResetPasswordPage() {
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
  );
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const candidate = useCandidateSession();
  const employer = useEmployerSession();
  const isEmployer = new URLSearchParams(window.location.search).get("role") === "employer";
  const { signIn } = isEmployer ? employer : candidate;
  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    if (password !== confirmation) {
      setMessage("Mật khẩu xác nhận không khớp.");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      await (isEmployer ? employerAuth : candidateAuth).resetPassword({
        token,
        password,
        confirmPassword: confirmation,
      });
      signIn(null);
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (isEmployer ? "?role=employer" : ""),
      );
      setComplete(true);
      setPassword("");
      setConfirmation("");
    } catch (failure) {
      setMessage(Object.values(failure.fields || {}).join(" ") || failure.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="font-roboto">
      <AuthHeader />
      <main className="mx-auto max-w-[1284px] px-6 py-16 font-roboto">
        <div className="mx-auto max-w-md">
          <PageBreadcrumb current="Đặt lại mật khẩu" />
          <title>Đặt lại mật khẩu | Job Tốt</title>
          <h1 className="mb-4 text-2xl font-bold">Đặt lại mật khẩu</h1>
          {complete ? (
            <p role="status">Mật khẩu đã được cập nhật. Vui lòng đăng nhập bằng mật khẩu mới.</p>
          ) : !token ? (
            <p role="alert">
              Liên kết khôi phục không hợp lệ. Vui lòng gửi yêu cầu mới từ trang đăng nhập.
            </p>
          ) : (
            <form className="grid gap-4" onSubmit={submit}>
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Label htmlFor="confirm-new-password">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirm-new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
              <Button type="submit" disabled={pending}>
                {pending ? "Đang xử lý…" : "Cập nhật mật khẩu"}
              </Button>
              {message && <p role="alert">{message}</p>}
            </form>
          )}
          <Link
            to={isEmployer ? "/login?role=employer" : "/login"}
            className="mt-6 inline-block text-orange-600 underline"
          >
            Quay lại đăng nhập
          </Link>
        </div>
        <CareerResources />
      </main>
      <AuthFooter />
    </div>
  );
}
