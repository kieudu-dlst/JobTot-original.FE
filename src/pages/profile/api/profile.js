import { readResponseJson } from "@/shared/api/read-response-json";
import { candidateFetch } from "@/shared/api/candidate-session";
import { getCandidateProfile } from "@/shared/api/candidate-profile";
async function request(path, options = {}) {
  const response = await candidateFetch(path, options);
  const data = await readResponseJson(response);
  if (!response.ok) {
    const error = new Error(
      data?.detail ||
        Object.values(data?.errors || {})
          .flat()
          .join(" ") ||
        "Không thể tải hoặc lưu hồ sơ. Vui lòng thử lại.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
async function mutate(method, body) {
  const multipart = body instanceof FormData;
  return request(`profile${multipart ? "/cvs" : ""}`, {
    method,
    headers: { ...(!multipart && { "Content-Type": "application/json" }) },
    body: multipart ? body : JSON.stringify({ ...body, birthDate: body.birthDate || null }),
  });
}
export const profileApi = {
  get: getCandidateProfile,
  save: (data) => mutate("PUT", data),
  upload: (file) => {
    const body = new FormData();
    body.append("file", file);
    return mutate("POST", body);
  },
};
profileApi.setDefault = (id, isDefault) =>
  request(`profile/cvs/${encodeURIComponent(id)}/default`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isDefault }),
  });
profileApi.avatar = (file) => {
  const body = new FormData();
  body.append("file", file);
  return request("profile/avatar", { method: "POST", body });
};
profileApi.removeAvatar = () => request("profile/avatar", { method: "DELETE" });

export async function downloadCv(cv) {
  const response = await candidateFetch(`profile/cvs/${cv.id}`);
  if (!response.ok) throw new Error("Không thể tải CV. Vui lòng thử lại.");
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = cv.title;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
