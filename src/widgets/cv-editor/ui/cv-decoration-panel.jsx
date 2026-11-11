import { useLayoutEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cvImageUrl } from "@/entities/cv";
import { Select } from "@/shared/ui/select";

export function CvDecorationPanel({
  document: doc,
  onChange,
  uploadImage,
  deleteImage,
  selected,
  onSelect,
  onBusyChange,
  readOnly,
}) {
  const input = useRef(null);
  const latest = useRef(doc);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // Keep async upload/delete results from overwriting edits made while the request was running.
  function currentDocument() {
    return latest.current;
  }
  useLayoutEffect(() => {
    latest.current = doc;
  }, [doc]);
  const images = doc.decorationImages || [];
  const image = images.find((item) => item.id === selected);
  function patch(change) {
    onChange({
      ...doc,
      decorationImages: images.map((item) =>
        item.id === selected ? { ...item, ...change } : item,
      ),
    });
  }
  function busy(value) {
    setPending(value);
    onBusyChange?.(value);
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || pending) return;
    setError("");
    setMessage("");
    if (
      !/\.(png|jpe?g|webp)$/i.test(file.name) ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type)
    ) {
      setError("Chọn ảnh PNG, JPG/JPEG hoặc WebP.");
      return;
    }
    if (!file.size || file.size > 2 * 1024 * 1024) {
      setError("Mỗi ảnh trang trí tối đa 2 MB.");
      return;
    }
    if (images.length >= 5) {
      setError("Mỗi CV có tối đa 5 ảnh trang trí.");
      return;
    }
    busy(true);
    try {
      // Decode before uploading so corrupt images are reported clearly at the file picker.
      const bitmap = await createImageBitmap(file);
      bitmap.close();
      const added = await uploadImage(file, images.length);
      const current = currentDocument();
      onChange({ ...current, decorationImages: [...(current.decorationImages || []), added] });
      onSelect(added.id);
      setMessage("Đã thêm ảnh. Kéo ảnh hoặc tay nắm trên trang để bố trí.");
    } catch (reason) {
      setError(reason.message || "Không đọc được ảnh. Vui lòng chọn ảnh khác.");
    } finally {
      busy(false);
    }
  }
  async function remove(id) {
    if (pending) return;
    busy(true);
    setError("");
    setMessage("");
    try {
      await deleteImage(id);
      const current = currentDocument();
      onChange({
        ...current,
        decorationImages: (current.decorationImages || []).filter((item) => item.id !== id),
      });
      if (selected === id) onSelect(null);
      setMessage("Đã gỡ ảnh khỏi bản đang chỉnh sửa. Lưu CV để cập nhật các bản xem trước.");
    } catch (reason) {
      setError(reason.message);
    } finally {
      busy(false);
    }
  }
  return (
    <div className="cv-decoration-panel">
      <h3>ẢNH TRANG TRÍ ({images.length}/5)</h3>
      <p className="cv-panel-hint">
        PNG, JPG/JPEG, WebP · tối đa 2 MB/ảnh. PNG giữ nền trong suốt.
      </p>
      <input
        ref={input}
        type="file"
        hidden
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={upload}
      />
      <button
        type="button"
        className="cv-add-section"
        disabled={readOnly || pending || images.length >= 5 || !uploadImage}
        onClick={() => input.current.click()}
      >
        <Plus />
        {pending ? "Đang xử lý ảnh…" : "Thêm ảnh"}
      </button>
      {!images.length && (
        <p className="cv-panel-hint">
          Thêm họa tiết hoặc logo, sau đó chọn ảnh để kéo di chuyển và đổi kích thước trên trang CV.
        </p>
      )}
      <div className="cv-decoration-list">
        {images.map((item, index) => (
          <div key={item.id}>
            <button
              type="button"
              aria-pressed={selected === item.id}
              disabled={pending}
              onClick={() => onSelect(item.id)}
            >
              <img src={cvImageUrl(item.url)} alt="" />
              Ảnh {index + 1} · Trang {item.page}
            </button>
            {!readOnly && (
              <button
                type="button"
                disabled={pending}
                aria-label={`Xóa ảnh trang trí ${index + 1}`}
                onClick={() => remove(item.id)}
              >
                <Trash2 />
              </button>
            )}
          </div>
        ))}
      </div>
      {image && (
        <fieldset disabled={readOnly || pending}>
          <label>
            Độ mờ <strong>{Math.round(image.opacity * 100)}%</strong>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={image.opacity}
              onChange={(e) => patch({ opacity: Number(e.target.value) })}
            />
          </label>
          <label>
            Vị trí lớp ảnh
            <Select
              value={image.zIndex < 0 ? "back" : "front"}
              onChange={(e) => patch({ zIndex: e.target.value === "back" ? -1 : 1 })}
            >
              <option value="back">Phía sau nội dung</option>
              <option value="front">Phía trước nội dung</option>
            </Select>
          </label>
          <label>
            Trang CV (1–100)
            <input
              type="number"
              min="1"
              max="100"
              value={image.page}
              onChange={(e) => {
                const page = Number(e.target.value);
                if (Number.isInteger(page) && page >= 1 && page <= 100) patch({ page });
              }}
            />
          </label>
          <label>
            Chiều rộng (mm, giữ tỷ lệ)
            <input
              type="number"
              min="1"
              step="0.5"
              max={Math.floor(
                Math.min(210 - image.x, ((297 - image.y) * image.width) / image.height),
              )}
              value={Number(image.width.toFixed(1))}
              onChange={(e) => {
                const width = Number(e.target.value);
                const height = (width * image.height) / image.width;
                if (width >= 1 && width + image.x <= 210 && height + image.y <= 297)
                  patch({ width, height });
              }}
            />
          </label>
          <p className="cv-panel-hint">
            Dùng phím mũi tên khi chọn ảnh để di chuyển 1 mm; giữ Shift để di chuyển 5 mm. Đổi trang
            ở trên để chuyển ảnh sang trang khác.
          </p>
        </fieldset>
      )}
      {pending && (
        <p role="status" className="cv-panel-hint">
          Đang xử lý ảnh…
        </p>
      )}
      {message && (
        <p role="status" className="cv-panel-hint">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="cv-error">
          {error}
        </p>
      )}
    </div>
  );
}
