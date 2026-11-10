import { Select } from "@/shared/ui/select";
import { Table, TableScroll } from "@/shared/ui/table";
import { formatDate } from "@/shared/lib/date-format";
import { FormInput } from "@/shared/ui/date-picker";
import { useToast } from "@/shared/ui/toast-context";
import { Pagination } from "@/shared/ui/pagination";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useBlocker } from "react-router-dom";
import {
  Plus,
  BriefcaseBusiness,
  Users,
  CalendarDays,
  PieChart,
  Search,
  Pencil,
  ArrowLeft,
  Save,
  Rocket,
  Pause,
  CircleStop,
  FileText,
  ListChecks,
  Tags,
  Gift,
  Workflow,
  Trash2,
  ArrowUp,
  ArrowDown,
  Settings2,
  UserRound,
  Check,
} from "lucide-react";
import { EmployerHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { useEmployerSession } from "@/features/authenticate";
import { campaignsApi } from "../api/campaigns";
import { MarkdownEditor } from "./markdown-editor";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import "./campaigns.css";

const labels = {
  Draft: "Bản nháp",
  Running: "Đang chạy",
  Paused: "Tạm dừng",
  Ended: "Đã kết thúc",
};
function Gate({ children }) {
  const { account, loading, error } = useEmployerSession();
  if (loading)
    return (
      <p role="status" className="cp-loading">
        Đang kiểm tra phiên đăng nhập…
      </p>
    );
  if (!account && !error) return <Navigate to="/login?role=employer" replace />;
  if (!account) return <p role="alert">{error}</p>;
  return children(account);
}
function Shell({ account, title, children, list = false, breadcrumb }) {
  return (
    <div className={`campaign-page font-roboto ${list ? "cp-list-page" : ""}`}>
      <title>{title} | Job Tốt</title>
      <EmployerHeader userName={account.fullName} active="campaigns" />
      <main className="page-container company-container cp-container">
        <PageBreadcrumb current={title} root={list ? null : undefined} {...breadcrumb} />
        {children}
      </main>
      <AuthFooter />
    </div>
  );
}
export function CampaignListPage() {
  return <Gate>{(account) => <CampaignList key={account.companyId} account={account} />}</Gate>;
}
function CampaignList({ account }) {
  const [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [keyword, setKeyword] = useState(""),
    [query, setQuery] = useState(""),
    [state, setState] = useState(""),
    [page, setPage] = useState(1),
    [attempt, setAttempt] = useState(0);
  const noteKey = `jobtot.employer.notes.${account.id}.${account.companyId}`;
  const [notes, setNotes] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem(noteKey) || "[]");
      } catch {
        return [];
      }
    }),
    [note, setNote] = useState("");
  useEffect(() => {
    localStorage.setItem(noteKey, JSON.stringify(notes));
  }, [noteKey, notes]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const value = await campaignsApi.list(
          new URLSearchParams({ page, ...(query && { keyword: query }), ...(state && { state }) }),
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setResult(value);
          setError("");
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, state, page, attempt]);
  const stats = result?.stats;
  return (
    <Shell list account={account} title="Quản lý Chiến dịch Tuyển dụng">
      <div className="cp-heading">
        <div>
          <span className="cp-live">● Dữ liệu chiến dịch</span>
          <h1>Quản lý Chiến dịch Tuyển dụng</h1>
          <p>Theo dõi hiệu suất các tin tuyển dụng đang hoạt động và quản lý phễu ứng viên.</p>
        </div>
        <Link className="cp-primary" to="/employer/campaigns/new">
          <Plus />
          Đăng tin tuyển dụng mới
        </Link>
      </div>
      <div className="cp-stats">
        {[
          [BriefcaseBusiness, "Chiến dịch đang chạy", stats?.running],
          [Users, "Tổng số ứng viên", stats?.applications],
          [CalendarDays, "Lịch phỏng vấn hôm nay", stats?.interviews],
          [
            PieChart,
            "Tỷ lệ tuyển thành công",
            stats
              ? stats.applications
                ? `${((stats.hired / stats.applications) * 100).toFixed(1)}%`
                : "—"
              : null,
          ],
        ].map(([Icon, label, value], index) => (
          <article key={label}>
            <div>
              <span>{label}</span>
              <Icon className={`cp-tone-${index}`} />
            </div>
            <strong>{value ?? "—"}</strong>
            <small>
              {index === 3 ? "Ứng viên đã nhận việc / Tổng ứng viên" : "Theo dữ liệu hiện tại"}
            </small>
          </article>
        ))}
      </div>
      <div className="cp-list-layout">
        <section className="cp-card cp-table-card">
          <div className="cp-table-heading">
            <div>
              <h2>Chiến dịch tuyển dụng</h2>
              <p>Quản lý vị trí công việc và theo dõi tiến độ phễu ứng viên.</p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setQuery(keyword.trim());
                setPage(1);
              }}
            >
              <label className="cp-search">
                <Search />
                <FormInput
                  aria-label="Lọc chiến dịch"
                  placeholder="Lọc chiến dịch…"
                  maxLength={200}
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
                <button className="cp-small-button" type="submit">
                  Lọc
                </button>
              </label>
              <Select
                aria-label="Trạng thái chiến dịch"
                value={state}
                onChange={(event) => {
                  setState(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </form>
          </div>
          {error ? (
            <p role="alert" className="cp-error">
              {error} <button onClick={() => setAttempt((value) => value + 1)}>Thử lại</button>
            </p>
          ) : !result || result.page !== page ? (
            <p role="status" className="cp-loading">
              Đang tải chiến dịch…
            </p>
          ) : (
            <>
              <TableScroll label="Danh sách chiến dịch" className="cp-table-scroll">
                <Table aria-label="Danh sách chiến dịch">
                  <thead>
                    <tr>
                      {[
                        "VỊ TRÍ / PHÒNG BAN",
                        "PHỄU ỨNG VIÊN",
                        "TRẠNG THÁI",
                        "HẠN NỘP",
                        "THAO TÁC",
                      ].map((title) => (
                        <th key={title}>{title}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <Link to={`/employer/campaigns/${item.id}/edit`}>
                            <strong>{item.title}</strong>
                          </Link>
                          <small>
                            {item.department} • {item.workAddress}
                          </small>
                        </td>
                        <td>
                          <strong>Tổng: {item.applications}</strong>
                          <small>
                            Mới: <b>{item.fresh}</b> | PV: <em>{item.interviews}</em> | Offer:{" "}
                            <i>{item.offers}</i>
                          </small>
                        </td>
                        <td>
                          <span className={`cp-status cp-${item.campaignStatus}`}>
                            ● {labels[item.campaignStatus] || item.campaignStatus}
                          </span>
                        </td>
                        <td>
                          {item.endDate ? formatDate(`${item.endDate}T00:00:00`) : "Chưa đặt hạn"}
                        </td>
                        <td>
                          <div className="cp-row-actions">
                            {item.campaignStatus === "Running" && (
                              <Link
                                to={`/employer/discover?campaignId=${item.id}`}
                                aria-label={`Tìm nhân tài cho ${item.title}`}
                              >
                                <Users />
                              </Link>
                            )}
                            <Link
                              to={`/employer/campaigns/${item.id}/edit`}
                              aria-label={`Cập nhật ${item.title}`}
                            >
                              <Pencil />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableScroll>
              {!result.items.length && (
                <p className="cp-empty">
                  Chưa có chiến dịch phù hợp. Tạo chiến dịch mới để bắt đầu.
                </p>
              )}
              <Pagination
                page={page}
                totalPages={Math.ceil(result.totalCount / 5)}
                onPageChange={setPage}
                info={
                  <>
                    Hiển thị {result.items.length} trong {result.totalCount} vị trí tuyển dụng
                  </>
                }
              />
            </>
          )}
        </section>
        <aside className="cp-list-aside">
          <section className="cp-card">
            <h2>
              <CalendarDays />
              Lịch phỏng vấn hôm nay <span>{result?.interviews.length || 0} lịch hẹn</span>
            </h2>
            <div className="cp-interviews">
              {result?.interviews.length ? (
                result.interviews.map((item, index) => (
                  <article key={item.id}>
                    <h3>
                      <time className={`cp-time-${index % 3}`}>
                        {new Date(item.scheduledStart).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Ho_Chi_Minh",
                        })}
                      </time>
                      {item.name}
                    </h3>
                    <p>Vị trí: {item.title}</p>
                    <small>{item.location || "Phỏng vấn trực tuyến"}</small>
                  </article>
                ))
              ) : (
                <p className="cp-empty">Chưa có lịch phỏng vấn hôm nay.</p>
              )}
            </div>
            <Link className="cp-all-interviews" to="/employer/interviews">
              Xem tất cả lịch phỏng vấn →
            </Link>
          </section>
          <section className="cp-card">
            <h2>
              <ListChecks />
              Việc cần làm <span>{notes.filter((item) => !item.done).length} việc</span>
            </h2>
            <p className="cp-caption">Ghi chú cá nhân được lưu trên thiết bị này.</p>
            <div className="cp-notes">
              {notes.map((item) => (
                <label key={item.id}>
                  <FormInput
                    type="checkbox"
                    checked={item.done}
                    onChange={() =>
                      setNotes((current) =>
                        current.map((value) =>
                          value.id === item.id ? { ...value, done: !value.done } : value,
                        ),
                      )
                    }
                  />
                  <span className={item.done ? "cp-done" : ""}>{item.text}</span>
                  <button
                    type="button"
                    aria-label={`Xóa ghi chú ${item.text}`}
                    onClick={() =>
                      setNotes((current) => current.filter((value) => value.id !== item.id))
                    }
                  >
                    <Trash2 />
                  </button>
                </label>
              ))}
            </div>
            <form
              className="cp-note-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (note.trim() && notes.length < 30) {
                  setNotes((current) => [
                    ...current,
                    { id: crypto.randomUUID(), text: note.trim(), done: false },
                  ]);
                  setNote("");
                }
              }}
            >
              <FormInput
                aria-label="Ghi chú nhanh"
                maxLength={300}
                placeholder="Thêm ghi chú nhanh"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <button type="submit" aria-label="Thêm ghi chú">
                <Plus />
              </button>
            </form>
          </section>
        </aside>
      </div>
    </Shell>
  );
}

