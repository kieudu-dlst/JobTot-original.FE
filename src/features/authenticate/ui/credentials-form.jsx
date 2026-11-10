import { useEmailAuthFlow } from "../model/use-email-auth-flow";
import { EmailAuthFields } from "./email-auth-fields";
import { Button } from "@/shared/ui/button";
import { useToast } from "@/shared/ui/toast-context";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import { ArrowRight, ContactRound, LockKeyhole, Mail } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authReturnPath } from "@/shared/lib/auth-return-path";
import { candidateAuth } from "../api/candidate-auth";
import { useCandidateSession } from "../model/session-context";
import { validateAuth } from "../model/validation";
import { AuthField } from "./auth-field";
import { ForgotPasswordDialog } from "./forgot-password-dialog";

export function CredentialsForm({ mode }) {
  const notify = useToast();
  const register = mode === "register";
  const [values, setValues] = useState({
    fullName: "",
    identity: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [remember, setRemember] = useState(false);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const navigate = useNavigate();
  const { search } = useLocation();
  const { signIn } = useCandidateSession();
  const emailFlow = useEmailAuthFlow("candidate");
  function field(name) {
    return {
      value: values[name],
      error: errors[name],
      onChange: (event) => {
        setValues({ ...values, [name]: event.target.value });
        setErrors({ ...errors, [name]: undefined });
        setMessage("");
      },
    };
  }
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    setMessage("");
    const nextErrors = validateAuth(values, mode);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      const emailVerificationToken = register
        ? await emailFlow.prepareRegistration(values.identity)
        : null;
      if (register && !emailVerificationToken) {
        setMessage("Kiểm tra email và nhập mã xác thực để tiếp tục.");
        return;
      }
      const newPassword = !register ? await emailFlow.changeTemporary() : null;
      if (newPassword) setValues((current) => ({ ...current, password: newPassword }));
      const body = {
        emailOrPhone: values.identity.trim(),
        password: newPassword || values.password,
      };
      const session = register
        ? await candidateAuth.register({
            ...body,
            emailVerificationToken,
            fullName: values.fullName.trim(),
            confirmPassword: values.confirmPassword,
          })
        : await candidateAuth.login({ ...body, rememberMe: remember });
      signIn(session.account, { rememberMe: !register && remember });
      notify(register ? "Đăng ký tài khoản thành công." : "Đăng nhập thành công.");
      navigate(authReturnPath(search), { replace: true });
    } catch (failure) {
      if (failure.changeToken) emailFlow.setChangeToken(failure.changeToken);
      setErrors(failure.fields || {});
      setMessage(failure.message);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <form noValidate onSubmit={submit} className={`grid mt-3 gap-3 border-b pb-6 max-[700px]:mb-0`}>
      {register && (
        <AuthField
          name="fullName"
          label="Họ và tên"
          icon={ContactRound}
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          {...field("fullName")}
        />
      )}
      <AuthField
        name="identity"
        label={register ? "Email" : "Email hoặc số điện thoại"}
        icon={Mail}
        autoComplete="username"
        placeholder="email@example.com"
        {...field("identity")}
      />
      <div
        className={
          register ? "grid grid-cols-2 gap-4 max-[950px]:grid-cols-1 max-[950px]:gap-3" : undefined
        }
      >
        <AuthField
          name="password"
          label="Mật khẩu"
          icon={LockKeyhole}
          password
          autoComplete={register ? "new-password" : "current-password"}
          placeholder={register ? "Tối thiểu 8 ký tự" : "Nhập mật khẩu"}
          trailing={!register && <ForgotPasswordDialog />}
          {...field("password")}
        />
        {register && (
          <AuthField
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            icon={LockKeyhole}
            password
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            {...field("confirmPassword")}
          />
        )}
      </div>
      {!register && (
        <div className="mt-1 flex items-center gap-2">
          <Checkbox
            id="remember"
            className="size-4 rounded-[3px] border-auth-orange shadow-none data-[state=checked]:border-auth-orange data-[state=checked]:bg-auth-orange data-[state=checked]:text-white"
            checked={remember}
            onCheckedChange={setRemember}
          />
          <Label
            htmlFor="remember"
            className="text-xs font-normal leading-[18px] text-auth-text-caption"
          >
            Ghi nhớ đăng nhập trên thiết bị này
          </Label>
        </div>
      )}
      <EmailAuthFields flow={emailFlow} pending={pending} report={setMessage} />
      <Button
        type="submit"
        disabled={pending}
        className={`w-full gap-[7px] border-0 bg-auth-orange text-base font-bold text-white hover:bg-auth-brand-hover max-[950px]:text-sm [&_svg]:size-[19px] ${register ? "-mt-1 h-[52px] rounded-xl" : "mt-0 h-12 rounded-lg"}`}
      >
        {pending ? "Đang xử lý…" : register ? "Đăng ký tài khoản miễn phí" : "Đăng nhập ngay"}
        <ArrowRight />
      </Button>
      {message && (
        <p
          role="status"
          className="rounded-lg bg-auth-warning-surface p-3 text-xs text-auth-warning-text"
        >
          {message}
        </p>
      )}
    </form>
  );
}
