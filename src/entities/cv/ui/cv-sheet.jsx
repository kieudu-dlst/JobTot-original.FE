import { useLayoutEffect, useRef, useState } from "react";
import { CvDecoration } from "./cv-decoration";
import { A4 } from "../model/decoration";
import { paginateCv } from "../model/paginate";
import "./cv-sheet.css";

function EditableText({ value, onChange, label, className = "", maxLength = 12000 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      const style = getComputedStyle(ref.current);
      const lineHeight = parseFloat(style.lineHeight);
      // scrollHeight rounds up to whole pixels and textarea adds an extra line
      // after a trailing newline. Match the static text's fractional line boxes.
      const lines = Math.max(
        1,
        Math.round(ref.current.scrollHeight / lineHeight) - (value.endsWith("\n") ? 1 : 0),
      );
      const borders = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      ref.current.style.height = `${lines * lineHeight + borders}px`;
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
function CvContent({ document: doc, onChange, selected, onSelect, page }) {
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
    <>
      {page.header && (
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
      )}
      <div className="cv-paper-sections">
        {page.sections.map((section) => (
          <section
            key={`${section.id}-${section.start}`}
            data-section-id={section.id}
            style={section.column ? { gridColumn: section.column } : undefined}
            className={`cv-paper-section ${section.originalIndex % 2 === 0 ? "cv-section-odd" : ""} ${selected === section.id ? "cv-section-selected" : ""}`}
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
                        item.id === section.id
                          ? {
                              ...item,
                              body:
                                item.body.slice(0, section.start) +
                                body +
                                item.body.slice(section.end),
                            }
                          : item,
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
    </>
  );
}

export function CvSheet({
  document: doc,
  onChange,
  selected,
  onSelect,
  miniature = false,
  selectedImage,
  onSelectImage,
  onInteractionChange,
}) {
  const container = useRef(null);
  const measurement = useRef(null);
  const [scale, setScale] = useState(1);
  const [pagination, setPagination] = useState(null);
  const contentKey = JSON.stringify({ ...doc, decorationImages: undefined });
  const all = {
    header: true,
    sections: doc.sections
      .map((section, originalIndex) => ({
        ...section,
        originalIndex,
        start: 0,
        end: section.body.length,
      }))
      .filter((section) => section.visible),
  };
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / A4.pixelWidth),
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    let frame;
    let alive = true;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!alive) return;
        const pages = paginateCv(doc, measurement.current);
        if (pages) setPagination({ key: contentKey, pages });
      });
    };
    update();
    document.fonts?.addEventListener("loadingdone", update);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      document.fonts?.removeEventListener("loadingdone", update);
    };
    // Decoration movement does not affect text pagination.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey]);
  // Keep the existing page structure while measuring edits, preserving textarea focus/caret.
  const pages = (pagination?.pages || [all]).map((page) => ({
    ...page,
    sections: page.sections.flatMap((part) => {
      const current = doc.sections.find((section) => section.id === part.id && section.visible);
      if (!current) return [];
      const lastPart = !pagination?.pages.some((other) =>
        other.sections.some((section) => section.id === part.id && section.start > part.start),
      );
      return [
        {
          ...part,
          ...current,
          body: current.body.slice(part.start, lastPart ? undefined : part.end),
          end: lastPart ? current.body.length : part.end,
        },
      ];
    }),
  }));
  const pageCount = miniature
    ? 1
    : Math.max(pages.length, ...(doc.decorationImages || []).map((image) => image.page), 1);
  const style = {
    "--cv-accent": doc.color,
    "--cv-font-size": `${doc.fontSize}pt`,
    "--cv-margin": `${doc.margin}mm`,
    fontFamily: `${doc.font}, Arial, sans-serif`,
  };
  function imageChange(updated) {
    onChange({
      ...doc,
      decorationImages: (doc.decorationImages || []).map((image) =>
        image.id === updated.id ? updated : image,
      ),
    });
  }
  return (
    <div
      ref={container}
      className={`cv-pages ${miniature ? "cv-pages-miniature" : ""}`}
      style={style}
      aria-busy={!pagination || pagination.key !== contentKey}
    >
      <div
        className={`cv-sheet cv-layout-${doc.layout} cv-measurement`}
        ref={measurement}
        aria-hidden="true"
      >
        <CvContent document={doc} page={all} />
      </div>
      {Array.from({ length: pageCount }, (_, index) => (
        <div key={index} className="cv-page-slot" style={{ height: A4.pixelHeight * scale }}>
          <article
            className={`cv-sheet cv-layout-${doc.layout} ${onChange && selectedImage ? "cv-images-editing" : ""}`}
            aria-label={`Trang CV ${index + 1}`}
            data-page={index + 1}
            style={{ transform: `scale(${scale})` }}
          >
            <div className="cv-page-content">
              <CvContent
                document={doc}
                onChange={onChange}
                selected={selected}
                onSelect={onSelect}
                page={pages[index] || { sections: [] }}
              />
            </div>
            {(doc.decorationImages || [])
              .filter((image) => image.page === index + 1)
              .map((image) => (
                <CvDecoration
                  key={image.id}
                  image={image}
                  selected={selectedImage === image.id}
                  onSelect={onSelectImage}
                  onChange={onChange ? imageChange : undefined}
                  onInteractionChange={onInteractionChange}
                />
              ))}
          </article>
        </div>
      ))}
    </div>
  );
}
