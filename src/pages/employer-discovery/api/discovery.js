import { employerFetch } from "@/shared/api/employer-session";
import { readResponseJson } from "@/shared/api/read-response-json";

export async function discoveryRequest(path = "", options = {}) {
  const response = await employerFetch(`talent-discovery${path}`, options);
  const data = response.status === 204 ? null : await readResponseJson(response);
  if (!response.ok) {
    throw new Error(
      data?.detail ||
        Object.values(data?.errors || {})
          .flat()
          .join(" ") ||
        `Không thể tải hoặc lưu hồ sơ (${response.status}). Vui lòng thử lại.`,
    );
  }
  return data;
}

export const updateCollection = (id, collection, value) =>
  discoveryRequest(`/${id}/${collection}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collection === "interest" ? { interested: value } : { saved: value }),
  });
