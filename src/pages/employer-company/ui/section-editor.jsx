import { FormInput } from "@/shared/ui/date-picker";
import { useState } from "react";
import { IndustrySelect } from "./industry-select";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";

export function SectionEditor({ editor, onApply, onClose, busy }) {
  const [values, setValues] = useState(() => structuredClone(editor.value));
  const [error, setError] = useState("");
  const patch = (name, value) => setValues((current) => ({ ...current, [name]: value }));
  const input = (field) => (
    <label key={field.name} className="ec-editor-field">
      {field.label}
      {field.multiline ? (
        <textarea
          rows={field.rows || 4}
          maxLength={field.max || 8000}
          value={values[field.name] || ""}
          onChange={(event) => patch(field.name, event.target.value)}
        />
      ) : (
        <FormInput
          type={field.type || "text"}
          required={field.required}
          maxLength={field.max || 300}
          min={field.min}
          max={field.limit}
          value={values[field.name] ?? ""}
          onChange={(event) => patch(field.name, event.target.value)}
        />
      )}
    </label>
  );
  const patchItem = (index, name, value) =>
    setValues((current) =>
      current.map((item, i) => (i === index ? { ...item, [name]: value } : item)),
    );
  function move(index, step) {
    setValues((current) => {
      const list = [...current];
      [list[index], list[index + step]] = [list[index + step], list[index]];
      return list;
    });
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editor.title}</DialogTitle>
          <DialogDescription>
            Chỉnh sửa nội dung rồi chọn Áp dụng để lưu ngay vào hồ sơ doanh nghiệp.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            setError("");
            try {
              await onApply(values);
            } catch (failure) {
              setError(failure.message);
            }
          }}
        >
          <fieldset className="ec-editor" disabled={busy}>
            {editor.fields &&
              editor.fields.map((field) =>
                field.name === "industry" ? (
                  <IndustrySelect
                    key={field.name}
                    value={values.industry || ""}
                    ids={values.industryIds}
                    onChange={(ids, names) =>
                      setValues((current) => ({ ...current, industryIds: ids, industry: names }))
                    }
                  />
                ) : (
                  input(field)
                ),
              )}
            {editor.list && (
              <>
                <div className="ec-editor-list">
                  {values.map((item, index) => (
                    <fieldset key={index}>
                      <legend>Mục {index + 1}</legend>
                      <label className="ec-editor-field">
                        Tiêu đề
                        <FormInput
                          required
                          maxLength={200}
                          value={item.title}
                          onChange={(event) => patchItem(index, "title", event.target.value)}
                        />
                      </label>
                      <label className="ec-editor-field">
                        Nội dung
                        <textarea
                          maxLength={2000}
                          rows={3}
                          value={item.description}
                          onChange={(event) => patchItem(index, "description", event.target.value)}
                        />
                      </label>
                      <label className="ec-editor-field">
                        Nhãn
                        <FormInput
                          maxLength={100}
                          value={item.tag}
                          onChange={(event) => patchItem(index, "tag", event.target.value)}
                        />
                      </label>
                      <div className="ec-editor-item-actions">
                        <button
                          type="button"
                          disabled={index === 0}
                          aria-label={`Di chuyển mục ${index + 1} lên`}
                          onClick={() => move(index, -1)}
                        >
                          <ArrowUp />
                        </button>
                        <button
                          type="button"
                          disabled={index === values.length - 1}
                          aria-label={`Di chuyển mục ${index + 1} xuống`}
                          onClick={() => move(index, 1)}
                        >
                          <ArrowDown />
                        </button>
                        <button
                          type="button"
                          aria-label={`Xóa mục ${index + 1}`}
                          onClick={() =>
                            setValues((current) => current.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </fieldset>
                  ))}
                </div>
                <button
                  type="button"
                  className="ec-outline"
                  disabled={values.length >= 30}
                  onClick={() =>
                    setValues((current) => [...current, { title: "", description: "", tag: "" }])
                  }
                >
                  <Plus />
                  Thêm mục
                </button>
              </>
            )}
            {error && (
              <p role="alert" className="ec-error">
                {error}
              </p>
            )}
            <div className="ec-editor-actions">
              <button type="button" className="ec-outline" onClick={onClose}>
                Hủy
              </button>
              <button className="ec-primary" type="submit">
                {busy ? "Đang lưu…" : "Áp dụng"}
              </button>
            </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
