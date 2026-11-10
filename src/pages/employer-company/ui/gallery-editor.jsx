import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { mediaUrl } from "@/shared/lib/media-url";

export function GalleryEditor({ urls, busy, error, onUpload, onRemove, onClose }) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogTitle>Thư viện ảnh doanh nghiệp</DialogTitle>
        <DialogDescription>
          Chọn ảnh PNG hoặc JPG tối đa 5 MB mỗi ảnh, tối đa 12 ảnh. Thêm và xóa ảnh được lưu ngay
          vào hồ sơ.
        </DialogDescription>
        {error && (
          <p role="alert" className="ec-error">
            {error}
          </p>
        )}
        <div className="ec-gallery-upload">
          {urls.map((url, index) => (
            <div key={url + index}>
              <img src={mediaUrl(url)} alt={`Ảnh doanh nghiệp ${index + 1}`} />
              <button
                type="button"
                className="ec-outline"
                disabled={busy}
                onClick={() => onRemove(index)}
              >
                Xóa ảnh {index + 1}
              </button>
            </div>
          ))}
        </div>
        {!urls.length && <p>Chưa có ảnh. Chọn ảnh từ máy để thêm vào thư viện.</p>}
        <div className="ec-editor-actions">
          <button type="button" className="ec-outline" disabled={busy} onClick={onClose}>
            Đóng
          </button>
          <button
            type="button"
            className="ec-primary"
            disabled={busy || urls.length >= 12}
            onClick={onUpload}
          >
            {busy ? "Đang xử lý…" : "Chọn ảnh từ máy"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
