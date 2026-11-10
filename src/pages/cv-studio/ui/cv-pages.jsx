import { Select } from "@/shared/ui/select";
import { formatDateTime } from "@/shared/lib/date-format";
import { useToast } from "@/shared/ui/toast-context";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  useBlocker,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  FileText,
  Sparkles,
  Search,
  CheckCircle2,
  ArrowRight,
  Plus,
  Printer,
  Save,
  Trash2,
} from "lucide-react";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerResources } from "@/widgets/career-resources";
import { CvEditor } from "@/widgets/cv-editor";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { useCandidateSession } from "@/features/authenticate";
import { cvApi, adminCvApi, blankCv, CvSheet } from "@/entities/cv";
import { AdminLayout } from "@/widgets/admin-layout";
import { Pagination } from "@/shared/ui/pagination";
import "./cv-pages.css";

const layoutNames = {
  "one-column": "1 Cột chuẩn ATS",
  "two-column": "2 Cột cân bằng",
  sidebar: "Modern Sidebar",
  bento: "Bento Pro",
};
function CvLayout({ current, children, showBreadcrumb = true }) {
  const { account, loading } = useCandidateSession();
  return (
    <div className="cv-studio-page companies-page font-roboto">
      <title>{current} | Job Tốt</title>
      <AuthHeader userName={account?.fullName} loading={loading} />
      <main className="page-container company-container">
        {showBreadcrumb && <PageBreadcrumb current={current} />}
        {children}
        <div className="cv-common-resources">
          <CareerResources />
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
function useCvLoad(kind, id) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${kind}:${id || ""}:${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const value = await (kind === "templates"
          ? cvApi.templates(controller.signal)
          : kind === "template"
            ? cvApi.template(id, controller.signal)
            : kind === "mine"
              ? cvApi.list(controller.signal)
              : kind === "cv"
                ? cvApi.get(id, controller.signal)
                : kind === "admin-list"
                  ? adminCvApi.list(controller.signal)
                  : adminCvApi.get(id, controller.signal));
        if (!controller.signal.aborted) {
          setResult({ key, value });
          setError(null);
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError({ key, failure });
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kind, id, key]);
  return {
    data: result?.key === key ? result.value : null,
    error: error?.key === key ? error.failure : null,
    retry: () => setAttempt((value) => value + 1),
  };
}
function LoadState({ error, retry }) {
  return (
    <div className="cv-load-state" role={error ? "alert" : "status"}>
      {error ? (
        <>
          {error.message} <button onClick={retry}>Thử lại</button>
          {error.status === 401 && <Link to="/login">Đăng nhập</Link>}
        </>
      ) : (
        "Đang tải CV…"
      )}
    </div>
  );
}
function TemplateCard({ template }) {
  return (
    <article className="cv-gallery-card">
      <Link
        className="cv-gallery-preview"
        to={`/cv-templates/${template.id}`}
        aria-label={`Xem mẫu ${template.name}`}
      >
        <span className="cv-template-badge">{template.category}</span>
        <CvSheet document={template.document} miniature />
      </Link>
      <div className="cv-gallery-info">
        <div>
          <h2>
            <Link to={`/cv-templates/${template.id}`}>{template.name}</Link>
          </h2>
          <span>{layoutNames[template.document.layout]}</span>
        </div>
        <p>{template.description}</p>
        <div className="cv-gallery-bottom">
          <span>
            Màu sắc <i style={{ background: template.document.color }} />
          </span>
          <Link to={`/cv-templates/${template.id}`}>
            Dùng mẫu <ArrowRight />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function CvTemplatesPage() {
  const { data, error, retry } = useCvLoad("templates");
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "name";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const categories = [...new Set((data || []).map((item) => item.category))];
  const filtered = (data || [])
    .filter(
      (item) =>
        (!category || item.category === category) &&
        `${item.name} ${item.description} ${item.category}`
          .toLocaleLowerCase("vi")
          .includes(query.toLocaleLowerCase("vi")),
    )
    .sort(
      (a, b) =>
        (sort === "layout" ? a.document.layout.localeCompare(b.document.layout) : 0) ||
        a.name.localeCompare(b.name, "vi"),
    );
  const totalPages = Math.max(1, Math.ceil(filtered.length / 9));
  const currentPage = Math.min(page, totalPages);
  function update(key, value) {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  function changePage(value) {
    const next = new URLSearchParams(params);
    next.set("page", String(value));
    setParams(next);
  }
  return (
    <CvLayout current="Mẫu CV">
      <section className="cv-catalog-hero">
        <div>
          <span className="cv-purple-eyebrow">
            <Sparkles /> CV STUDIO • THIẾT KẾ CHUYÊN NGHIỆP
          </span>
          <h1>
            Kho Mẫu CV Xin Việc Chuẩn ATS
            <br />
            <em>Thể Hiện Chất Riêng Của Bạn</em>
          </h1>
          <p>
            Chọn mẫu phù hợp, chỉnh sửa nội dung và bố cục ngay trên trình duyệt. Lưu CV riêng của
            bạn và xuất bản PDF khi sẵn sàng ứng tuyển.
          </p>
          <div className="cv-benefit-grid">
            <span>
              <CheckCircle2 />
              Bố cục rõ ràng, dễ đọc
            </span>
            <span>
              <FileText />
              Nội dung chỉnh sửa trực tiếp
            </span>
            <span>
              <CheckCircle2 />
              Tự lưu CV theo tài khoản
            </span>
            <span>
              <Printer />
              In / lưu PDF khổ A4
            </span>
          </div>
          <div className="cv-hero-actions">
            <a href="#cv-template-list" className="cv-primary">
              <Plus />
              Tạo CV từ mẫu
            </a>
            <Link to="/my-cvs" className="cv-secondary">
              <FileText />
              CV của tôi
            </Link>
          </div>
        </div>
        <aside className="cv-ats-panel">
          <span>
            <i /> Thiết kế hướng tới khả năng đọc ATS
          </span>
          <div className="cv-ats-mark">
            <FileText />
            <strong>
              Nội dung rõ ràng
              <br />
              <small>Bố cục và phông chữ nhất quán</small>
            </strong>
          </div>
          <ul>
            <li>
              <CheckCircle2 />
              Các mục CV có tiêu đề rõ ràng
            </li>
            <li>
              <CheckCircle2 />
              Giữ nội dung dạng văn bản
            </li>
            <li>
              <CheckCircle2 />
              Xem trước trước khi xuất PDF
            </li>
          </ul>
          <p>Độ phù hợp của CV sẽ phụ thuộc vào yêu cầu riêng của từng nhà tuyển dụng.</p>
        </aside>
      </section>
      <form
        className="cv-catalog-search"
        onSubmit={(event) => {
          event.preventDefault();
          document.getElementById("cv-template-list")?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <label>
          <Search />
          <input
            aria-label="Tìm mẫu CV"
            placeholder="Tìm theo tên mẫu, vị trí công việc, từ khóa…"
            value={query}
            onChange={(event) => update("q", event.target.value)}
          />
        </label>
        <button type="submit">Tìm kiếm</button>
        <Select
          aria-label="Danh mục mẫu CV"
          value={category}
          onChange={(event) => update("category", event.target.value)}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Select>
        <Select
          aria-label="Sắp xếp mẫu CV"
          value={sort}
          onChange={(event) => update("sort", event.target.value)}
        >
          <option value="name">Theo tên mẫu</option>
          <option value="layout">Theo bố cục</option>
        </Select>
      </form>
      <section id="cv-template-list" className="cv-template-list">
        <div className="cv-gallery-heading">
          <div>
            <h2>Danh sách mẫu CV dành cho bạn</h2>
            <p>
              {data
                ? `${filtered.length} mẫu phù hợp • Chọn mẫu để xem trước và bắt đầu`
                : "Đang tải danh sách mẫu"}
            </p>
          </div>
          <span>Mẹo: Ưu tiên nội dung ngắn gọn và thành tựu cụ thể.</span>
        </div>
        {error || !data ? (
          <LoadState error={error} retry={retry} />
        ) : (
          <>
            <div className="cv-gallery-grid">
              {filtered.slice((currentPage - 1) * 9, currentPage * 9).map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
            {!filtered.length && (
              <div className="cv-load-state">
                Không có mẫu phù hợp. Hãy thử từ khóa hoặc danh mục khác.
              </div>
            )}
            <Pagination
              aria-label="Phân trang mẫu CV"
              page={currentPage}
              totalPages={totalPages}
              onPageChange={changePage}
              info={`Hiển thị ${filtered.length ? (currentPage - 1) * 9 + 1 : 0}–${Math.min(currentPage * 9, filtered.length)} trong ${filtered.length} mẫu CV`}
            />
          </>
        )}
      </section>
    </CvLayout>
  );
}
export function CvTemplatePreviewPage() {
  const { id } = useParams();
  const { data, error, retry } = useCvLoad("template", id);
  const { account } = useCandidateSession();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [failure, setFailure] = useState("");
  const creatingRef = useRef(false);
  async function create() {
    if (!account) {
      navigate(`/login?returnTo=${encodeURIComponent(`/cv-templates/${id}`)}`);
      return;
    }
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    try {
      const cv = await cvApi.create(id);
      navigate(`/my-cvs/${cv.id}/edit`);
    } catch (reason) {
      setFailure(reason.message);
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }
  return (
    <CvLayout current={data ? `Mẫu CV • ${data.name}` : "Xem mẫu CV"}>
      {data ? (
        <>
          <div className="cv-page-heading">
            <div>
              <Link to="/cv-templates" className="cv-back-link">
                ← Kho mẫu CV
              </Link>
              <h1>{data.name}</h1>
              <p>{data.description}</p>
            </div>
            <button className="cv-primary" disabled={creating} onClick={create}>
              <Plus />
              {creating ? "Đang tạo…" : "Dùng mẫu này"}
            </button>
          </div>
          {failure && (
            <p className="cv-error" role="alert">
              {failure}
            </p>
          )}
          <CvEditor document={data.document} readOnly />
          <p className="cv-template-note">
            Chọn “Dùng mẫu này” để tạo bản CV riêng và bắt đầu chỉnh sửa.
          </p>
        </>
      ) : (
        <LoadState error={error} retry={retry} />
      )}
    </CvLayout>
  );
}
export function MyCvsPage() {
  const { account, loading } = useCandidateSession();
  return (
    <CvLayout current="CV của tôi">
      {loading ? (
        <LoadState />
      ) : !account ? (
        <div className="cv-load-state">
          Đăng nhập để quản lý CV của bạn. <Link to="/login?returnTo=%2Fmy-cvs">Đăng nhập</Link>
        </div>
      ) : (
        <MyCvsList />
      )}
    </CvLayout>
  );
}
function MyCvsList() {
  const { data, error, retry } = useCvLoad("mine");
  const [failure, setFailure] = useState("");
  const [removing, setRemoving] = useState(null);
  const [pending, setPending] = useState(false);
  const [changingDefault, setChangingDefault] = useState(false);
  async function changeDefault(cv) {
    if (changingDefault) return;
    setChangingDefault(true);
    setFailure("");
    try {
      await cvApi.setDefault(cv.id, !cv.isDefault);
      retry();
    } catch (reason) {
      setFailure(reason.message);
    } finally {
      setChangingDefault(false);
    }
  }
  async function remove() {
    setPending(true);
    try {
      await cvApi.remove(removing.id, removing.version);
      setRemoving(null);
      retry();
    } catch (reason) {
      setFailure(reason.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="cv-page-heading">
        <div>
          <h1>CV của tôi</h1>
          <p>Tiếp tục chỉnh sửa các bản CV đã lưu theo tài khoản.</p>
        </div>
        <Link className="cv-primary" to="/cv-templates">
          <Plus />
          Tạo CV mới
        </Link>
      </div>
      {failure && (
        <p className="cv-error" role="alert">
          {failure}
        </p>
      )}
      {!data || error ? (
        <LoadState error={error} retry={retry} />
      ) : (
        <div className="cv-my-list">
          {data.map((cv) => (
            <article key={cv.id}>
              <FileText />
              <div>
                <h2>
                  <Link to={`/my-cvs/${cv.id}/edit`}>{cv.title}</Link>
                </h2>
                <p>Cập nhật {formatDateTime(cv.updatedAt)}</p>
                <p>{cv.isDefault ? "CV chính" : "CV bổ sung"}</p>
              </div>
              <Link to={`/my-cvs/${cv.id}/edit`} className="cv-secondary">
                Chỉnh sửa
              </Link>
              <button
                type="button"
                className="cv-secondary"
                disabled={changingDefault || pending}
                onClick={() => changeDefault(cv)}
              >
                {cv.isDefault ? "Đặt làm CV bổ sung" : "Đặt làm CV chính"}
              </button>
              <button
                aria-label={`Xóa CV ${cv.title}`}
                onClick={() => {
                  setRemoving(cv);
                  setFailure("");
                }}
              >
                <Trash2 />
              </button>
            </article>
          ))}
          {!data.length && (
            <p className="cv-load-state">Bạn chưa có CV online. Chọn một mẫu để bắt đầu.</p>
          )}
        </div>
      )}
      {removing && (
        <div className="cv-dialog-backdrop">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cv-delete-title"
            className="cv-confirm-dialog"
          >
            <h2 id="cv-delete-title">Xóa CV “{removing.title}”?</h2>
            <p>CV sẽ bị gỡ khỏi danh sách của bạn. Các hồ sơ ứng tuyển đã gửi được giữ lại.</p>
            <div>
              <button className="cv-secondary" disabled={pending} onClick={() => setRemoving(null)}>
                Hủy
              </button>
              <button className="cv-primary" disabled={pending} onClick={remove}>
                {pending ? "Đang xóa…" : "Xóa CV"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export function CvEditPage() {
  const { id } = useParams();
  const { account, loading } = useCandidateSession();
  return (
    <CvLayout current="Chỉnh sửa CV" showBreadcrumb={false}>
      {loading ? (
        <LoadState />
      ) : !account ? (
        <Navigate to={`/login?returnTo=${encodeURIComponent(`/my-cvs/${id}/edit`)}`} replace />
      ) : (
        <LoadedCvEdit key={id} id={id} />
      )}
    </CvLayout>
  );
}
function LoadedCvEdit({ id }) {
  const { data, error, retry } = useCvLoad("cv", id);
  return data ? (
    <CandidateEditor key={data.version} initial={data} reload={retry} />
  ) : (
    <LoadState error={error} retry={retry} />
  );
}
function CandidateEditor({ initial, reload }) {
  const [draft, setDraft] = useState({
    title: initial.title,
    document: initial.document,
  });
  const [version, setVersion] = useState(initial.version);
  const [saved, setSaved] = useState(JSON.stringify(draft));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const saving = useRef(false);
  const controller = useRef(null);
  const alive = useRef(false);
  const snapshot = JSON.stringify(draft);
  const dirty = snapshot !== saved;
  const blocker = useBlocker(dirty);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);
  const save = useCallback(async () => {
    if (saving.current) return false;
    saving.current = true;
    setBusy(true);
    controller.current = new AbortController();
    try {
      const response = await cvApi.save(
        initial.id,
        { ...draft, version },
        controller.current.signal,
      );
      if (!alive.current) return false;
      setVersion(response.version);
      setSaved(JSON.stringify(draft));
      setError(null);
      return true;
    } catch (failure) {
      if (alive.current && !controller.current.signal.aborted) setError(failure);
      return false;
    } finally {
      saving.current = false;
      if (alive.current) setBusy(false);
    }
  }, [draft, version, initial.id]);
  useEffect(() => {
    if (!dirty || busy || error) return;
    const timer = setTimeout(() => {
      void save();
    }, 900);
    return () => clearTimeout(timer);
  }, [dirty, busy, error, save]);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  return (
    <>
      <PageBreadcrumb
        current={draft.title || "Chưa đặt tên CV"}
        parents={[{ to: "/my-cvs", label: "CV của tôi" }]}
      />
      <style>{`@page { size: A4; margin: ${draft.document.margin}mm; }`}</style>
      <div className="cv-page-heading cv-edit-heading">
        <div>
          <input
            aria-label="Tên CV"
            value={draft.title}
            maxLength={200}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
          <span role="status" className={error ? "cv-error" : "cv-save-status"}>
            {error ? error.message : busy ? "Đang lưu…" : dirty ? "Có thay đổi chưa lưu" : "Đã lưu"}
          </span>
        </div>
        <div className="cv-edit-actions">
          <button
            className="cv-secondary"
            disabled={busy || !dirty || error?.status === 409}
            onClick={() => {
              void save();
            }}
          >
            <Save />
            Lưu CV
          </button>
          <button className="cv-primary" disabled={dirty || busy} onClick={() => window.print()}>
            <Printer />
            In / Lưu PDF
          </button>
        </div>
      </div>
      {error && (
        <div className="cv-error-actions">
          {error.status === 409 ? (
            <button onClick={reload}>Tải bản mới nhất (bỏ thay đổi chưa lưu)</button>
          ) : (
            <button
              disabled={busy}
              onClick={() => {
                void save();
              }}
            >
              Thử lưu lại
            </button>
          )}
        </div>
      )}
      <CvEditor
        document={draft.document}
        onChange={(document) => setDraft({ ...draft, document })}
      />
      <div className="cv-print-document">
        <CvSheet document={draft.document} />
      </div>
      {blocker.state === "blocked" && (
        <div className="cv-dialog-backdrop">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cv-leave-title"
            className="cv-confirm-dialog"
          >
            <h2 id="cv-leave-title">CV có thay đổi chưa lưu</h2>
            <p>Bạn muốn tiếp tục chỉnh sửa hay rời trang và bỏ các thay đổi này?</p>
            <div>
              <button className="cv-secondary" onClick={() => blocker.reset()}>
                Tiếp tục chỉnh sửa
              </button>
              <button className="cv-primary" onClick={() => blocker.proceed()}>
                Rời trang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export function AdminCvTemplatesPage() {
  return (
    <AdminLayout>
      {({ onExpired }) => (
        <div className="cv-studio-page">
          <title>Quản lý mẫu CV | Job Tốt Admin</title>
          <AdminTemplates onExpired={onExpired} />
        </div>
      )}
    </AdminLayout>
  );
}
function AdminTemplates({ onExpired }) {
  const { data, error, retry } = useCvLoad("admin-list");
  useEffect(() => {
    if (error?.status === 401 || error?.status === 403) onExpired();
  }, [error, onExpired]);
  return (
    <>
      <div className="cv-page-heading">
        <div>
          <h1>Quản lý mẫu CV</h1>
          <p>Thiết kế mẫu, lưu bản nháp và xuất bản cho ứng viên.</p>
        </div>
        <div className="cv-edit-actions">
          <Link className="cv-primary" to="/admin/cv-templates/new">
            <Plus />
            Tạo mẫu CV
          </Link>
        </div>
      </div>
      {!data || error ? (
        <LoadState error={error} retry={retry} />
      ) : (
        <div className="cv-admin-list">
          {data.map((template) => (
            <article key={template.id}>
              <div className="cv-admin-mini">
                <CvSheet document={template.document} miniature />
              </div>
              <div>
                <span className={`cv-publication cv-state-${template.publicationState}`}>
                  {
                    {
                      draft: "Bản nháp",
                      published: "Đã xuất bản",
                      hidden: "Đã ẩn",
                    }[template.publicationState]
                  }
                </span>
                <h2>{template.name}</h2>
                <p>
                  {template.category} • {layoutNames[template.document.layout]}
                </p>
              </div>
              <Link to={`/admin/cv-templates/${template.id}/edit`} className="cv-secondary">
                Chỉnh sửa mẫu
              </Link>
            </article>
          ))}
          {!data.length && (
            <p className="cv-load-state">Chưa có mẫu CV. Tạo mẫu đầu tiên để bắt đầu.</p>
          )}
        </div>
      )}
    </>
  );
}
export function AdminCvEditPage() {
  const { id } = useParams();
  return (
    <AdminLayout>
      {({ onExpired }) => (
        <div className="cv-studio-page">
          <title>Thiết kế mẫu CV | Job Tốt Admin</title>
          {id ? (
            <LoadedAdminEdit id={id} onExpired={onExpired} />
          ) : (
            <AdminEditor
              onExpired={onExpired}
              initial={{
                name: "M\u1eabu CV m\u1edbi",
                description: "",
                category: "Chuy\u00ean nghi\u1ec7p",
                publicationState: "draft",
                document: blankCv(),
              }}
            />
          )}
        </div>
      )}
    </AdminLayout>
  );
}
function LoadedAdminEdit({ id, onExpired }) {
  const { data, error, retry } = useCvLoad("admin-template", id);
  useEffect(() => {
    if (error?.status === 401 || error?.status === 403) onExpired();
  }, [error, onExpired]);
  return data ? (
    <AdminEditor key={data.version} initial={data} reload={retry} onExpired={onExpired} />
  ) : (
    <LoadState error={error} retry={retry} />
  );
}
function AdminEditor({ initial, reload, onExpired }) {
  const notify = useToast();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [destination, setDestination] = useState(null);
  const dirty = JSON.stringify(draft) !== saved;
  const blocker = useBlocker(dirty);
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
    if (destination && !dirty) navigate(destination, { replace: true });
  }, [destination, dirty, navigate]);
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await adminCvApi.save(initial.id, draft);
      notify("\u0110\u00e3 l\u01b0u m\u1eabu CV th\u00e0nh c\u00f4ng.");
      setDraft(result);
      setSaved(JSON.stringify(result));
      setError(null);
      if (!initial.id) setDestination(`/admin/cv-templates/${result.id}/edit`);
    } catch (failure) {
      setError(failure);
      if (failure.status === 401 || failure.status === 403) onExpired();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form onSubmit={save}>
        <div className="cv-page-heading">
          <div>
            <Link className="cv-back-link" to="/admin/cv-templates">
              ← Quản lý mẫu CV
            </Link>
            <h1>{initial.id ? "Chỉnh sửa mẫu CV" : "Thiết kế mẫu CV mới"}</h1>
            <span role="status">
              {busy ? "Đang lưu mẫu…" : dirty ? "Có thay đổi chưa lưu" : "Đã lưu bản hiện tại"}
            </span>
          </div>
          <button className="cv-primary" disabled={busy || error?.status === 409}>
            <Save />
            Lưu mẫu CV
          </button>
        </div>
        <fieldset className="cv-admin-metadata" disabled={busy}>
          <label>
            Tên mẫu
            <input
              required
              maxLength={200}
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>
          <label>
            Danh mục
            <input
              required
              maxLength={100}
              value={draft.category}
              onChange={(event) => setDraft({ ...draft, category: event.target.value })}
            />
          </label>
          <label>
            Trạng thái
            <Select
              value={draft.publicationState}
              onChange={(event) => setDraft({ ...draft, publicationState: event.target.value })}
            >
              <option value="draft">Bản nháp</option>
              <option value="published">Xuất bản</option>
              <option value="hidden">Ẩn mẫu</option>
            </Select>
          </label>
          <label className="cv-description-label">
            Mô tả
            <textarea
              maxLength={1000}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </label>
        </fieldset>
      </form>
      {error && (
        <div className="cv-error" role="alert">
          {error.message}
          {error.status === 409 && (
            <button onClick={reload}>Tải bản mới nhất (bỏ thay đổi chưa lưu)</button>
          )}
        </div>
      )}
      <CvEditor
        readOnly={busy}
        document={draft.document}
        onChange={(document) => setDraft({ ...draft, document })}
      />
      {blocker.state === "blocked" && (
        <div className="cv-dialog-backdrop">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Thay đổi chưa lưu"
            className="cv-confirm-dialog"
          >
            <h2>Mẫu có thay đổi chưa lưu</h2>
            <div>
              <button className="cv-secondary" onClick={() => blocker.reset()}>
                Tiếp tục chỉnh sửa
              </button>
              <button className="cv-primary" onClick={() => blocker.proceed()}>
                Rời trang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
