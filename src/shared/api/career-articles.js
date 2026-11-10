import { readResponseJson } from "./read-response-json";
export async function readArticles(id, signal) {
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const response = await fetch(
    `${base}/api/career-articles${id ? `/${encodeURIComponent(id)}` : ""}`,
    { signal },
  );
  const data = await readResponseJson(response);
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? "Bài viết chưa xuất bản hoặc không còn tồn tại."
        : "Không thể tải bài viết. Vui lòng thử lại.",
    );
  return data;
}
