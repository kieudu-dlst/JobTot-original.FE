import { readResponseJson } from "@/shared/api/read-response-json";
const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
async function get(path, signal) {
  const response = await fetch(`${base}/api/${path}`, { signal, credentials: "omit" });
  const data = await readResponseJson(response);
  if (!response.ok)
    throw new Error(data?.detail || "Không thể tải dữ liệu việc làm. Vui lòng thử lại.");
  return data;
}
export const jobsApi = {
  detail: (id, signal) => get(`jobs/${encodeURIComponent(id)}`, signal),
  search: (params, signal) => get(`jobs?${params}`, signal),
  filters: (signal) => get("jobs/filters", signal),
};
