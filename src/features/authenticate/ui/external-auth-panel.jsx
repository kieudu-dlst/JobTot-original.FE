import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import { externalAuth } from "../api/external-auth";
import { useCandidateSession } from "../model/session-context";
import { useEmployerSession } from "../model/employer-session-context";
import { CredentialsForm } from "./credentials-form";
import { EmployerCredentialsForm } from "./employer-credentials-form";
import "./social-auth.css";

export function ExternalAuthPanel() {
  const [params] = useSearchParams();
  const role = params.get("role") === "employer" ? "employer" : "candidate";
  const flowId = params.get("flow");
  const callbackError = params.get("error");
  const [flow, setFlow] = useState(null);
  const [message, setMessage] = useState("");
  const [view, setView] = useState("choice");
  const [pending, setPending] = useState(false);
  const [remember, setRemember] = useState(false);
  const busy = useRef(false);
  const candidate = useCandidateSession();
  const employer = useEmployerSession();
  const navigate = useNavigate();
  useEffect(() => {
    if (!flowId || callbackError) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const value = await externalAuth.flow(role, flowId, controller.signal);
        if (!controller.signal.aborted) setFlow(value);
      } catch (error) {
        if (!controller.signal.aborted) setMessage(error.message);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [role, flowId, callbackError]);
  const roleLabel = role === "employer" ? "Nhà tuyển dụng" : "Ứng viên";
  const restart = `/login${role === "employer" ? "?role=employer" : ""}`;
  const currentAccount = (role === "employer" ? employer : candidate).account;
  const linkReturn = `/auth/external?role=${role}&flow=${flowId}`;
  const otherLogin = `/login?role=${role}&returnTo=${encodeURIComponent(linkReturn)}`;
  async function act(action) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      setMessage(error.message);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  const invalid = callbackError || !flowId;
  const failed = invalid || flow?.stage === "failed" || flow?.wrongRole;
  const external = flow ? { ...flow, flowId } : null;
  const register =
    !flow?.linked && !flow?.duplicateEmail && flow?.mode === "register" && view !== "link";
  return (
    <section
      className="min-w-0 rounded-2xl border bg-white p-8 max-[700px]:p-5 [overflow-wrap:anywhere]"
      aria-label="Hoàn tất xác thực"
    >
      <h1 className="text-2xl font-bold">
        {register ? "Hoàn tất đăng ký" : "Xác thực tài khoản"} {roleLabel}
      </h1>
      {invalid ? (
        <p className="social-auth-message" role="alert">
          Phiên xác thực không hợp lệ hoặc đã hết hạn. Vui lòng bắt đầu lại.
        </p>
      ) : !flow && !message ? (
        <p role="status" className="mt-4">
          Đang kiểm tra kết quả xác thực…
        </p>
      ) : (
        flow && (
          <>
            <p className="mt-4 text-sm">
              Phương thức: <strong>{flow.provider}</strong> · Vai trò: <strong>{roleLabel}</strong>
            </p>
            {flow.error && (
              <p className="social-auth-message" role="alert">
                {flow.error}
              </p>
            )}
            {flow.wrongRole && (
              <p className="social-auth-message" role="alert">
                Tài khoản đã liên kết với vai trò khác. Hãy chọn đúng vai trò và xác thực lại.
              </p>
            )}
            {!failed &&
              flow.stage === "ready" &&
              (flow.linked ? (
                <div className="external-auth-actions">
                  <Label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={remember}
                      onCheckedChange={(value) => setRemember(value === true)}
                    />
                    Ghi nhớ đăng nhập trên thiết bị này
                  </Label>
                  <button
                    disabled={pending}
                    onClick={() =>
                      act(async () => {
                        const session = await externalAuth.login(role, flowId, remember);
                        (role === "employer" ? employer : candidate).signIn(session.account);
                        navigate(flow.returnTo, { replace: true });
                      })
                    }
                  >
                    {pending ? "Đang đăng nhập…" : `Đăng nhập bằng ${flow.provider}`}
                  </button>
                </div>
              ) : register || view === "link" ? (
                <>
                  {view === "link" && (
                    <Link className="mt-4 inline-block text-sm underline" to={otherLogin}>
                      Đăng nhập bằng phương thức Job Tốt khác rồi quay lại liên kết
                    </Link>
                  )}
                  {view === "link" && (
                    <p className="mt-4 text-sm">
                      Đăng nhập tài khoản Job Tốt hiện có và xác nhận để liên kết {flow.provider}.
                      Không tạo tài khoản mới.
                    </p>
                  )}
                  {role === "employer" ? (
                    <EmployerCredentialsForm
                      key={`${flowId}-${view}`}
                      mode={register ? "register" : "login"}
                      external={external}
                    />
                  ) : (
                    <CredentialsForm
                      key={`${flowId}-${view}`}
                      mode={register ? "register" : "login"}
                      external={external}
                    />
                  )}
                  <button
                    className="mt-3 text-sm underline"
                    onClick={() => setView(register ? "link" : "choice")}
                  >
                    {register
                      ? "Đã có tài khoản Job Tốt? Đăng nhập để liên kết"
                      : "Quay lại lựa chọn"}
                  </button>
                </>
              ) : (
                <div className="external-auth-actions">
                  <p className="text-sm">
                    {flow.duplicateEmail
                      ? "Email đã có tài khoản Job Tốt. Hãy đăng nhập tài khoản đó để xác nhận liên kết."
                      : "Chưa có tài khoản Job Tốt được liên kết. Bạn có thể liên kết tài khoản hiện có hoặc chuyển sang đăng ký."}
                  </p>
                  {currentAccount && (
                    <button
                      disabled={pending}
                      onClick={() =>
                        act(async () => {
                          const session = await externalAuth.linkSession(role, flowId);
                          (role === "employer" ? employer : candidate).signIn(session.account);
                          navigate(flow.returnTo, { replace: true });
                        })
                      }
                    >{`Xác nhận liên kết với ${currentAccount.fullName} (${currentAccount.email || roleLabel})`}</button>
                  )}
                  <button onClick={() => setView("link")}>
                    Đăng nhập tài khoản Job Tốt để liên kết
                  </button>
                  {!flow.duplicateEmail && (
                    <button
                      disabled={pending}
                      onClick={() =>
                        act(async () => {
                          setFlow(await externalAuth.registration(role, flowId));
                          setView("register");
                        })
                      }
                    >{`Chuyển sang đăng ký ${roleLabel}`}</button>
                  )}
                </div>
              ))}
          </>
        )
      )}
      {message && (
        <p className="social-auth-message" role="alert">
          {message}
        </p>
      )}
      <Link className="mt-6 inline-block text-sm text-auth-orange underline" to={restart}>
        Chọn lại vai trò hoặc phương thức đăng nhập
      </Link>
    </section>
  );
}
