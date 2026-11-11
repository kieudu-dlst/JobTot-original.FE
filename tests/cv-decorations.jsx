import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { blankCv, CvSheet } from "@/entities/cv";
import { CvEditor } from "@/widgets/cv-editor";
import "../src/pages/cv-studio/ui/cv-pages.css";
import "../src/app/styles/index.css";

// Standalone browser test entry, deliberately outside the application router.
// eslint-disable-next-line react-refresh/only-export-components
function Checks() {
  const [doc, setDoc] = useState(
    () =>
      JSON.parse(localStorage.getItem("cv-decoration-check") || "null") || {
        ...blankCv(),
        fullName: "NGUYỄN VĂN AN",
        headline: "KỸ SƯ PHẦN MỀM",
        email: "an@example.test",
      },
  );
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    window.cvCheck = { doc, setDoc, busy };
  }, [doc, busy]);
  return (
    <div className="cv-studio-page" style={{ maxWidth: 1200, margin: "auto" }}>
      <style>{"@media print { #thumbnail { display: none; } }"}</style>
      <div className="cv-page-heading">
        <button
          id="save"
          onClick={() => localStorage.setItem("cv-decoration-check", JSON.stringify(doc))}
        >
          Lưu kiểm tra
        </button>
        <span>{busy ? "Đang xử lý" : "Sẵn sàng"}</span>
      </div>
      <CvEditor
        document={doc}
        onChange={setDoc}
        onMediaBusyChange={setBusy}
        uploadImage={async (file) => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const bitmap = await createImageBitmap(file);
          const ratio = bitmap.width / bitmap.height;
          bitmap.close();
          return {
            id: crypto.randomUUID(),
            url: "/uploads/cv-decorations/check.png",
            x: 145,
            y: 200,
            width: 40,
            height: 40 / ratio,
            page: 1,
            opacity: 1,
            zIndex: -1,
          };
        }}
        deleteImage={async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }}
      />
      <div id="thumbnail" style={{ width: 240 }}>
        <CvSheet document={doc} miniature />
      </div>
      <div className="cv-print-document">
        <CvSheet document={doc} />
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<Checks />);
