import { Select } from "@/shared/ui/select";
import { useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Bold,
  Italic,
  Underline,
  List,
  LayoutTemplate,
  Palette,
  ListTree,
} from "lucide-react";
import { CvSheet } from "@/entities/cv";
import "./cv-editor.css";

const layouts = [
  ["one-column", "1 Cột (Harvard ATS)"],
  ["two-column", "2 Cột Cân Bằng"],
  ["sidebar", "Modern Sidebar"],
  ["bento", "Bento Pro"],
];
const colors = ["#ff5722", "#243044", "#2845bd", "#009879", "#8a42ed"];
export function CvEditor({ document: doc, onChange, children, readOnly = false }) {
  const [tab, setTab] = useState("layout");
  const [selected, setSelected] = useState(doc.sections[0]?.id);
  const [preview, setPreview] = useState(false);
  const [imageError, setImageError] = useState("");
  async function avatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 200 * 1024) {
      setImageError("Chọn ảnh PNG/JPG tối đa 200 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageError("");
      onChange({ ...doc, avatarDataUri: String(reader.result) });
    };
    reader.onerror = () => setImageError("Không đọc được ảnh. Vui lòng thử lại.");
    reader.readAsDataURL(file);
  }
  function patch(change) {
    onChange({ ...doc, ...change });
  }
  function sectionPatch(id, change) {
    patch({
      sections: doc.sections.map((item) => (item.id === id ? { ...item, ...change } : item)),
    });
  }
  function move(index, delta) {
    const sections = [...doc.sections];
    [sections[index], sections[index + delta]] = [sections[index + delta], sections[index]];
    patch({ sections });
  }
  const section = doc.sections.find((item) => item.id === selected);
  return (
    <div className="cv-editor">
      <aside className="cv-editor-panel">
        <div className="cv-editor-tabs">
          {[
            ["layout", LayoutTemplate, "Bố cục"],
            ["style", Palette, "Màu & Font"],
            ["sections", ListTree, "Mục CV"],
          ].map(([key, Icon, label]) => (
            <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>
              <Icon />
              {label}
            </button>
          ))}
        </div>
        <fieldset disabled={readOnly}>
          {tab === "layout" && (
            <>
              <h3>KIỂU BỐ CỤC CV</h3>
              <div className="cv-layout-picker">
                {layouts.map(([value, label]) => (
                  <button
                    key={value}
                    className={`cv-layout-choice cv-choice-${value}`}
                    aria-pressed={doc.layout === value}
                    onClick={() => patch({ layout: value })}
                  >
                    <span>
                      <i />
                      <i />
                      <i />
                    </span>
                    {label}
                  </button>
                ))}
              </div>
              <p className="cv-panel-hint">Chọn bố cục phù hợp với nội dung và vị trí ứng tuyển.</p>
            </>
          )}
          {tab === "style" && (
            <>
              <h3>MÀU CHỦ ĐẠO</h3>
              <div className="cv-color-picker">
                {colors.map((color) => (
                  <button
                    key={color}
                    style={{ background: color }}
                    aria-label={`Màu ${color}`}
                    aria-pressed={doc.color === color}
                    onClick={() => patch({ color })}
                  />
                ))}
                <input
                  type="color"
                  aria-label="Màu tùy chọn"
                  value={doc.color}
                  onChange={(event) => patch({ color: event.target.value })}
                />
              </div>
              <label>
                Phông chữ CV
                <Select value={doc.font} onChange={(event) => patch({ font: event.target.value })}>
                  {["Roboto", "Inter", "Arial", "Georgia"].map((font) => (
                    <option key={font}>{font}</option>
                  ))}
                </Select>
              </label>
              <label>
                Cỡ chữ nội dung <strong>{doc.fontSize} pt</strong>
                <input
                  type="range"
                  min="10"
                  max="14"
                  step="0.5"
                  value={doc.fontSize}
                  onChange={(event) => patch({ fontSize: Number(event.target.value) })}
                />
              </label>
              <label>Căn lề trang giấy</label>
              <div className="cv-margin-picker">
                {[10, 15, 20].map((margin) => (
                  <button
                    key={margin}
                    aria-pressed={doc.margin === margin}
                    onClick={() => patch({ margin })}
                  >
                    {margin} mm
                  </button>
                ))}
              </div>
            </>
          )}
          <h3>QUẢN LÝ THỨ TỰ MỤC CV</h3>
          <p className="cv-panel-hint">Dùng mũi tên để sắp xếp. Thông tin liên hệ luôn ở đầu CV.</p>
          <div className="cv-section-list">
            {doc.sections.map((item, index) => (
              <div key={item.id} className={selected === item.id ? "cv-section-active" : ""}>
                <button
                  className="cv-section-label"
                  onClick={() => {
                    setSelected(item.id);
                    setTab("sections");
                  }}
                >
                  {item.title}
                </button>
                <div>
                  <button
                    aria-label={`Đưa ${item.title} lên`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp />
                  </button>
                  <button
                    aria-label={`Đưa ${item.title} xuống`}
                    disabled={index === doc.sections.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown />
                  </button>
                  <button
                    aria-label={`${item.visible ? "Ẩn" : "Hiện"} ${item.title}`}
                    onClick={() => sectionPatch(item.id, { visible: !item.visible })}
                  >
                    {item.visible ? <Eye /> : <EyeOff />}
                  </button>
                  <button
                    aria-label={`Xóa mục ${item.title}`}
                    disabled={doc.sections.length === 1}
                    onClick={() =>
                      patch({ sections: doc.sections.filter((value) => value.id !== item.id) })
                    }
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            className="cv-add-section"
            disabled={doc.sections.length >= 20}
            onClick={() => {
              const id = crypto.randomUUID();
              patch({
                sections: [
                  ...doc.sections,
                  { id, title: "MỤC MỚI", body: "Nhập nội dung của bạn", visible: true },
                ],
              });
              setSelected(id);
            }}
          >
            <Plus /> Thêm mục (Dự án, Giải thưởng…)
          </button>
          <label>
            Ảnh chân dung
            <input type="file" accept="image/png,image/jpeg" onChange={avatar} />
          </label>
          {doc.avatarDataUri && (
            <button className="cv-add-section" onClick={() => patch({ avatarDataUri: null })}>
              Gỡ ảnh chân dung
            </button>
          )}
          {imageError && (
            <p role="alert" className="cv-panel-hint">
              {imageError}
            </p>
          )}
        </fieldset>
        {children}
      </aside>
      <div className="cv-editor-canvas">
        <div className="cv-format-toolbar">
          <button
            aria-label="In đậm nội dung mục"
            aria-pressed={!!section?.bold}
            disabled={!section || readOnly}
            onClick={() => sectionPatch(selected, { bold: !section.bold })}
          >
            <Bold />
          </button>
          <button
            aria-label="In nghiêng nội dung mục"
            aria-pressed={!!section?.italic}
            disabled={!section || readOnly}
            onClick={() => sectionPatch(selected, { italic: !section.italic })}
          >
            <Italic />
          </button>
          <button
            aria-label="Gạch chân nội dung mục"
            aria-pressed={!!section?.underline}
            disabled={!section || readOnly}
            onClick={() => sectionPatch(selected, { underline: !section.underline })}
          >
            <Underline />
          </button>
          <button
            aria-label="Bật tắt danh sách gạch đầu dòng"
            disabled={!section || readOnly}
            onClick={() => {
              const lines = section.body.split("\n");
              const bulleted = lines.filter(Boolean).every((line) => line.startsWith("• "));
              sectionPatch(selected, {
                body: lines
                  .map((line) => (line ? (bulleted ? line.replace(/^• /, "") : `• ${line}`) : line))
                  .join("\n"),
              });
            }}
          >
            <List />
          </button>
          <button
            className="cv-preview-toggle"
            aria-pressed={preview}
            onClick={() => setPreview((value) => !value)}
          >
            <Eye />
            {preview ? "Chỉnh sửa" : "Xem trước"}
          </button>
        </div>
        <div className="cv-paper-wrap">
          <CvSheet
            document={doc}
            onChange={preview || readOnly ? undefined : onChange}
            selected={preview ? undefined : selected}
            onSelect={setSelected}
          />
        </div>
      </div>
    </div>
  );
}
