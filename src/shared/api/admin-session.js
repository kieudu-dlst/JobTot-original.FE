import { readResponseJson } from "./read-response-json";

const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
export function readAdminSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem("jobtot.admin.session"));
    return session?.accessToken && new Date(session.expiresAt).getTime() > Date.now()
      ? session
      : null;
  } catch {
    return null;
  }
}
export function clearAdminSession() {
  sessionStorage.removeItem("jobtot.admin.session");
}
export async function adminRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  const session = readAdminSession();
  if (session) headers.set("Authorization", `Bearer ${session.accessToken}`);
  const response = await fetch(`${base}/api/admin/${path}`, {
    ...options,
    headers,
    credentials: "omit",
  });
  if (response.status === 401 && !options.signal?.aborted) clearAdminSession();
  if (response.status === 204) return null;
  const data = await readResponseJson(response);
  if (!response.ok) {
    const error = new Error(
      data?.detail ||
        Object.values(data?.errors || {})
          .flat()
          .join(" ") ||
        (response.status === 401
          ? "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại."
          : "Không thể xử lý yêu cầu. Vui lòng thử lại."),
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
export const adminJson = (value) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(value),
});
export const adminAuth = {
  login: async (input) => {
    const session = await adminRequest("auth/login", { method: "POST", ...adminJson(input) });
    sessionStorage.setItem("jobtot.admin.session", JSON.stringify(session));
    return session;
  },
  logout: async () => {
    try {
      await adminRequest("auth/logout", { method: "POST" });
    } finally {
      clearAdminSession();
    }
  },
};