const empty = () => ({
  title: "",
  department: "",
  workAddress: "",
  description: "",
  requirements: "",
  industryId: "",
  provinceId: "",
  employmentTypeId: "",
  ownerRecruiterId: "",
  workMode: "office",
  seniority: "employee",
  openings: 1,
  startDate: new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10),
  endDate: "",
  salaryMin: null,
  salaryMax: null,
  salaryVisible: true,
  ageMin: null,
  ageMax: null,
  genderPreference: "any",
  campaignStatus: "Draft",
  revision: null,
  skills: [],
  benefits: [],
  stages: [],
});
export function CampaignEditPage() {
  const { id } = useParams();
  return (
    <Gate>
      {(account) => (
        <CampaignEditor key={`${account.companyId}-${id || "new"}`} account={account} id={id} />
      )}
    </Gate>
  );
}
function CampaignEditor({ account, id }) {
  const notify = useToast();
  const [document, setDocument] = useState(empty),
    [metadata, setMetadata] = useState(null),
    [loaded, setLoaded] = useState(!id),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false),
    [attempt, setAttempt] = useState(0),
    [skill, setSkill] = useState("");
  const submitting = useRef(false),
    form = useRef(null),
    navigate = useNavigate();
  const [saved, setSaved] = useState(() => JSON.stringify(empty()));
  const allowSavedNavigation = useRef(false);
  const dirty = Boolean(metadata && loaded && (JSON.stringify(document) !== saved || skill.trim()));
  const blocker = useBlocker(() => !allowSavedNavigation.current && (dirty || submitting.current));
  useEffect(() => {
    if (!dirty && !pending) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, pending]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const [meta, response] = await Promise.all([
          campaignsApi.metadata(controller.signal),
          id ? campaignsApi.get(id, controller.signal) : Promise.resolve(null),
        ]);
        if (controller.signal.aborted) return;
        setMetadata(meta);
        const initial = response
          ? response.document
          : { ...empty(), ownerRecruiterId: meta.currentRecruiterId };
        setSaved(JSON.stringify(initial));
        setDocument(initial);
        setLoaded(true);
        setError("");
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, attempt]);
  function patch(name, value) {
    setDocument((current) => ({ ...current, [name]: value }));
  }
  const ended = document.campaignStatus === "Ended";
  const readOnly =
    ended ||
    Boolean(
      id &&
        metadata &&
        !metadata.isCompanyAdmin &&
        document.ownerRecruiterId !== metadata.currentRecruiterId,
    );
  async function save(state) {
    if (submitting.current || readOnly || !form.current.reportValidity()) return;
    if (
      state === "Running" &&
      (!document.description.trim() ||
        !document.requirements.trim() ||
        !document.stages.length ||
        !document.endDate)
    ) {
      setError("Để bắt đầu cần mô tả, yêu cầu, ngày kết thúc và ít nhất một vòng tuyển dụng.");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const result = await campaignsApi.save(id, { ...document, campaignStatus: state });
      setSaved(JSON.stringify(result.document));
      if (!id) {
        allowSavedNavigation.current = true;
        navigate(`/employer/campaigns/${result.id}/edit`, { replace: true });
      } else {
        setDocument(result.document);
        notify("Đã lưu chiến dịch thành công.");
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  function addSkill() {
    const value = skill.trim();
    if (
      value &&
      !document.skills.some((item) => item.toLowerCase() === value.toLowerCase()) &&
      document.skills.length < 30
    ) {
      patch("skills", [...document.skills, value]);
      setSkill("");
    }
  }
  function changeItem(list, index, key, value) {
    patch(
      list,
      document[list].map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  }
  function moveStage(index, step) {
    const stages = [...document.stages];
    [stages[index], stages[index + step]] = [stages[index + step], stages[index]];
    patch("stages", stages);
  }
  const title = id ? "Cập nhật chiến dịch tuyển dụng" : "Tạo chiến dịch tuyển dụng mới";
  const completeness = Math.round(
    ([
      document.title,
      document.department,
      document.workAddress,
      document.description,
      document.requirements,
      document.skills.length,
      document.benefits.length,
      document.stages.length,
      document.endDate,
    ].filter(Boolean).length /
      9) *
      100,
  );
  const input = (name, label, options = {}) => (
    <label className="cp-field" key={name}>
      {label}
      <FormInput
        aria-label={label}
        type={options.type || "text"}
        required={options.required}
        min={options.min}
        max={options.max}
        maxLength={options.maxLength || 200}
        value={document[name] ?? ""}
        onChange={(event) =>
          patch(
            name,
            options.type === "number"
              ? event.target.value === ""
                ? null
                : Number(event.target.value)
              : event.target.value,
          )
        }
      />
    </label>
  );
  const select = (name, label, items) => (
    <label className="cp-field">
      {label}
      <Select
        aria-label={label}
        disabled={name === "ownerRecruiterId" && !metadata.isCompanyAdmin}
        required
        value={document[name]}
        onChange={(event) => patch(name, event.target.value)}
      >
        <option value="">Chọn {label.toLowerCase()}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </Select>
    </label>
  );
  const head = (Icon, text, description, action) => (
    <div className="cp-section-head">
      <span>
        <Icon />
      </span>
      <div>
        <h2>{text}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
  return (
    <Shell
      account={account}
      title={title}
      breadcrumb={
        id
          ? {
              root: { to: "/employer/campaigns", label: "Danh sách chiến dịch" },
              current: document.title.trim() || (loaded ? "Chiến dịch" : "Đang tải chiến dịch…"),
            }
          : undefined
      }
    >
      <Dialog
        open={blocker.state === "blocked"}
        onOpenChange={(open) => {
          if (!open && blocker.state === "blocked") blocker.reset();
        }}
      >
        <DialogContent>
          <DialogTitle>Chiến dịch có thay đổi chưa lưu</DialogTitle>
          <DialogDescription>
            Hãy lưu chiến dịch trước khi rời trang. Rời đi sẽ mất nội dung chưa lưu.
          </DialogDescription>
          <button type="button" className="cp-primary" onClick={() => blocker.reset()}>
            Tiếp tục chỉnh sửa
          </button>
          <button
            type="button"
            className="cp-outline"
            disabled={pending}
            onClick={() => blocker.proceed()}
          >
            Rời trang, bỏ thay đổi
          </button>
        </DialogContent>
      </Dialog>
      <div className="cp-heading">
        <div>
          <span className="cp-live">
            ● {id ? labels[document.campaignStatus] : "Soạn chiến dịch mới"}
          </span>
          <h1>{title}</h1>
          <p>Xây dựng tin tuyển dụng và quy trình phỏng vấn minh bạch.</p>
        </div>
        <div className="cp-editor-actions">
          <Link className="cp-outline" to="/employer/campaigns">
            <ArrowLeft />
            Hủy bỏ / Quay lại
          </Link>
          {!readOnly && (
            <>
              {!id || document.campaignStatus === "Draft" ? (
                <>
                  <button
                    className="cp-primary"
                    disabled={pending || !metadata || !loaded}
                    onClick={() => save("Running")}
                  >
                    <Rocket />
                    Bắt đầu chiến dịch ngay
                  </button>
                  <button
                    className="cp-outline"
                    disabled={pending || !metadata || !loaded}
                    onClick={() => save("Draft")}
                  >
                    <Save />
                    Lưu nháp
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="cp-primary"
                    disabled={pending}
                    onClick={() => save(document.campaignStatus)}
                  >
                    <Save />
                    {pending ? "Đang lưu…" : "Lưu"}
                  </button>
                  <button
                    className="cp-outline cp-orange"
                    disabled={pending}
                    onClick={() =>
                      save(document.campaignStatus === "Paused" ? "Running" : "Paused")
                    }
                  >
                    <Pause />
                    {document.campaignStatus === "Paused"
                      ? "Tiếp tục chiến dịch"
                      : "Tạm dừng chiến dịch"}
                  </button>
                  <button
                    className="cp-outline cp-orange"
                    disabled={pending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Kết thúc chiến dịch? Chiến dịch đã kết thúc không thể mở lại.",
                        )
                      )
                        save("Ended");
                    }}
                  >
                    <CircleStop />
                    Kết thúc chiến dịch
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="cp-error">
          {error}
          {!metadata && <button onClick={() => setAttempt((value) => value + 1)}>Thử lại</button>}
        </p>
      )}
      {!metadata || !loaded ? (
        !error && (
          <p role="status" className="cp-loading">
            Đang tải thông tin chiến dịch…
          </p>
        )
      ) : (
        <form
          ref={form}
          onSubmit={(event) => {
            event.preventDefault();
            save(document.campaignStatus);
          }}
        >
          <fieldset disabled={pending || readOnly}>
            <div className="cp-editor-layout">
              <div className="cp-editor-main">
                <section className="cp-card">
                  {head(
                    BriefcaseBusiness,
                    "1. Thông tin cơ bản & Vị trí làm việc",
                    "Định vị công việc trên mạng lưới tuyển dụng toàn quốc",
                  )}
                  {input("title", "Tiêu đề chiến dịch / Vị trí tuyển dụng", { required: true })}
                  {input("department", "Phòng ban / Bộ phận tuyển dụng", { required: true })}
                  {input("workAddress", "Địa điểm làm việc văn phòng chính", { required: true })}
                  <div className="cp-field-pair">
                    {select("industryId", "Ngành nghề", metadata.industries)}
                    {select("provinceId", "Tỉnh / Thành", metadata.provinces)}
                  </div>
                </section>
                <section className="cp-card">
                  {head(
                    FileText,
                    "2. Mô tả công việc (Job Description)",
                    "Soạn mô tả bằng Markdown, tối đa 10.000 ký tự",
                  )}
                  <MarkdownEditor
                    label="Mô tả công việc"
                    value={document.description}
                    onChange={(value) => patch("description", value)}
                  />
                </section>
                <section className="cp-card">
                  {head(
                    ListChecks,
                    "3. Yêu cầu ứng viên (Candidate Requirements)",
                    "Nêu rõ kinh nghiệm, năng lực và tiêu chuẩn tuyển dụng",
                  )}
                  <MarkdownEditor
                    label="Yêu cầu ứng viên"
                    value={document.requirements}
                    onChange={(value) => patch("requirements", value)}
                  />
                </section>
                <section className="cp-card">
                  {head(
                    Tags,
                    "4. Kỹ năng & Công nghệ yêu cầu",
                    "Thêm các kỹ năng liên quan đến công việc",
                    <small>{document.skills.length} kỹ năng đã chọn</small>,
                  )}
                  <div className="cp-tag-input">
                    <FormInput
                      aria-label="Kỹ năng mới"
                      placeholder="Gõ kỹ năng và nhấn Enter để thêm"
                      maxLength={200}
                      value={skill}
                      onChange={(event) => setSkill(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <button type="button" onClick={addSkill}>
                      Thêm tag
                    </button>
                  </div>
                  <div className="cp-tags">
                    {document.skills.map((value) => (
                      <span key={value}>
                        <Check />
                        {value}
                        <button
                          type="button"
                          aria-label={`Xóa kỹ năng ${value}`}
                          onClick={() =>
                            patch(
                              "skills",
                              document.skills.filter((item) => item !== value),
                            )
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </section>
                <section className="cp-card">
                  {head(
                    Gift,
                    "5. Chế độ đãi ngộ & Phúc lợi (Perks & Benefits)",
                    "Cung cấp thông tin quyền lợi minh bạch",
                    <button
                      className="cp-add"
                      type="button"
                      disabled={document.benefits.length >= 20}
                      onClick={() =>
                        patch("benefits", [...document.benefits, { title: "", description: "" }])
                      }
                    >
                      <Plus />
                      Thêm phúc lợi mới
                    </button>,
                  )}
                  <div className="cp-benefits">
                    {document.benefits.map((item, index) => (
                      <article key={index}>
                        <FormInput
                          aria-label={`Tên phúc lợi ${index + 1}`}
                          required
                          maxLength={200}
                          placeholder="Tên phúc lợi"
                          value={item.title}
                          onChange={(event) =>
                            changeItem("benefits", index, "title", event.target.value)
                          }
                        />
                        <textarea
                          aria-label={`Chi tiết phúc lợi ${index + 1}`}
                          maxLength={2000}
                          placeholder="Mô tả quyền lợi"
                          value={item.description}
                          onChange={(event) =>
                            changeItem("benefits", index, "description", event.target.value)
                          }
                        />
                        <button
                          type="button"
                          aria-label={`Xóa phúc lợi ${index + 1}`}
                          onClick={() =>
                            patch(
                              "benefits",
                              document.benefits.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <Trash2 />
                        </button>
                      </article>
                    ))}
                  </div>
                  {!document.benefits.length && <p className="cp-empty">Chưa thêm phúc lợi.</p>}
                </section>
                <section className="cp-card">
                  {head(
                    Workflow,
                    "6. Quy trình tuyển dụng & Pipeline phỏng vấn",
                    "Các vòng hiện có được giữ ID để bảo toàn lịch phỏng vấn",
                    <button
                      className="cp-add cp-blue"
                      type="button"
                      disabled={document.stages.length >= 15}
                      onClick={() =>
                        patch("stages", [...document.stages, { id: null, name: "", kind: "" }])
                      }
                    >
                      <Plus />
                      Thêm vòng phỏng vấn
                    </button>,
                  )}
                  <div className="cp-stages">
                    {document.stages.map((item, index) => (
                      <article key={item.id || index}>
                        <span>{index + 1}</span>
                        <div>
                          <FormInput
                            aria-label={`Tên vòng ${index + 1}`}
                            required
                            maxLength={200}
                            placeholder="Tên vòng tuyển dụng"
                            value={item.name}
                            onChange={(event) =>
                              changeItem("stages", index, "name", event.target.value)
                            }
                          />
                          <FormInput
                            aria-label={`Thông tin vòng ${index + 1}`}
                            maxLength={200}
                            placeholder="Hình thức / Thời lượng (VD: 30 phút Online)"
                            value={item.kind}
                            onChange={(event) =>
                              changeItem("stages", index, "kind", event.target.value)
                            }
                          />
                        </div>
                        <div className="cp-stage-actions">
                          <button
                            type="button"
                            disabled={index === 0}
                            aria-label={`Chuyển vòng ${index + 1} lên`}
                            onClick={() => moveStage(index, -1)}
                          >
                            <ArrowUp />
                          </button>
                          <button
                            type="button"
                            disabled={index === document.stages.length - 1}
                            aria-label={`Chuyển vòng ${index + 1} xuống`}
                            onClick={() => moveStage(index, 1)}
                          >
                            <ArrowDown />
                          </button>
                          <button
                            type="button"
                            aria-label={`Xóa vòng ${index + 1}`}
                            onClick={() =>
                              patch(
                                "stages",
                                document.stages.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
              <aside className="cp-editor-aside">
                <section className="cp-card cp-quality">
                  <small>ĐỘ HOÀN THIỆN CHIẾN DỊCH</small>
                  <div>
                    <strong>{completeness}%</strong>
                    <h2>Nội dung tuyển dụng rõ ràng</h2>
                  </div>
                  <p>
                    Điểm hoàn thiện dựa trên các thông tin đã nhập; không phải chứng nhận ATS hoặc
                    kết quả AI.
                  </p>
                  {!metadata.canPublish && (
                    <p className="cp-warning">
                      Doanh nghiệp đang chờ xác minh. Bạn có thể lưu nháp trước khi đăng tuyển.
                    </p>
                  )}
                </section>
                <section className="cp-card">
                  {head(Settings2, "Thông số & Điều kiện tuyển dụng", "")}
                  <div className="cp-field-pair">
                    {input("startDate", "Ngày bắt đầu", { type: "date" })}
                    {input("endDate", "Ngày kết thúc", { type: "date" })}
                  </div>
                  {input("openings", "Số lượng cần tuyển dụng", {
                    type: "number",
                    required: true,
                    min: 1,
                    max: 10000,
                  })}
                  {select("seniority", "Cấp bậc tuyển dụng", [
                    { id: "intern", name: "Thực tập sinh" },
                    { id: "employee", name: "Nhân viên / Chuyên viên" },
                    { id: "supervisor", name: "Trưởng nhóm" },
                    { id: "manager", name: "Quản lý" },
                    { id: "director", name: "Giám đốc" },
                  ])}
                  {select("employmentTypeId", "Hình thức tuyển dụng", metadata.employmentTypes)}
                  <label className="cp-field">Hình thức làm việc</label>
                  <div className="cp-work-modes">
                    {[
                      ["office", "Văn phòng"],
                      ["hybrid", "Hybrid"],
                      ["remote", "Từ xa"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={document.workMode === value}
                        onClick={() => patch("workMode", value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <label className="cp-check">
                    <FormInput
                      type="checkbox"
                      checked={document.salaryVisible}
                      onChange={(event) => patch("salaryVisible", event.target.checked)}
                    />
                    Công khai mức lương (VND)
                  </label>
                  <div className="cp-field-pair">
                    {input("salaryMin", "Lương từ", { type: "number", min: 0, max: 1000000000 })}
                    {input("salaryMax", "Lương đến", { type: "number", min: 0, max: 1000000000 })}
                  </div>
                  <div className="cp-field-pair">
                    {input("ageMin", "Tuổi từ", { type: "number", min: 18, max: 100 })}
                    {input("ageMax", "Tuổi đến", { type: "number", min: 18, max: 100 })}
                  </div>
                  {select("genderPreference", "Yêu cầu giới tính", [
                    { id: "any", name: "Không yêu cầu" },
                    { id: "male", name: "Nam" },
                    { id: "female", name: "Nữ" },
                  ])}
                </section>
                <section className="cp-card">
                  {head(UserRound, "Nhân sự phụ trách chiến dịch", "")}
                  {select("ownerRecruiterId", "HR phụ trách", metadata.recruiters)}
                  <p className="cp-caption">
                    Chỉ quản trị viên doanh nghiệp được phân công chiến dịch cho HR khác.
                  </p>
                </section>
              </aside>
            </div>
          </fieldset>
        </form>
      )}
    </Shell>
  );
}
