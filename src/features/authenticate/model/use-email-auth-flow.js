import { useEffect, useRef, useState } from "react";
import { candidateAuth } from "../api/candidate-auth";
import { employerAuth } from "../api/employer-auth";

export function useEmailAuthFlow(role) {
  const api = role === "employer" ? employerAuth : candidateAuth;
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [changeToken, setChangeToken] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [resending, setResending] = useState(false);
  const sending = useRef(false);
  useEffect(() => {
    if (!resendAvailableAt) return;
    const timer = setInterval(() => {
      const seconds = Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));
      setResendSeconds(seconds);
      if (seconds === 0) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [resendAvailableAt]);
  function startCooldown(seconds) {
    const duration = Math.max(0, Math.ceil(Number(seconds) || 60));
    setResendAvailableAt(Date.now() + duration * 1000);
    setResendSeconds(duration);
  }
  async function requestCode(email) {
    try {
      const response = await api.requestEmailCode(email);
      startCooldown(response.retryAfterSeconds);
      setChallenge({ email, id: response.challengeId });
      setCode("");
    } catch (error) {
      if (error.status === 429) startCooldown(error.retryAfterSeconds);
      throw error;
    }
  }
  async function prepareRegistration(email) {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@"))
      throw new Error("Đăng ký tài khoản mới cần email để nhận mã xác thực.");
    if (!challenge || challenge.email !== normalized) {
      await requestCode(normalized);
      return null;
    }
    if (!/^\d{6}$/.test(code)) throw new Error("Nhập mã xác thực 6 chữ số được gửi tới email.");
    return (await api.verifyEmailCode({ email: normalized, challengeId: challenge.id, code }))
      .verificationToken;
  }
  async function changeTemporary() {
    if (!changeToken) return null;
    if (password.length < 8 || password.length > 128 || password !== confirmPassword)
      throw new Error("Mật khẩu mới cần 8–128 ký tự và xác nhận phải trùng khớp.");
    await api.changeTemporaryPassword({ token: changeToken, password, confirmPassword });
    setChangeToken(null);
    return password;
  }
  async function resend() {
    if (!challenge || sending.current || Date.now() < resendAvailableAt) return false;
    sending.current = true;
    setResending(true);
    try {
      await requestCode(challenge.email);
      return true;
    } finally {
      sending.current = false;
      setResending(false);
    }
  }
  return {
    challenge,
    code,
    setCode,
    changeToken,
    setChangeToken,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    prepareRegistration,
    changeTemporary,
    resend,
    resendSeconds,
    resending,
    resetVerification: () => {
      setChallenge(null);
      setCode("");
    },
  };
}
