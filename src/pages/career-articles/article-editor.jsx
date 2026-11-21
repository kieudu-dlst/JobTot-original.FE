import { useEffect, useId, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import {
  Bold,
  CircleHelp,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Underline,
  Undo2,
  Redo2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Tooltip, Popover } from "radix-ui";
import { Select } from "@/shared/ui/select";
import { ArticleBody } from "@/shared/ui/article-body";
import {
  ARTICLE_MAX_LENGTH,
  articleHtml,
  serializeArticle,
  hasArticleContent,
} from "@/shared/lib/article-content";
import { createArticleExtensions, moveTableAt, selectedTablePosition } from "./editor-extensions";
import { TablePicker } from "./table-picker";
import "./markdown-editor.css";

function ToolButton({ label, icon: Icon, ...props }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button type="button" className="markdown-tool-button" aria-label={label} {...props}>
          <Icon aria-hidden="true" focusable="false" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="markdown-tool-tooltip" sideOffset={6} collisionPadding={12}>
          {label}
          <Tooltip.Arrow className="markdown-tool-tooltip-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function InsertMedia({ editor, disabled, kind }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState("");
  const inserted = useRef(false);
  const image = kind === "image";
  const label = image ? "Chèn ảnh" : "Liên kết";
  function insert() {
    const valid = image
      ? /^(https?:\/\/|\/(?!\/))/i.test(url.trim())
      : /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(url.trim());
    if (!valid) {
      setError("Nhập địa chỉ http(s) hợp lệ hoặc đường dẫn trong trang.");
      return;
    }
    if (image) editor.chain().focus().setImage({ src: url.trim(), alt }).run();
    else if (editor.state.selection.empty)
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: alt || url.trim(),
          marks: [{ type: "link", attrs: { href: url.trim() } }],
        })
        .run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
    inserted.current = true;
    setOpen(false);
  }
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setError("");
        if (next) {
          setUrl(image ? "" : editor.getAttributes("link").href || "");
          setAlt("");
        }
      }}
    >
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Popover.Trigger
            type="button"
            className="markdown-tool-button"
            disabled={disabled}
            aria-label={label}
          >
            {image ? <Image aria-hidden="true" /> : <Link2 aria-hidden="true" />}
          </Popover.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="markdown-tool-tooltip" sideOffset={6}>
            {label}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Popover.Portal>
        <Popover.Content
          className="article-media-picker"
          sideOffset={6}
          collisionPadding={12}
          aria-label={label}
          onCloseAutoFocus={(event) => {
            if (inserted.current) {
              event.preventDefault();
              inserted.current = false;
            }
          }}
        >
          <strong>{label}</strong>
          <label>
            Địa chỉ
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  insert();
                }
              }}
            />
          </label>
          <label>
            {image ? "Mô tả ảnh" : "Nội dung liên kết (nếu chưa chọn chữ)"}
            <input value={alt} onChange={(event) => setAlt(event.target.value)} />
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="button" className="article-insert-table" onClick={insert}>
            Chèn
          </button>
          {!image && (
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                inserted.current = true;
                setOpen(false);
              }}
            >
              Bỏ liên kết
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function ArticleEditor({ value, onChange, required, disabled }) {
  const [mode, setMode] = useState("write");
  const [help, setHelp] = useState(false);
  const helpId = useId();
  const lastValue = useRef(value);
  const extensions = useMemo(() => createArticleExtensions(), []);
  const [initialContent] = useState(() => articleHtml(value));
  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "article-body article-rich-editor",
        role: "textbox",
        "aria-label": "Nội dung bài viết",
        "aria-multiline": "true",
        "aria-required": String(Boolean(required)),
      },
    },
    onUpdate: ({ editor: current }) => {
      const serialized = serializeArticle(current.getHTML());
      const next = hasArticleContent(serialized) ? serialized : "";
      lastValue.current = next;
      onChange(next);
    },
  });
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);
  useEffect(() => {
    if (editor && value !== lastValue.current) {
      editor.commands.setContent(articleHtml(value), { emitUpdate: false });
      lastValue.current = value;
    }
  }, [editor, value]);
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            bold: current.isActive("bold"),
            italic: current.isActive("italic"),
            underline: current.isActive("underline"),
            bulletList: current.isActive("bulletList"),
            orderedList: current.isActive("orderedList"),
            blockquote: current.isActive("blockquote"),
            heading: current.isActive("heading")
              ? String(current.getAttributes("heading").level)
              : "paragraph",
            table: selectedTablePosition(current) !== null,
            undo: current.can().undo(),
            redo: current.can().redo(),
          }
        : null,
  });
  const locked = disabled || !editor || mode === "preview";
  const format = (command) => editor?.chain().focus()[command]().run();
  function moveTable(direction) {
    const pos = selectedTablePosition(editor);
    if (pos !== null) moveTableAt(editor.view, pos, direction);
  }
  return (
    <section className="markdown-editor" aria-label="Trình soạn bài trực quan">
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
      <Tooltip.Provider delayDuration={300}>
        <div className="markdown-toolbar" role="group" aria-label="Định dạng nội dung">
          <div className="markdown-toolbar-group" role="group" aria-label="Kiểu đoạn và chữ">
            <Select
              aria-label="Kiểu đoạn"
              value={state?.heading || "paragraph"}
              disabled={locked}
              density="compact"
              onChange={(event) =>
                event.target.value === "paragraph"
                  ? editor.chain().focus().setParagraph().run()
                  : editor
                      .chain()
                      .focus()
                      .setHeading({ level: Number(event.target.value) })
                      .run()
              }
            >
              <option value="paragraph">Văn bản thường</option>
              {[2, 3, 4, 5, 6].map((level) => (
                <option key={level} value={level}>
                  H{level} – Tiêu đề {level}
                </option>
              ))}
            </Select>
            <ToolButton
              label="Đậm"
              icon={Bold}
              disabled={locked}
              aria-pressed={!!state?.bold}
              onClick={() => format("toggleBold")}
            />
            <ToolButton
              label="Nghiêng"
              icon={Italic}
              disabled={locked}
              aria-pressed={!!state?.italic}
              onClick={() => format("toggleItalic")}
            />
            <ToolButton
              label="Gạch chân"
              icon={Underline}
              disabled={locked}
              aria-pressed={!!state?.underline}
              onClick={() => format("toggleUnderline")}
            />
          </div>
          <div className="markdown-toolbar-group" role="group" aria-label="Danh sách và trích dẫn">
            {[
              ["Danh sách dấu chấm", List, "bulletList", "toggleBulletList"],
              ["Đánh số", ListOrdered, "orderedList", "toggleOrderedList"],
              ["Trích dẫn", Quote, "blockquote", "toggleBlockquote"],
            ].map(([label, Icon, active, command]) => (
              <ToolButton
                key={label}
                label={label}
                icon={Icon}
                disabled={locked}
                aria-pressed={!!state?.[active]}
                onClick={() => format(command)}
              />
            ))}
          </div>
          <div className="markdown-toolbar-group" role="group" aria-label="Chèn nội dung">
            <InsertMedia editor={editor} disabled={locked} kind="link" />
            <InsertMedia editor={editor} disabled={locked} kind="image" />
            <TablePicker
              disabled={locked}
              onInsert={(rows, cols) =>
                editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
              }
            />
          </div>
          <div className="markdown-toolbar-group" role="group" aria-label="Lịch sử và trợ giúp">
            <ToolButton
              label="Hoàn tác"
              icon={Undo2}
              disabled={locked || !state?.undo}
              onClick={() => format("undo")}
            />
            <ToolButton
              label="Làm lại"
              icon={Redo2}
              disabled={locked || !state?.redo}
              onClick={() => format("redo")}
            />
            <ToolButton
              label="Hướng dẫn"
              icon={CircleHelp}
              aria-expanded={help}
              aria-controls={help ? helpId : undefined}
              onClick={() => setHelp(!help)}
            />
          </div>
        </div>
        {state?.table && mode !== "preview" && (
          <div className="article-table-actions" role="group" aria-label="Chỉnh sửa bảng">
            {[
              ["Thêm hàng trước", "addRowBefore"],
              ["Thêm hàng sau", "addRowAfter"],
              ["Xóa hàng", "deleteRow"],
              ["Thêm cột trước", "addColumnBefore"],
              ["Thêm cột sau", "addColumnAfter"],
              ["Xóa cột", "deleteColumn"],
              ["Xóa bảng", "deleteTable"],
            ].map(([label, command]) => (
              <button type="button" key={command} disabled={locked} onClick={() => format(command)}>
                {label}
              </button>
            ))}
            <ToolButton
              label="Di chuyển bảng lên"
              icon={ArrowUp}
              disabled={locked}
              onClick={() => moveTable(-1)}
            />
            <ToolButton
              label="Di chuyển bảng xuống"
              icon={ArrowDown}
              disabled={locked}
              onClick={() => moveTable(1)}
            />
          </div>
        )}
      </Tooltip.Provider>
      {help && (
        <p id={helpId} className="markdown-help">
          Bôi đen chữ để định dạng. Ctrl+B: đậm; Ctrl+I: nghiêng; Ctrl+U: gạch chân. Chọn kích thước
          trên lưới để chèn bảng. Trong bảng, dùng Tab / Shift+Tab để chuyển ô; kéo đường phân cách
          để đổi độ rộng cột. Kéo tay nắm ⠿ để di chuyển bảng giữa các đoạn, hoặc dùng Alt+↑ / Alt+↓
          trên tay nắm.
        </p>
      )}
      <div className={`markdown-panels article-mode-${mode}`}>
        <div className="article-compose-pane" hidden={mode === "preview"}>
          <span className="article-pane-label">Vùng soạn thảo</span>
          <EditorContent editor={editor} />
        </div>
        {mode !== "write" && (
          <div className="markdown-preview">
            <span>Bản xem trước</span>
            <ArticleBody content={value} />
          </div>
        )}
      </div>
      {value.length > ARTICLE_MAX_LENGTH && (
        <p role="alert" className="article-content-error">
          Nội dung vượt giới hạn lưu. Hãy rút gọn bài hoặc giảm số ô bảng trước khi lưu.
        </p>
      )}
      {required && !hasArticleContent(value) && (
        <p className="article-hint">Nhập nội dung trước khi xuất bản.</p>
      )}
      <div className="markdown-bottom">
        <span>Soạn trực quan · Tự cập nhật bản xem trước</span>
        <span>{editor?.getText().length.toLocaleString("vi-VN") || 0} ký tự</span>
      </div>
    </section>
  );
}
