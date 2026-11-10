import { useState } from "react";
import { candidateAuth } from "../api/candidate-auth";
import { employerAuth } from "../api/employer-auth";

export function useEmailAuthFlow(role) {
  const api = role === "employer" ? employerAuth : candidateAuth;
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [changeToken, setChangeToken] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  async function prepareRegistration(email) {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@"))
      throw new Error("Đăng ký tài khoản mới cần email để nhận mã xác thực.");
    if (!challenge || challenge.email !== normalized) {
      const response = await api.requestEmailCode(normalized);
      setChallenge({ email: normalized, id: response.challengeId });
      setCode("");
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
    const response = await api.requestEmailCode(challenge.email);
    setChallenge({ email: challenge.email, id: response.challengeId });
    setCode("");
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
    resetVerification: () => {
      setChallenge(null);
      setCode("");
    },
  };
}
