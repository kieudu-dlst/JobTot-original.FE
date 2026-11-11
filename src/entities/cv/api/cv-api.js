import { readResponseJson } from "@/shared/api/read-response-json";
import { candidateFetch } from "@/shared/api/candidate-session";
import {
  adminRequest as admin,
  adminAuth,
  readAdminSession,
  clearAdminSession,
} from "@/shared/api/admin-session";
export { readAdminSession, clearAdminSession };
const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
async function decode(response) {
  if (response.status === 204) return null;
  const data = await readResponseJson(response);
  if (!response.ok) {
    const error = new Error(
      data?.detail ||
        Object.values(data?.errors || {})
          .flat()
          .join(" ") ||
        (response.status === 401
          ? "Vui lòng đăng nhập để tiếp tục."
          : response.status === 404
            ? "Không tìm thấy CV hoặc mẫu CV."
            : "Không thể lưu hoặc tải CV. Vui lòng thử lại."),
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
const json = (value) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(value),
});
const imageForm = (file, currentCount) => {
  const body = new FormData();
  body.append("file", file);
  body.append("currentCount", String(currentCount));
  return { body };
};
export const cvImageUrl = (url) =>
  url?.startsWith("/uploads/cv-decorations/") ? `${base}${url}` : "";
const publicGet = (path, signal) =>
  fetch(`${base}/api/cv-templates${path}`, { signal, credentials: "omit" }).then(decode);
export const cvApi = {
  uploadImage: (id, file, count) =>
    candidateFetch(`online-cvs/${encodeURIComponent(id)}/decoration-images`, {
      method: "POST",
      ...imageForm(file, count),
    }).then(decode),
  deleteImage: (id, imageId) =>
    candidateFetch(
      `online-cvs/${encodeURIComponent(id)}/decoration-images/${encodeURIComponent(imageId)}`,
      {
        method: "DELETE",
      },
    ).then(decode),
  setDefault: (id, isDefault) =>
    candidateFetch(`profile/cvs/${encodeURIComponent(id)}/default`, {
      method: "PUT",
      ...json({ isDefault }),
    }).then(decode),
  templates: (signal) => publicGet("", signal),
  template: (id, signal) => publicGet(`/${encodeURIComponent(id)}`, signal),
  list: (signal) => candidateFetch("online-cvs", { signal }).then(decode),
  get: (id, signal) =>
    candidateFetch(`online-cvs/${encodeURIComponent(id)}`, { signal }).then(decode),
  create: (id) =>
    candidateFetch(`online-cvs/from-template/${encodeURIComponent(id)}`, { method: "POST" }).then(
      decode,
    ),
  save: (id, value, signal) =>
    candidateFetch(`online-cvs/${encodeURIComponent(id)}`, {
      method: "PUT",
      ...json(value),
      signal,
    }).then(decode),
  remove: (id, version) =>
    candidateFetch(`online-cvs/${encodeURIComponent(id)}?version=${encodeURIComponent(version)}`, {
      method: "DELETE",
    }).then(decode),
};
export const adminCvApi = {
  uploadImage: (id, file, count) =>
    admin(`cv-templates${id ? `/${encodeURIComponent(id)}` : ""}/decoration-images`, {
      method: "POST",
      ...imageForm(file, count),
    }),
  deleteImage: (id, imageId) =>
    admin(
      `cv-templates${id ? `/${encodeURIComponent(id)}` : ""}/decoration-images/${encodeURIComponent(imageId)}`,
      {
        method: "DELETE",
      },
    ),
  login: adminAuth.login,
  logout: adminAuth.logout,
  list: (signal) => admin("cv-templates", { signal }),
  get: (id, signal) => admin(`cv-templates/${encodeURIComponent(id)}`, { signal }),
  save: (id, value, signal) =>
    admin(`cv-templates${id ? `/${encodeURIComponent(id)}` : ""}`, {
      method: id ? "PUT" : "POST",
      ...json(value),
      signal,
    }),
};
