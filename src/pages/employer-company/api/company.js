import { readResponseJson } from "@/shared/api/read-response-json";
import { employerFetch } from "@/shared/api/employer-session";

async function request(options, path = "company") {
  const response = await employerFetch(path, options);
  const data = await readResponseJson(response);
  if (!response.ok) {
    const error = new Error(
      response.status >= 500
        ? "Không thể tải/lưu hồ sơ doanh nghiệp. Vui lòng thử lại."
        : data?.detail ||
          {
            401: "Phiên đăng nhập đã hết hạn.",
            403: "Bạn chưa có quyền chỉnh sửa hồ sơ doanh nghiệp.",
            404: "Tài khoản chưa được liên kết với doanh nghiệp.",
            409: "Hồ sơ đã thay đổi. Vui lòng tải lại trước khi lưu.",
          }[response.status] ||
          Object.values(data?.errors || {})
            .flat()
            .join(" ") ||
          "Thông tin hồ sơ không hợp lệ.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
export const employerCompanyApi = {
  resolveMap: async (url, signal) => {
    const response = await employerFetch(`company/map?url=${encodeURIComponent(url)}`, { signal });
    const data = await readResponseJson(response);
    if (!response.ok) {
      const error = new Error(
        response.status === 404
          ? "API đang chạy chưa có chức năng đọc link bản đồ. Hãy khởi động lại backend rồi bấm Thử lại."
          : data?.detail || "Không thể đọc vị trí từ Google Maps. Vui lòng thử lại.",
      );
      error.status = response.status;
      throw error;
    }
    return data;
  },
  get: (signal) => request({ signal }),
  industries: (signal) => request({ signal }, "company/industries"),
  save: (document) =>
    request({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(document),
    }),
  upload: (kind, file, revision) => {
    const body = new FormData();
    body.append("file", file);
    body.append("revision", revision);
    return request({ method: "POST", body }, `company/images/${kind}`);
  },
};
