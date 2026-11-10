import { useLayoutEffect, useRef } from "react";
import "./cv-sheet.css";

function EditableText({ value, onChange, label, className = "", maxLength = 12000 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }); // Recalculate after layout/font changes as well as text edits.
  return (
    <textarea
      ref={ref}
      className={`cv-editable ${className}`}
      aria-label={label}
      value={value}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
      rows={1}
    />
  );
}
export function CvSheet({ document: doc, onChange, selected, onSelect, miniature = false }) {
  const field = (key, label, className, maxLength = 300) =>
    onChange ? (
      <EditableText
        value={doc[key] || ""}
        label={label}
        className={className}
        maxLength={maxLength}
        onChange={(value) => onChange({ ...doc, [key]: value })}
      />
    ) : (
      <div className={className}>{doc[key]}</div>
    );
  return (
    <article
      className={`cv-sheet cv-layout-${doc.layout} ${miniature ? "cv-miniature" : ""}`}
      aria-label={miniature ? "Xem trước bố cục CV" : "Nội dung CV"}
      style={{
        "--cv-accent": doc.color,
        "--cv-font-size": `${doc.fontSize}pt`,
        "--cv-margin": `${doc.margin}mm`,
        fontFamily: `${doc.font}, Arial, sans-serif`,
      }}
    >
      <div className="cv-paper-header">
        {doc.avatarDataUri && (
          <img className="cv-paper-avatar" src={doc.avatarDataUri} alt="Ảnh chân dung" />
        )}
        {field("fullName", "Họ và tên", "cv-paper-name", 200)}
        {field("headline", "Vị trí ứng tuyển", "cv-paper-headline", 200)}
        <div className="cv-paper-contact">
          {field("email", "Email", "", 320)}
          {field("phone", "Số điện thoại", "", 50)}
          {field("address", "Địa chỉ", "", 300)}
          {(onChange || doc.website) && field("website", "Website / LinkedIn", "", 300)}
        </div>
      </div>
      <div className="cv-paper-sections">
        {doc.sections
          .filter((section) => section.visible)
          .map((section) => (
            <section
              key={section.id}
              className={`cv-paper-section ${selected === section.id ? "cv-section-selected" : ""}`}
              onFocus={() => onSelect?.(section.id)}
            >
              {onChange ? (
                <EditableText
                  value={section.title}
                  label={`Tên mục ${section.title}`}
                  className="cv-paper-section-title"
                  maxLength={100}
                  onChange={(title) =>
                    onChange({
                      ...doc,
                      sections: doc.sections.map((item) =>
                        item.id === section.id ? { ...item, title } : item,
                      ),
                    })
                  }
                />
              ) : (
                <h3 className="cv-paper-section-title">{section.title}</h3>
              )}
              <div
                className="cv-paper-body"
                style={{
                  fontWeight: section.bold ? 700 : 400,
                  fontStyle: section.italic ? "italic" : "normal",
                  textDecoration: section.underline ? "underline" : "none",
                }}
              >
                {onChange ? (
                  <EditableText
                    value={section.body}
                    label={`Nội dung ${section.title}`}
                    onChange={(body) =>
                      onChange({
                        ...doc,
                        sections: doc.sections.map((item) =>
                          item.id === section.id ? { ...item, body } : item,
                        ),
                      })
                    }
                  />
                ) : (
                  section.body
                )}
              </div>
            </section>
          ))}
      </div>
    </article>
  );
}
