import {
  saveTokens as saveCandidateTokens,
  readTokens as candidateTokens,
} from "@/shared/api/candidate-session";
import {
  saveTokens as saveEmployerTokens,
  readTokens as employerTokens,
} from "@/shared/api/employer-session";

const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
async function request(role, path, body, signal, authenticated = false) {
  const tokens = authenticated ? (role === "employer" ? employerTokens : candidateTokens)() : null;
  let response;
  try {
    response = await fetch(`${base}/api/${role}/auth/external/${path}`, {
      method: body === undefined ? "GET" : "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-JobTot-External": "1",
        ...(tokens && { Authorization: `Bearer ${tokens.accessToken}` }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("Không thể kết nối máy chủ xác thực. Vui lòng thử lại hoặc sử dụng email.");
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Máy chủ xác thực chưa phản hồi hợp lệ. Vui lòng thử lại sau.");
  }
  if (!response.ok) {
    const error = new Error(
      data.detail ||
        (response.status === 401
          ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          : response.status === 429
            ? "Bạn đã thử quá nhiều lần. Vui lòng đợi một phút rồi thử lại."
            : "Không thể hoàn tất xác thực. Vui lòng kiểm tra thông tin và thử lại."),
    );
    error.status = response.status;
    error.changeToken = data.changeToken;
    error.fields = Object.fromEntries(
      Object.entries(data.errors || {}).map(([name, errors]) => [
        name[0].toLowerCase() + name.slice(1),
        Array.isArray(errors) ? errors.join(" ") : errors,
      ]),
    );
    throw error;
  }
  return data;
}
async function session(role, id, action, body) {
  const value = await request(
    role,
    `flows/${id}/${action}`,
    body,
    undefined,
    action === "link-session",
  );
  (role === "employer" ? saveEmployerTokens : saveCandidateTokens)(value, Boolean(body.rememberMe));
  return value;
}
export const externalAuth = {
  start: (role, provider, mode, returnTo) => request(role, `${provider}/start`, { mode, returnTo }),
  flow: (role, id, signal) => request(role, `flows/${id}`, undefined, signal),
  registration: (role, id) => request(role, `flows/${id}/registration`, {}),
  register: (role, id, body) => session(role, id, "register", body),
  link: (role, id, body) => session(role, id, "link", body),
  linkSession: (role, id) =>
    session(role, id, "link-session", { confirmLink: true, rememberMe: false }),
  login: (role, id, rememberMe) => session(role, id, "session", { rememberMe }),
};

export function externalNeedsEmailVerification(external, email) {
  return (
    !external?.emailVerified || external.email?.trim().toLowerCase() !== email.trim().toLowerCase()
  );
}
