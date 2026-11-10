import { readResponseJson } from "@/shared/api/read-response-json";
import { candidateFetch } from "@/shared/api/candidate-session";
async function request(path, options = {}) {
  const response = await candidateFetch(path, options);
  const data = await readResponseJson(response);
  if (!response.ok) {
    const error = new Error(
      data?.detail ||
        Object.values(data?.errors || {})
          .flat()
          .join(" ") ||
        (response.status === 401
          ? "Vui lòng đăng nhập để ứng tuyển."
          : "Không thể gửi hồ sơ. Vui lòng thử lại."),
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
export const applicationsApi = {
  profile: (signal) => request("profile", { signal }),
  status: (id, signal) => request(`jobs/${id}/application`, { signal }),
  submit: (id, body) =>
    request(`jobs/${id}/application`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  upload: (file) => {
    const body = new FormData();
    body.append("file", file);
    return request("profile/cvs", { method: "POST", body });
  },
};
