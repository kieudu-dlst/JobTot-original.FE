import { useRef, useState } from "react";
import { ArticleBody } from "@/shared/ui/article-body";
import "./markdown-editor.css";

const formats = [
  ["Tiêu đề", "## ", "", "Tiêu đề mục", true],
  ["Đậm", "**", "**", "Chữ đậm"],
  ["Nghiêng", "*", "*", "Chữ nghiêng"],
  ["Danh sách", "- ", "", "Nội dung", true],
  ["Đánh số", "1. ", "", "Nội dung", true],
  ["Trích dẫn", "> ", "", "Trích dẫn", true],
  ["Liên kết", "[", "](https://example.com)", "Tên liên kết"],
  ["Ảnh", "![", "](https://example.com/image.jpg)", "Mô tả ảnh"],
  ["Bảng", "", "", "| Cột 1 | Cột 2 |\n| --- | --- |\n| Nội dung | Nội dung |", true],
];

export function MarkdownEditor({ value, onChange, required, disabled }) {
  const input = useRef(null);
  const [mode, setMode] = useState("split");
  const [help, setHelp] = useState(false);
  function insert(prefix, suffix, placeholder, block) {
    const element = input.current;
    const start = element?.selectionStart ?? value.length;
    const end = element?.selectionEnd ?? start;
    const selected = value.slice(start, end) || placeholder;
    const before = block && start && value[start - 1] !== "\n" ? "\n" : "";
    const after = block && end < value.length && value[end] !== "\n" ? "\n" : "";
    const text = before + prefix + selected + suffix + after;
    if (value.length - (end - start) + text.length > 20000) return;
    onChange(value.slice(0, start) + text + value.slice(end));
    setMode((current) => (current === "preview" ? "split" : current));
    requestAnimationFrame(() => {
      input.current?.focus();
      input.current?.setSelectionRange(
        start + before.length + prefix.length,
        start + before.length + prefix.length + selected.length,
      );
    });
  }
  return (
    <section className="markdown-editor" aria-label="Trình soạn Markdown">
      <div className="markdown-top">
        <strong>Nội dung bài viết</strong>
        <div>
          {[
            ["write", "Soạn nội dung"],
            ["split", "Soạn & xem trước"],
            ["preview", "Xem trước"],
          ].map(([key, title]) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
            >
              {title}
            </button>
          ))}
        </div>
      </div>
      <div className="markdown-toolbar" aria-label="Định dạng Markdown">
        {formats.map(([title, ...args]) => (
          <button type="button" key={title} disabled={disabled} onClick={() => insert(...args)}>
            {title}
          </button>
        ))}
        <button type="button" aria-expanded={help} onClick={() => setHelp(!help)}>
          Hướng dẫn
        </button>
      </div>
      {help && (
        <p className="markdown-help">
          Bôi đen nội dung rồi chọn định dạng. Dùng Ctrl+B để in đậm, Ctrl+I để in nghiêng. Thay URL
          mẫu sau khi chèn liên kết hoặc ảnh. Dòng trống tách các đoạn văn; dùng ## cho tiêu đề mục.
        </p>
      )}
      <div className={`markdown-panels markdown-${mode}`}>
        {mode !== "preview" && (
          <label className="markdown-source">
            Nội dung
            <textarea
              ref={input}
              aria-label="Nội dung"
              required={required}
              disabled={disabled}
              maxLength={20000}
              rows={18}
              value={value}
              placeholder="Viết bài tại đây hoặc dùng các nút định dạng phía trên…"
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (
                  (event.ctrlKey || event.metaKey) &&
                  ["b", "i"].includes(event.key.toLowerCase())
                ) {
                  event.preventDefault();
                  const marker = event.key.toLowerCase() === "b" ? "**" : "*";
                  insert(marker, marker, "Nội dung");
                }
              }}
            />
          </label>
        )}
        {mode !== "write" && (
          <div className="markdown-preview">
            <span>Bản xem trước</span>
            {value ? (
              <ArticleBody content={value} />
            ) : (
              <p className="article-hint">Nội dung sẽ hiển thị tại đây khi bạn bắt đầu viết.</p>
            )}
          </div>
        )}
      </div>
      <div className="markdown-bottom">
        <span>Markdown · Xem trước cập nhật khi viết</span>
        <span>{value.length.toLocaleString("vi-VN")} / 20.000 ký tự</span>
      </div>
    </section>
  );
}
