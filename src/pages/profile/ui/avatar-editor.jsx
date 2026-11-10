import { useEffect, useState } from "react";
import { mediaUrl } from "@/shared/lib/media-url";
import { Camera, Upload, Trash2, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { useToast } from "@/shared/ui/toast-context";
import { profileApi } from "../api/profile";

export function AvatarEditor({ avatarUrl, onSaved, disabled }) {
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);
  function close(value) {
    if (busy) return;
    setOpen(value);
    setFile(null);
    setPreview(null);
  }
  function choose(event) {
    const next = event.target.files[0];
    event.target.value = "";
    if (!next) return;
    if (!["image/png", "image/jpeg"].includes(next.type) || next.size > 2 * 1024 * 1024) {
      notify("Chọn ảnh PNG hoặc JPG tối đa 2 MB.", { type: "error" });
      return;
    }
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }
  async function save(remove = false) {
    if (busy || (!remove && !file)) return;
    setBusy(true);
    try {
      if (!remove) {
        try {
          const bitmap = await createImageBitmap(file);
          bitmap.close();
        } catch {
          throw new Error("Ảnh không hợp lệ hoặc bị hỏng. Vui lòng chọn ảnh khác.");
        }
      }
      onSaved(await (remove ? profileApi.removeAvatar() : profileApi.avatar(file)));
      notify(remove ? "Đã xóa ảnh đại diện." : "Đã cập nhật ảnh đại diện.");
      setOpen(false);
      setFile(null);
      setPreview(null);
    } catch (failure) {
      notify(failure.message || "Không thể cập nhật ảnh đại diện.", { type: "error" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="avatar-edit-button"
        type="button"
        aria-label="Chỉnh sửa ảnh đại diện"
        disabled={disabled}
        onClick={() => close(true)}
      >
        <Camera />
      </button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="avatar-dialog">
          <DialogTitle>Chỉnh sửa ảnh đại diện</DialogTitle>
          <DialogDescription>
            Chọn ảnh PNG hoặc JPG tối đa 2 MB. Ảnh được hiển thị trên hồ sơ của bạn.
          </DialogDescription>
          <div className={`avatar-preview${preview || avatarUrl ? "" : " avatar-preview-default"}`}>
            {preview || avatarUrl ? (
              <img src={preview || mediaUrl(avatarUrl)} alt="Xem trước ảnh đại diện" />
            ) : (
              <UserRound aria-label="Ảnh đại diện mặc định" />
            )}
          </div>
          <label className="wide-button upload-label">
            <Upload />
            Chọn ảnh đại diện
            <input
              aria-label="Chọn ảnh đại diện"
              disabled={busy}
              type="file"
              accept="image/png,image/jpeg"
              onChange={choose}
            />
          </label>
          <div className="editor-actions">
            {avatarUrl && (
              <button className="delete-button" disabled={busy} onClick={() => save(true)}>
                <Trash2 />
                Xóa ảnh
              </button>
            )}
            <button disabled={busy} onClick={() => close(false)}>
              Hủy
            </button>
            <button className="primary" disabled={busy || !file} onClick={() => save()}>
              {busy ? "Đang lưu…" : "Lưu ảnh"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
