import { useRef, useState } from "react";
import { RecruitmentContent } from "@/shared/ui/recruitment-content";
export function MarkdownEditor({ label, value, onChange }) {
  const [preview, setPreview] = useState(false);
  const input = useRef(null);
  function insert(before, after = "") {
    const element = input.current;
    if (!element) return;
    const { selectionStart: start, selectionEnd: end } = element;
    onChange(value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end));
    setTimeout(() => {
      element.focus();
      element.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  }
  return (
    <div className="cp-markdown">
      <div className="cp-markdown-tabs">
        <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>
          Soạn thảo (Markdown)
        </button>
        <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>
          Xem trước định dạng
        </button>
      </div>
      <div className="cp-toolbar">
        {[
          ["B", "**", "**"],
          ["I", "*", "*"],
          ["U", "<u>", "</u>"],
          ["H2", "\n## "],
          ["H3", "\n### "],
          ["•", "\n- "],
          ["1.", "\n1. "],
          ["“", "\n> "],
          ["<>", "`", "`"],
        ].map(([text, before, after]) => (
          <button
            type="button"
            key={text}
            aria-label={`${label}: ${text}`}
            disabled={preview}
            onClick={() => insert(before, after)}
          >
            {text}
          </button>
        ))}
        <small>Markdown</small>
      </div>
      {preview ? (
        <div className="cp-markdown-preview" aria-label={`Xem trước ${label}`}>
          <RecruitmentContent content={value} />
        </div>
      ) : (
        <textarea
          ref={input}
          aria-label={label}
          maxLength={10000}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
