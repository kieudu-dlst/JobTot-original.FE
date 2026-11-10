import { readResponseJson } from "@/shared/api/read-response-json";
import { candidateFetch } from "@/shared/api/candidate-session";

const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function decode(response) {
  if (response.status === 204) return null;
  const data = await readResponseJson(response);
  if (!response.ok) {
    const error = new Error(
      data?.detail || "Không thể tải dữ liệu doanh nghiệp. Vui lòng thử lại.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

async function get(path, signal) {
  const response = await fetch(`${base}/api/${path}`, { signal, credentials: "omit" });
  return decode(response);
}

export const companiesApi = {
  detail: async (id, signal) => {
    const result = await get(`companies?companyId=${encodeURIComponent(id)}&pageSize=1`, signal);
    if (!result.items?.length) {
      const error = new Error("Không tìm thấy doanh nghiệp.");
      error.status = 404;
      throw error;
    }
    return result.items[0];
  },
  list: (params, signal) => get(`companies?${params}`, signal),
  metadata: (signal) => get("companies/filters", signal),
  featured: (signal) => get("companies/featured", signal),
  jobs: (id, page, signal) =>
    get(`jobs?companyId=${encodeURIComponent(id)}&page=${page}&pageSize=10`, signal),
  followed: async (signal) => decode(await candidateFetch("followed-companies", { signal })),
  follow: async (id, followed) =>
    decode(
      await candidateFetch(`followed-companies/${encodeURIComponent(id)}`, {
        method: followed ? "PUT" : "DELETE",
      }),
    ),
};
