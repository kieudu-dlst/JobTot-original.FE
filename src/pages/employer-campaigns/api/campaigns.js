import { readResponseJson } from "@/shared/api/read-response-json";
import { employerFetch } from "@/shared/api/employer-session";
async function request(path = "", options = {}) {
  const response = await employerFetch(`campaigns${path}`, options);
  const data = await readResponseJson(response);
  if (!response.ok) {
    const error = new Error(
      data?.detail ||
        Object.values(data?.errors || {})
          .flat()
          .join(" ") ||
        {
          401: "Phiên đăng nhập đã hết hạn.",
          403: "Bạn không có quyền quản lý chiến dịch này.",
          404: "Không tìm thấy chiến dịch.",
          409: "Chiến dịch đã thay đổi. Vui lòng tải lại.",
        }[response.status] ||
        "Không thể tải/lưu chiến dịch. Vui lòng thử lại.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
export const campaignsApi = {
  list: (params, signal) => request(`?${params}`, { signal }),
  metadata: (signal) => request("/metadata", { signal }),
  get: (id, signal) => request(`/${encodeURIComponent(id)}`, { signal }),
  save: (id, document) =>
    request(id ? `/${encodeURIComponent(id)}` : "", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(document),
    }),
};
