import { useRef, useState } from "react";
function inline(text) {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    .map((part, index) =>
      part.startsWith("**") ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : part.startsWith("*") ? (
        <em key={index}>{part.slice(1, -1)}</em>
      ) : part.startsWith("`") ? (
        <code key={index}>{part.slice(1, -1)}</code>
      ) : (
        part
      ),
    );
}
function Preview({ value }) {
  return value
    .split("\n")
    .map((line, index) =>
      line.startsWith("### ") ? (
        <h4 key={index}>{inline(line.slice(4))}</h4>
      ) : line.startsWith("## ") ? (
        <h3 key={index}>{inline(line.slice(3))}</h3>
      ) : line.startsWith("- ") ? (
        <p key={index}>• {inline(line.slice(2))}</p>
      ) : line.startsWith("> ") ? (
        <blockquote key={index}>{inline(line.slice(2))}</blockquote>
      ) : (
        <p key={index}>{inline(line || "\u00a0")}</p>
      ),
    );
}
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
          <Preview value={value} />
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
