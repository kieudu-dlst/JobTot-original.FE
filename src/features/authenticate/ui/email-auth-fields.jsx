export function EmailAuthFields({ flow, pending, report }) {
  return (
    <>
      {flow.challenge && (
        <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 text-sm">
          <p className="mb-3">
            Mã xác thực đã gửi tới <strong>{flow.challenge.email}</strong>. Mã có hiệu lực 10 phút.
          </p>
          <label className="grid gap-2">
            Mã xác thực email
            <input
              className="rounded-md border bg-white p-2"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              value={flow.code}
              onChange={(event) => flow.setCode(event.target.value.replace(/\D/g, ""))}
              disabled={pending}
            />
          </label>
          <button
            type="button"
            className="mt-3 text-auth-orange"
            disabled={pending}
            onClick={async () => {
              try {
                await flow.resend();
                report("Đã gửi mã mới. Vui lòng kiểm tra email.");
              } catch (error) {
                report(error.message);
              }
            }}
          >
            Gửi lại mã (sau 60 giây)
          </button>
        </div>
      )}
      {flow.changeToken && (
        <div className="grid gap-3 rounded-lg border border-orange-100 bg-orange-50 p-4 text-sm">
          <p>Mật khẩu tạm đã được xác nhận. Đặt mật khẩu mới để hoàn tất đăng nhập.</p>
          <label className="grid gap-2">
            Mật khẩu mới
            <input
              className="rounded-md border bg-white p-2"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={flow.password}
              onChange={(event) => flow.setPassword(event.target.value)}
            />
          </label>
          <label className="grid gap-2">
            Xác nhận mật khẩu mới
            <input
              className="rounded-md border bg-white p-2"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={flow.confirmPassword}
              onChange={(event) => flow.setConfirmPassword(event.target.value)}
            />
          </label>
        </div>
      )}
    </>
  );
}
