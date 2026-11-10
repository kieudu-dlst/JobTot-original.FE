import { adminRequest, adminJson } from "@/shared/api/admin-session";

export const adminApi = {
  me: (signal) => adminRequest("auth/me", { signal }),
  list: (section, query, signal) => adminRequest(`${section}?${query}`, { signal }),
  status: (section, id, active) =>
    adminRequest(`${section}/${id}/status`, { method: "PUT", ...adminJson({ active }) }),
  verify: (id, verificationStatus) =>
    adminRequest(`companies/${id}/verification`, {
      method: "PUT",
      ...adminJson({ verificationStatus }),
    }),
  password: (id, password) =>
    adminRequest(`users/${id}/password`, { method: "PUT", ...adminJson({ password }) }),
  industry: (id, name) =>
    adminRequest(`industries${id ? `/${id}` : ""}`, {
      method: id ? "PUT" : "POST",
      ...adminJson({ name }),
    }),
};
