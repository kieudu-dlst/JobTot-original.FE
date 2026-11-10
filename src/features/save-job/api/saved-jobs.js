import { readResponseJson } from "@/shared/api/read-response-json";
import { candidateFetch } from "@/shared/api/candidate-session";
async function request(path, options = {}) {
  const response = await candidateFetch(path, options);
  const data = await readResponseJson(response);
  if (!response.ok)
    throw new Error(data?.detail || "Không thể cập nhật việc làm đã lưu. Vui lòng thử lại.");
  return data;
}
export const savedJobsApi = {
  list: (signal) => request("saved-jobs", { signal }),
  set: (id, saved) =>
    request(`saved-jobs/${encodeURIComponent(id)}`, { method: saved ? "PUT" : "DELETE" }),
};
