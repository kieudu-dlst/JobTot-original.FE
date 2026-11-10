import { readResponseJson } from "@/shared/api/read-response-json";
import { candidateFetch } from "@/shared/api/candidate-session";
import { employerFetch } from "@/shared/api/employer-session";

export async function messagesApi(employer, path = "", options = {}) {
  const response = await (employer ? employerFetch : candidateFetch)(`messages${path}`, options);
  const data = await readResponseJson(response);
  if (!response.ok)
    throw new Error(data?.detail || "Không thể tải hoặc gửi tin nhắn. Vui lòng thử lại.");
  return data;
}
