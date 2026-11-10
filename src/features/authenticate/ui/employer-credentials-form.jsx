import { Select } from "@/shared/ui/select";
import { useEmailAuthFlow } from "../model/use-email-auth-flow";
import { EmailAuthFields } from "./email-auth-fields";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  ContactRound,
  LockKeyhole,
  Mail,
  Phone,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import { useToast } from "@/shared/ui/toast-context";
import { employerAuth } from "../api/employer-auth";
import { useEmployerSession } from "../model/employer-session-context";
import { validateEmployer } from "../model/employer-validation";
import { AuthField } from "./auth-field";
import { ForgotPasswordDialog } from "./forgot-password-dialog";

const pairClass = "grid grid-cols-2 gap-4 max-[950px]:grid-cols-1 max-[950px]:gap-3";
const checkboxClass =
  "size-4 shrink-0 rounded-[3px] border-auth-orange shadow-none data-[state=checked]:bg-auth-orange data-[state=checked]:text-white";

export function EmployerCredentialsForm({ mode }) {
  const register = mode === "register";
  const [values, setValues] = useState({
    fullName: "",
    workPhone: "",
    email: "",
    companyName: "",
    taxCode: "",
    headOfficeProvinceId: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    recruitmentCommitment: false,
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [remember, setRemember] = useState(false);
  const [pending, setPending] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [provinceState, setProvinceState] = useState("loading");
  const [retry, setRetry] = useState(0);
  const submitting = useRef(false);
  const { signIn } = useEmployerSession();
  const navigate = useNavigate();
  const notify = useToast();
  useEffect(() => {
    if (!register) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const result = await employerAuth.provinces(controller.signal);
        if (controller.signal.aborted) return;
        setProvinces(result);
        setProvinceState(result.length ? "ready" : "empty");
      } catch {
        if (!controller.signal.aborted) setProvinceState("error");
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [register, retry]);
  function change(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setMessage("");
  }
  const field = (name) => ({
    value: values[name],
    error: errors[name],
    onChange: (event) => change(name, event.target.value),
  });
  const emailFlow = useEmailAuthFlow("employer");
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const next = validateEmployer(values, register);
    setErrors(next);
    setMessage("");
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      const emailVerificationToken = register
        ? await emailFlow.prepareRegistration(values.email)
        : null;
      if (register && !emailVerificationToken) {
        setMessage("Kiểm tra email và nhập mã xác thực để tiếp tục.");
        return;
      }
      const newPassword = !register ? await emailFlow.changeTemporary() : null;
      if (newPassword) setValues((current) => ({ ...current, password: newPassword }));
      const session = register
        ? await employerAuth.register({
            ...values,
            emailVerificationToken,
            fullName: values.fullName.trim(),
            email: values.email.trim(),
            companyName: values.companyName.trim(),
            workPhone: values.workPhone.trim(),
            taxCode: values.taxCode.trim(),
          })
        : await employerAuth.login({
            email: values.email.trim(),
            password: newPassword || values.password,
            rememberMe: remember,
          });
      signIn(session.account);
      notify(
        register
          ? "Đã tạo tài khoản nhà tuyển dụng. Doanh nghiệp đang chờ xác minh."
          : "Đăng nhập thành công.",
      );
      navigate("/employer/account", { replace: true });
    } catch (failure) {
      if (failure.changeToken) emailFlow.setChangeToken(failure.changeToken);
      setErrors(failure.fields || {});
      setMessage(failure.message);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  const consent = (name, text) => (
    <div key={name}>
      <div className="flex items-start gap-2">
        <Checkbox
          id={name}
          checked={values[name]}
          onCheckedChange={(value) => change(name, value === true)}
          className={checkboxClass}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
        />
        <Label htmlFor={name} className="text-xs font-normal leading-[18px] text-auth-text-caption">
          {text}
        </Label>
      </div>
      {errors[name] && (
        <p id={`${name}-error`} className="mt-1 text-xs text-auth-warning-text">
          {errors[name]}
        </p>
      )}
    </div>
  );
  return (
    <form noValidate onSubmit={submit} className="mt-3 grid gap-3 border-b pb-6">
      {register && (
        <div className={pairClass}>
          <AuthField
            name="fullName"
            label="Họ và tên người liên hệ / HR"
            icon={ContactRound}
            autoComplete="name"
            maxLength={200}
            placeholder="VD: Nguyễn Văn An"
            {...field("fullName")}
          />
          <AuthField
            name="workPhone"
            label="Số điện thoại công việc"
            icon={Phone}
            type="tel"
            autoComplete="tel"
            maxLength={32}
            placeholder="VD: 0988 123 456"
            {...field("workPhone")}
          />
        </div>
      )}
      <AuthField
        name="email"
        label="Email doanh nghiệp / Email công việc"
        icon={Mail}
        type="email"
        autoComplete="username"
        maxLength={320}
        placeholder="hr@tencongty.com.vn"
        {...field("email")}
      />
      {register && (
        <>
          <AuthField
            name="companyName"
            label="Tên công ty đầy đủ theo ĐKKD"
            icon={Building2}
            autoComplete="organization"
            maxLength={200}
            placeholder="VD: CÔNG TY TNHH CÔNG NGHỆ TỐT TECH"
            {...field("companyName")}
          />
          <div className={pairClass}>
            <AuthField
              name="taxCode"
              label="Mã số thuế doanh nghiệp (MST)"
              icon={ReceiptText}
              maxLength={14}
              placeholder="VD: 0109867899"
              {...field("taxCode")}
            />
            <div className="grid content-start gap-1.5">
              <Label htmlFor="headOfficeProvinceId" className="text-base text-auth-muted">
                Trụ sở chính <span className="text-auth-orange">*</span>
              </Label>
              <Select
                id="headOfficeProvinceId"
                value={values.headOfficeProvinceId}
                onChange={(event) => change("headOfficeProvinceId", event.target.value)}
                disabled={provinceState !== "ready"}
                aria-invalid={Boolean(errors.headOfficeProvinceId)}
                aria-describedby={errors.headOfficeProvinceId ? "province-error" : undefined}
                className="h-[43px] w-full min-w-0 rounded-lg border border-input bg-auth-surface-input pl-3 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-auth-orange disabled:opacity-60"
              >
                <option value="">
                  {provinceState === "loading" ? "Đang tải tỉnh/thành…" : "Chọn Tỉnh/Thành"}
                </option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </Select>
              {errors.headOfficeProvinceId && (
                <p id="province-error" className="text-xs text-auth-warning-text">
                  {errors.headOfficeProvinceId}
                </p>
              )}
              {(provinceState === "error" || provinceState === "empty") && (
                <p role="status" className="text-xs text-auth-warning-text">
                  {provinceState === "empty"
                    ? "Chưa có dữ liệu tỉnh/thành. Vui lòng liên hệ hỗ trợ."
                    : "Không tải được tỉnh/thành."}{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      setProvinceState("loading");
                      setRetry((value) => value + 1);
                    }}
                  >
                    Thử lại
                  </button>
                </p>
              )}
            </div>
          </div>
        </>
      )}
      <div className={register ? pairClass : undefined}>
        <AuthField
          name="password"
          label="Mật khẩu"
          icon={LockKeyhole}
          password
          autoComplete={register ? "new-password" : "current-password"}
          maxLength={128}
          placeholder={register ? "Tối thiểu 8 ký tự" : "Nhập mật khẩu"}
          trailing={!register && <ForgotPasswordDialog role="employer" />}
          {...field("password")}
        />
        {register && (
          <AuthField
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            icon={LockKeyhole}
            password
            autoComplete="new-password"
            maxLength={128}
            placeholder="Nhập lại mật khẩu"
            {...field("confirmPassword")}
          />
        )}
      </div>
      {register ? (
        <div className="mt-2 grid gap-3">
          {consent(
            "acceptTerms",
            "Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của Job Tốt.",
          )}
          {consent(
            "recruitmentCommitment",
            "Tôi cam kết thông tin tuyển dụng minh bạch, chính xác và không thu bất kỳ khoản phí nào từ ứng viên.",
          )}
          <p className="text-xs leading-relaxed text-auth-text-caption">
            Thông tin doanh nghiệp sẽ được kiểm tra trước khi xác minh tài khoản nhà tuyển dụng.
          </p>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(value) => setRemember(value === true)}
            className={checkboxClass}
          />
          <Label htmlFor="remember" className="text-xs font-normal text-auth-text-caption">
            Ghi nhớ đăng nhập trên thiết bị này
          </Label>
        </div>
      )}
      <EmailAuthFields flow={emailFlow} pending={pending} report={setMessage} />
      <Button
        type="submit"
        disabled={pending || (register && provinceState !== "ready")}
        className="mt-1 min-h-[52px] h-auto whitespace-normal py-3 w-full rounded-xl border-0 bg-auth-orange px-3 text-sm font-bold text-white hover:bg-auth-brand-hover"
      >
        <span>
          {pending
            ? "Đang xử lý…"
            : register
              ? "Đăng ký tài khoản Nhà tuyển dụng miễn phí"
              : "Đăng nhập ngay"}
        </span>
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
