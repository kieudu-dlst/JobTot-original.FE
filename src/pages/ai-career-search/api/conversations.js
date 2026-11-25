import { candidateFetch } from "@/shared/api/candidate-session";
import { employerFetch } from "@/shared/api/employer-session";

async function request(employer, path, signal) {
  const response = await (employer ? employerFetch : candidateFetch)(
    `ai/conversations${path}`,
    { signal },
    { apiRoot: true },
  );
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Vui lòng đăng nhập lại để xem lịch sử."
        : "Không thể tải lịch sử trò chuyện. Vui lòng thử lại.",
    );
  return response;
}
export async function listConversations(employer, signal) {
  return (await request(employer, "", signal)).json();
}
export async function readConversation(employer, id, beforeId, signal) {
  const urls = [];
  try {
    const page = await (
      await request(
        employer,
        `/${encodeURIComponent(id)}${beforeId ? `?beforeId=${beforeId}` : ""}`,
        signal,
      )
    ).json();
    const messages = await Promise.all(
      page.messages.map(async (message) => {
        let image;
        if (message.hasImage) {
          try {
            const response = await request(
              employer,
              `/${encodeURIComponent(id)}/messages/${message.id}/image`,
              signal,
            );
            const blob = await response.blob();
            if (!["image/png", "image/jpeg"].includes(blob.type)) throw new Error("Invalid image");
            image = URL.createObjectURL(blob);
            urls.push(image);
          } catch (error) {
            if (signal.aborted) throw error;
          }
        }
        return {
          id: message.id,
          role: message.role,
          text: message.content || "Yêu cầu chưa hoàn tất.",
          state: message.state,
          image,
          imageMissing: message.hasImage && !image,
        };
      }),
    );
    signal.throwIfAborted();
    return { messages, hasMore: page.hasMore, urls };
  } catch (error) {
    urls.forEach((url) => URL.revokeObjectURL(url));
    throw error;
  }
}
