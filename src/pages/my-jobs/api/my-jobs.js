import { readResponseJson } from "@/shared/api/read-response-json";
import { candidateFetch } from "@/shared/api/candidate-session";
async function request(path, options = {}) {
  const response = await candidateFetch(path, options);
  const data = await readResponseJson(response);
  if (!response.ok)
    throw new Error(data?.detail || "Không thể tải việc làm của bạn. Vui lòng thử lại.");
  return data;
}
export const myJobsApi = {
  get: (params, signal) => request(`my-jobs?${params}`, { signal }),
  status: (readyStatus) =>
    request("my-jobs/status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readyStatus }),
    }),
  confirmInterview: (id, signal) => request(`interviews/${id}/confirm`, { method: "PUT", signal }),
};
