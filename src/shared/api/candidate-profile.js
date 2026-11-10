import { readResponseJson } from "./read-response-json";
import { candidateFetch } from "./candidate-session";

export async function getCandidateProfile(signal) {
  const response = await candidateFetch("profile", { signal });
  const data = await readResponseJson(response);
  if (!response.ok) {
    const error = new Error(data?.detail || "Không thể tải hồ sơ. Vui lòng thử lại.");
    error.status = response.status;
    throw error;
  }
  return data;
}
