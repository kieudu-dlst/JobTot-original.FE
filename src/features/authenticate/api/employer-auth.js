import { readResponseJson } from "@/shared/api/read-response-json";
import { employerFetch, saveTokens, readTokens, clearTokens } from "@/shared/api/employer-session";

async function request(path, options = {}, authenticated = false) {
  let response;
  try {
    response = await employerFetch(`auth${path}`, options, { authenticated });
  } catch (failure) {
    if (failure.status || options.signal?.aborted) throw failure;
    throw new Error("Không thể kết nối máy chủ. Vui lòng thử lại.");
  }
  const data = await readResponseJson(response);
  if (!response.ok) {
    const fallback = {
      400: "Yêu cầu không hợp lệ. Vui lòng kiểm tra thông tin và thử lại.",
      401: "Email công việc hoặc mật khẩu không đúng.",
      403: "Tài khoản không có quyền truy cập.",
      409: "Email hoặc số điện thoại đã được đăng ký.",
      429: "Bạn đã thử quá nhiều lần. Vui lòng đợi một phút rồi thử lại.",
    };
    const error = new Error(
      response.status >= 500 && !data?.detail
        ? "Máy chủ đang gặp sự cố. Vui lòng thử lại sau."
        : data?.detail || fallback[response.status] || "Yêu cầu không thành công.",
    );
    error.status = response.status;
    error.changeToken = data?.changeToken;
    error.fields = Object.fromEntries(
      Object.entries(data?.errors || {}).map(([key, value]) => {
        const name = key.charAt(0).toLowerCase() + key.slice(1);
        return [
          name === "emailOrPhone" ? "identity" : name,
          Array.isArray(value) ? value.join(" ") : value,
        ];
      }),
    );
    throw error;
  }
  return data;
}

async function post(path, body) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function authenticate(path, values) {
  const session = await post(path, values);
  saveTokens(session, path === "/login" && values.rememberMe);
  return session;
}

export const employerAuth = {
  requestEmailCode: (email) => post("/email/request", { email }),
  verifyEmailCode: (values) => post("/email/verify", values),
  changeTemporaryPassword: (values) => post("/email/change-temporary-password", values),
  me: (signal) => request("/me", { signal }, true),
  provinces: (signal) => request("/provinces", { signal }),
  login: (values) => authenticate("/login", values),
  register: (values) => authenticate("/register", values),
  logout: async () => {
    const tokens = readTokens();
    // Clearing first prevents in-flight requests from restoring a logged-out session.
    clearTokens();
    if (tokens) await post("/logout", { refreshToken: tokens.refreshToken });
  },
  forgotPassword: (email) => post("/forgot-password", { email }),
  resetPassword: async (values) => {
    const result = await post("/reset-password", values);
    clearTokens();
    return result;
  },
};
