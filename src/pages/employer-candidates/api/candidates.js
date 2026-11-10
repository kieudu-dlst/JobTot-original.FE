import { employerFetch } from "@/shared/api/employer-session";
export async function recruitmentRequest(path = "", options = {}) {
  const response = await employerFetch(`candidates${path}`, options);
  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch {
      /* Empty error response */
    }
    throw new Error(
      data?.detail ||
        Object.values(data?.errors || {})
          .flat()
          .join(" ") ||
        `Không thể tải/lưu dữ liệu (${response.status}).`,
    );
  }
  return response.status === 204 || response.headers.get("content-length") === "0"
    ? null
    : response.text().then((text) => (text ? JSON.parse(text) : null));
}
export const mutate = (path, data, method = "POST") =>
  recruitmentRequest(path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(data !== undefined && { body: JSON.stringify(data) }),
  });
