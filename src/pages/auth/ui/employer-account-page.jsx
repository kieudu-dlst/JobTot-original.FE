import { Navigate, Link } from "react-router-dom";
import { useState } from "react";
import { useEmployerSession } from "@/features/authenticate";
import { EmployerHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerResources } from "@/widgets/career-resources";
import { Button } from "@/shared/ui/button";

export function EmployerAccountPage() {
  const { account, loading, error, signOut } = useEmployerSession();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  if (loading) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (!account && !error) return <Navigate to="/login?role=employer" replace />;
  return (
    <div className="min-h-screen bg-auth-surface-page font-roboto text-auth-ink">
      <title>Tài khoản Nhà tuyển dụng | Job Tốt</title>
      <EmployerHeader userName={account?.fullName} />
      <main className="mx-auto max-w-[1284px] px-4 py-8 sm:px-8">
        {account ? (
          <section className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 sm:p-8">
            <h1 className="text-2xl font-bold">Xin chào, {account.fullName}</h1>
            <p className="mt-2 text-auth-muted">Thông tin tài khoản nhà tuyển dụng</p>
            <Link
              to="/employer/company"
              className="mt-4 inline-block font-medium text-auth-orange underline"
            >
              Quản lý hồ sơ doanh nghiệp
            </Link>
            <dl className="my-6 grid gap-4 text-sm">
              {[
                ["Doanh nghiệp", account.companyName],
                ["Mã số thuế", account.taxCode],
                ["Email công việc", account.email],
                ["Số điện thoại công việc", account.phone],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-auth-muted">{label}</dt>
                  <dd className="mt-1 break-words font-medium">{value || "Chưa cập nhật"}</dd>
                </div>
              ))}
            </dl>
            {account.verificationStatus === "Verified" ? (
              <p className="rounded-lg bg-auth-success-surface p-3 text-sm text-auth-success-badge">
                Doanh nghiệp đã được xác minh.
              </p>
            ) : (
              <div className="rounded-xl bg-auth-warning-surface p-4 text-sm text-auth-warning-text">
                <h2 className="font-semibold">Hoàn thiện hồ sơ doanh nghiệp để được xác minh</h2>
                <p className="mt-2 leading-relaxed">
                  Vui lòng cập nhật đầy đủ thông tin doanh nghiệp, địa chỉ trụ sở, ngành nghề, giới
                  thiệu và thông tin liên hệ để quản trị viên có cơ sở kiểm tra, xác minh doanh
                  nghiệp của bạn.
                </p>
                <Link
                  to="/employer/company"
                  className="mt-3 inline-block font-semibold text-auth-orange underline underline-offset-4"
                >
                  Hoàn thiện hồ sơ doanh nghiệp →
                </Link>
                <p className="mt-2 text-xs">
                  Chọn “Áp dụng” sau khi chỉnh sửa mỗi mục để lưu thông tin trước khi quản trị viên
                  kiểm tra.
                </p>
              </div>
            )}
            <Button
              disabled={pending}
              className="mt-6 bg-auth-orange text-white hover:bg-auth-brand-hover"
              onClick={async () => {
                setPending(true);
                try {
                  await signOut();
                } catch {
                  setMessage(
                    "Đã đăng xuất trên thiết bị này; không thể kết nối máy chủ để kết thúc phiên từ xa.",
                  );
                } finally {
                  setPending(false);
                }
              }}
            >
              {pending ? "Đang đăng xuất…" : "Đăng xuất"}
            </Button>
          </section>
        ) : (
          <p role="alert">
            {error}{" "}
            <Link to="/login?role=employer" className="underline">
              Quay lại đăng nhập
            </Link>
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <CareerResources />
      </main>
      <AuthFooter />
    </div>
  );
}
