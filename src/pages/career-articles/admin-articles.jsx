import { Select } from "@/shared/ui/select";
import { mediaUrl } from "@/shared/lib/media-url";
import { formatDate } from "@/shared/lib/date-format";
import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { AdminLayout } from "@/widgets/admin-layout";
import { adminRequest, adminJson } from "@/shared/api/admin-session";
import { useToast } from "@/shared/ui/toast-context";
import { MarkdownEditor } from "./markdown-editor";
import "./articles.css";

const empty = { title: "", category: "Cẩm nang", summary: "", content: "", published: false };
export function AdminArticlesPage() {
  return <AdminLayout>{({ onExpired }) => <Editor onExpired={onExpired} />}</AdminLayout>;
}
function Editor({ onExpired }) {
  const notify = useToast();
  const [articles, setArticles] = useState(null),
    [draft, setDraft] = useState(null),
    [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0),
    [busy, setBusy] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  useEffect(() => {
    if (!coverFile) return;
    const url = URL.createObjectURL(coverFile);
    const timer = setTimeout(() => setCoverPreview(url), 0);
    return () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    };
  }, [coverFile]);
  const [saved, setSaved] = useState(""),
    [discard, setDiscard] = useState(false);
  const dirty = !!draft && (JSON.stringify(draft) !== saved || !!coverFile);
  const blocker = useBlocker(dirty);
  const choose = (value) => {
    setCoverFile(null);
    setCoverPreview(null);
    setDraft(value);
    setSaved(JSON.stringify(value));
  };
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await adminRequest("career-articles", { signal: controller.signal });
        if (!controller.signal.aborted) {
          setArticles(data);
          setError("");
        }
      } catch (failure) {
        if (!controller.signal.aborted) {
          if ([401, 403].includes(failure.status)) onExpired();
          else setError(failure.message);
        }
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [attempt, onExpired]);
  const patch = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    let persisted;
    try {
      let result = await adminRequest(`career-articles${draft.id ? `/${draft.id}` : ""}`, {
        method: draft.id ? "PUT" : "POST",
        ...adminJson(draft),
      });
      persisted = result;
      if (coverFile) {
        const form = new FormData();
        form.append("file", coverFile);
        form.append("version", result.version);
        result = await adminRequest(`career-articles/${result.id}/cover`, {
          method: "POST",
          body: form,
        });
      }
      choose(result);
      setAttempt((value) => value + 1);
      notify(result.published ? "Đã xuất bản bài viết." : "Đã lưu bản nháp.");
    } catch (failure) {
      if (persisted) {
        setDraft(persisted);
        setSaved(JSON.stringify(persisted));
      }
      if ([401, 403].includes(failure.status)) onExpired();
      else {
        setError(failure.message);
        notify(failure.message, { type: "error" });
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="articles-admin">
      <title>Quản lý cẩm nang | Job Tốt Admin</title>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">NỘI DUNG NGHỀ NGHIỆP</span>
          <h1>Cẩm nang & Báo cáo</h1>
          <p>Soạn bài viết và xuất bản trên trang ứng viên.</p>
        </div>
        {!draft && (
          <button className="admin-primary" onClick={() => choose({ ...empty })}>
            Viết bài mới
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="admin-notice error">
          {error}
          <button onClick={() => setAttempt((value) => value + 1)}>Tải lại danh sách</button>
        </p>
      )}
      {draft ? (
        <form onSubmit={save} className="article-editor">
          <fieldset disabled={busy}>
            <label>
              Tiêu đề
              <input
                required
                maxLength={200}
                value={draft.title}
                onChange={(event) => patch("title", event.target.value)}
              />
            </label>
            <label>
              Danh mục
              <input
                required
                maxLength={100}
                value={draft.category}
                onChange={(event) => patch("category", event.target.value)}
              />
            </label>
            <label>
              Mô tả ngắn
              <textarea
                required={draft.published}
                maxLength={600}
                rows={3}
                value={draft.summary}
                onChange={(event) => patch("summary", event.target.value)}
              />
            </label>
            <label>
              Trạng thái
              <Select
                value={draft.published ? "published" : "draft"}
                onChange={(event) => patch("published", event.target.value === "published")}
              >
                <option value="draft">Bản nháp / Ẩn bài</option>
                <option value="published">Xuất bản</option>
              </Select>
            </label>
            <div className="article-cover-editor">
              <label>
                Ảnh bìa
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (
                      file.size > 5 * 1024 * 1024 ||
                      !["image/png", "image/jpeg"].includes(file.type)
                    ) {
                      setError("Chọn ảnh PNG hoặc JPEG, tối đa 5 MB.");
                      event.target.value = "";
                      return;
                    }
                    setError("");
                    setCoverFile(file);
                  }}
                />
              </label>
              <p className="article-hint">
                PNG hoặc JPEG, tối đa 5 MB. Ảnh bìa được lưu cùng bài viết khi bấm Lưu.
              </p>
              {(coverFile ? coverPreview : draft.coverUrl) && (
                <img
                  src={coverFile ? coverPreview : mediaUrl(draft.coverUrl)}
                  alt="Xem trước ảnh bìa"
                />
              )}
              {coverFile && (
                <button
                  type="button"
                  className="admin-secondary"
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPreview(null);
                  }}
                >
                  Bỏ ảnh vừa chọn
                </button>
              )}
            </div>
            <MarkdownEditor
              value={draft.content}
              onChange={(value) => patch("content", value)}
              required={draft.published}
              disabled={busy}
            />
            <button className="admin-primary">{busy ? "Đang lưu…" : "Lưu bài viết"}</button>
            <p className="article-hint">
              Lưu trước khi quay lại danh sách. Bài nháp chỉ hiển thị trong admin.
            </p>
            <button
              type="button"
              className="admin-secondary"
              onClick={() => (dirty ? setDiscard(true) : setDraft(null))}
            >
              Về danh sách
            </button>
          </fieldset>
        </form>
      ) : !articles ? (
        <p role="status">Đang tải bài viết…</p>
      ) : (
        <div className="article-admin-list">
          {articles.map((article) => (
            <article key={article.id}>
              <div>
                <span className={`admin-badge ${article.published ? "active" : "pending"}`}>
                  {article.published ? "Đã xuất bản" : "Bản nháp"}
                </span>
                <h2>{article.title}</h2>
                <p>
                  {article.category} · {formatDate(article.updatedAt)}
                </p>
              </div>
              <button className="admin-secondary" onClick={() => choose({ ...article })}>
                Chỉnh sửa
              </button>
            </article>
          ))}
          {!articles.length && <p>Chưa có bài viết. Chọn “Viết bài mới” để bắt đầu.</p>}
        </div>
      )}
      <Dialog
        open={discard || blocker.state === "blocked"}
        onOpenChange={(open) => {
          if (!open) {
            setDiscard(false);
            if (blocker.state === "blocked") blocker.reset();
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Có nội dung chưa lưu</DialogTitle>
          <DialogDescription>Rời trang sẽ bỏ các thay đổi chưa lưu của bài viết.</DialogDescription>
          <button
            className="admin-primary"
            onClick={() => {
              setDiscard(false);
              if (blocker.state === "blocked") blocker.reset();
            }}
          >
            Tiếp tục viết
          </button>
          <button
            className="admin-secondary"
            onClick={() => {
              setDiscard(false);
              setDraft(null);
              if (blocker.state === "blocked") blocker.proceed();
            }}
          >
            Bỏ thay đổi
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
