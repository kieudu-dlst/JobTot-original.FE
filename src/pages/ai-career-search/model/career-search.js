export const errorMessages = {
  ai_invalid_question: "Vui lòng nhập câu hỏi từ 1 đến 2000 ký tự.",
  ai_invalid_image: "Vui lòng chọn ảnh CV JPG hoặc PNG hợp lệ, tối đa 5 MB.",
  ai_conversation_not_found: "Không tìm thấy cuộc trò chuyện. Hãy tạo cuộc trò chuyện mới.",
  ai_unauthenticated: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  ai_forbidden: "Tài khoản này không có quyền sử dụng trợ lý nghề nghiệp.",
  ai_rate_limited: "Dịch vụ đang giới hạn yêu cầu. Vui lòng chờ trước khi thử lại.",
  ai_busy: "Trợ lý đang xử lý nhiều câu hỏi. Vui lòng thử lại sau.",
  ai_not_configured: "Trợ lý AI chưa sẵn sàng. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
  ai_configuration: "Trợ lý AI chưa sẵn sàng. Vui lòng liên hệ hỗ trợ.",
  ai_provider_quota:
    "Google đang giới hạn hạn mức của dự án AI. Vui lòng thử lại sau hoặc liên hệ quản trị viên để kiểm tra quota và trạng thái thanh toán.",
  ai_timeout: "Tra cứu mất quá nhiều thời gian. Bạn có thể chủ động thử lại câu hỏi này.",
  ai_provider_error: "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.",
  ai_provider_unavailable:
    "Trợ lý AI đang bận. Hệ thống đã thử kết nối lại; bạn có thể gửi lại câu hỏi sau ít giây.",
  ai_provider_response: "Chưa nhận được câu trả lời hợp lệ. Vui lòng thử lại sau.",
  ai_answer_too_long: "Câu trả lời quá dài. Hãy thu hẹp câu hỏi.",
  ai_no_answer: "Chưa có câu trả lời phù hợp. Hãy diễn đạt lại câu hỏi.",
  network: "Không thể kết nối máy chủ. Hãy kiểm tra mạng rồi thử lại.",
};
export class CareerError extends Error {
  constructor(code, retryAfter = 0, diagnostic = {}) {
    super(
      Object.hasOwn(errorMessages, code) ? errorMessages[code] : errorMessages.ai_provider_error,
    );
    this.code = code;
    this.retryAfter = retryAfter;
    if (typeof diagnostic.conversationId === "string")
      this.conversationId = diagnostic.conversationId;
    if (code === "ai_configuration")
      this.message = configurationMessage(diagnostic) || this.message;
    if (code === "ai_provider_quota") this.message = quotaMessage(diagnostic) || this.message;
  }
}
function quotaMessage({ quotaViolations }) {
  if (!Array.isArray(quotaViolations)) return null;
  if (quotaViolations.some((item) => item?.limit === 0))
    return "Google báo hạn mức của dự án/model bằng 0. Quản trị viên cần kiểm tra quota, quyền sử dụng model và trạng thái thanh toán trong AI Studio.";
  const messages = {
    google_search:
      "Google đang giới hạn lượt tra cứu Google Search của dự án AI. Vui lòng chờ quota được khôi phục hoặc liên hệ quản trị viên.",
    requests_per_day:
      "Google đang giới hạn số yêu cầu trong ngày của dự án AI. Vui lòng chờ quota ngày được khôi phục hoặc liên hệ quản trị viên.",
    tokens_per_minute:
      "Google đang giới hạn số token mỗi phút của dự án AI. Vui lòng chờ trước khi thử lại.",
    requests_per_minute:
      "Google đang giới hạn số yêu cầu mỗi phút của dự án AI. Vui lòng chờ trước khi thử lại.",
  };
  for (const item of quotaViolations) {
    if (item && Object.hasOwn(messages, item.kind)) return messages[item.kind];
  }
  return null;
}
function configurationMessage({ failureStage, providerStatus, providerReason }) {
  const stages = {
    key_validation:
      "Key AI trong cấu hình backend có định dạng không hợp lệ. Vui lòng liên hệ quản trị viên.",
    model_validation:
      "Tên model AI trong cấu hình backend không hợp lệ. Vui lòng liên hệ quản trị viên.",
    limits_validation: "Cấu hình giới hạn xử lý AI không hợp lệ. Vui lòng liên hệ quản trị viên.",
  };
  if (Object.hasOwn(stages, failureStage)) return stages[failureStage];
  if (failureStage !== "provider_http") return null;
  const reasons = {
    API_KEY_INVALID:
      "Google báo key AI không hợp lệ. Quản trị viên cần kiểm tra key trong backend.",
    API_KEY_EXPIRED: "Google báo key AI đã hết hạn. Quản trị viên cần cập nhật key trong backend.",
    API_KEY_SERVICE_BLOCKED:
      "Key AI bị giới hạn truy cập Gemini API. Quản trị viên cần kiểm tra quyền của key.",
    API_KEY_IP_ADDRESS_BLOCKED:
      "Google từ chối địa chỉ IP của backend. Quản trị viên cần kiểm tra giới hạn của key.",
    API_KEY_HTTP_REFERRER_BLOCKED:
      "Giới hạn website của key không phù hợp với backend. Quản trị viên cần kiểm tra cấu hình key.",
    ACCESS_TOKEN_TYPE_UNSUPPORTED:
      "Google không chấp nhận loại thông tin xác thực hiện tại. Quản trị viên cần kiểm tra key AI.",
    SERVICE_DISABLED: "Gemini API chưa được bật cho dự án Google. Quản trị viên cần bật dịch vụ.",
    BILLING_DISABLED: "Google yêu cầu kiểm tra cấu hình thanh toán của dự án AI.",
    CONSUMER_INVALID: "Dự án Google của key AI không khả dụng. Quản trị viên cần kiểm tra dự án.",
  };
  if (Object.hasOwn(reasons, providerReason)) return reasons[providerReason];
  const statuses = {
    400: "Google từ chối yêu cầu AI. Quản trị viên cần kiểm tra model, tham số và điều kiện sử dụng dịch vụ.",
    401: "Google từ chối xác thực key AI. Quản trị viên cần kiểm tra key trong backend.",
    403: "Dự án hoặc key chưa có quyền sử dụng dịch vụ AI. Quản trị viên cần kiểm tra quyền truy cập Google.",
    404: "Google không tìm thấy model AI hoặc chưa cấp quyền sử dụng model cho dự án này.",
  };
  return Object.hasOwn(statuses, providerStatus) ? statuses[providerStatus] : null;
}
export function retrySeconds(value, now = Date.now()) {
  if (!value) return 0;
  const seconds = /^\d+$/.test(value) ? Number(value) : Math.ceil((Date.parse(value) - now) / 1000);
  return Number.isFinite(seconds) ? Math.max(0, Math.min(86400, seconds)) : 0;
}
export async function searchCareer(question, signal, authenticatedFetch, image, conversationId) {
  if ((!question.trim() && !image) || question.length > 2000)
    throw new CareerError("ai_invalid_question");
  try {
    // A GET may refresh credentials safely. Generation itself is never automatically replayed.
    const session = await authenticatedFetch("auth/me", { signal });
    if (!session.ok)
      throw new CareerError(
        session.status === 401 || session.status === 403 ? "ai_unauthenticated" : "network",
      );
    signal.throwIfAborted();
    const response = await authenticatedFetch(
      "ai/career-search",
      {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          ...(image ? { image: { mimeType: image.mimeType, data: image.data } } : {}),
          ...(conversationId ? { conversationId } : {}),
        }),
      },
      { apiRoot: true, retry: false },
    );
    let data;
    try {
      data = await response.json();
    } catch (error) {
      if (signal.aborted) throw error;
      data = null;
    }
    if (!response.ok) {
      const fallback =
        response.status === 413
          ? "ai_invalid_image"
          : response.status === 401
            ? "ai_unauthenticated"
            : response.status === 429
              ? "ai_rate_limited"
              : response.status === 504
                ? "ai_timeout"
                : "ai_provider_error";
      throw new CareerError(
        Object.hasOwn(errorMessages, data?.code) ? data.code : fallback,
        retrySeconds(response.headers.get("Retry-After")),
        data || {},
      );
    }
    if (typeof data?.answer !== "string" || !data.answer)
      throw new CareerError("ai_provider_response");
    return data;
  } catch (error) {
    if (signal.aborted || error instanceof CareerError) throw error;
    throw new CareerError(
      error.status === 401 || error.status === 400 ? "ai_unauthenticated" : "network",
    );
  }
}
export function createSearchRunner(request) {
  let version = 0,
    controller;
  return {
    cancel() {
      version++;
      controller?.abort();
      controller = null;
    },
    async run(question, image, conversationId) {
      controller?.abort();
      const current = ++version;
      controller = new AbortController();
      const signal = controller.signal;
      try {
        const result = await request(question, signal, image, conversationId);
        return current === version && !signal.aborted ? { result, question } : null;
      } catch (error) {
        return current === version && !signal.aborted ? { error, question } : null;
      } finally {
        if (current === version) controller = null;
      }
    },
  };
}
export function safeSourceUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function citationView(result) {
  const sources = (Array.isArray(result.sources) ? result.sources : []).filter(
    (s) => s && typeof s.id === "string" && safeSourceUrl(s.url),
  );
  const sourceIds = new Set(sources.map((s) => s.id));
  const citations = (
    result.citationIndexUnit === "utf16" && Array.isArray(result.citations) ? result.citations : []
  ).flatMap((c) => {
    if (
      !Number.isInteger(c.startIndex) ||
      !Number.isInteger(c.endIndex) ||
      c.startIndex < 0 ||
      c.endIndex <= c.startIndex ||
      c.endIndex > result.answer.length
    )
      return [];
    const text = result.answer.slice(c.startIndex, c.endIndex);
    const splitsEmoji = (index) =>
      index > 0 &&
      index < result.answer.length &&
      /[\uD800-\uDBFF]/.test(result.answer[index - 1]) &&
      /[\uDC00-\uDFFF]/.test(result.answer[index]);
    if (splitsEmoji(c.startIndex) || splitsEmoji(c.endIndex)) return [];
    if (text !== c.text) return [];
    const ids = [
      ...new Set((Array.isArray(c.sourceIds) ? c.sourceIds : []).filter((id) => sourceIds.has(id))),
    ];
    return ids.length ? [{ ...c, text, sourceIds: ids }] : [];
  });
  return { sources, citations };
}
export function selectCareerRole(requested, candidate, employer) {
  return requested === "employer" || requested === "candidate"
    ? requested
    : !candidate && employer
      ? "employer"
      : "candidate";
}
export function suggestionsDocument(html) {
  // The Google-supplied fragment is kept intact, apart from the surrounding isolation document.
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline' https:; img-src https: data:; font-src https: data:; connect-src 'none'; frame-src 'none'; form-action 'none'"><base target="_blank"></head><body>${html}</body></html>`;
}
