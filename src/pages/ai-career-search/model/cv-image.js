export const MAX_CV_IMAGE_BYTES = 5 * 1024 * 1024;

export function readCvImage(file, signal) {
  if (
    !file ||
    !["image/png", "image/jpeg"].includes(file.type) ||
    file.size === 0 ||
    file.size > MAX_CV_IMAGE_BYTES
  )
    return Promise.reject(new Error("Chọn ảnh JPG/PNG, tối đa 5 MB."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => reader.abort();
    const cleanup = () => signal?.removeEventListener("abort", abort);
    reader.onload = () => {
      cleanup();
      if (signal?.aborted) return reject(new DOMException("Đã hủy", "AbortError"));
      const preview = String(reader.result);
      const data = preview.split(",")[1];
      if (!data) return reject(new Error("Không đọc được ảnh CV."));
      resolve({ name: file.name, mimeType: file.type, data, preview });
    };
    reader.onerror = () => {
      cleanup();
      reject(new Error("Không đọc được ảnh CV. Vui lòng chọn lại."));
    };
    reader.onabort = () => {
      cleanup();
      reject(new DOMException("Đã hủy", "AbortError"));
    };
    if (signal?.aborted) return reject(new DOMException("Đã hủy", "AbortError"));
    signal?.addEventListener("abort", abort, { once: true });
    reader.readAsDataURL(file);
  });
}
