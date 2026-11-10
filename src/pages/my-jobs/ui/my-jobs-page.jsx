import { formatDateTime } from "@/shared/lib/date-format";
import { useEffect, useState } from "react";
import { mediaUrl } from "@/shared/lib/media-url";
import { Link, useSearchParams } from "react-router-dom";
import {
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  MessageSquare,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { useCandidateSession } from "@/features/authenticate";
import { SaveJobButton, useSavedJobs } from "@/features/save-job";
import { JobListingCard, formatJobSalary } from "@/entities/job";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerResources } from "@/widgets/career-resources";
import { useToast } from "@/shared/ui/toast-context";
import { Pagination } from "@/shared/ui/pagination";
import { myJobsApi } from "../api/my-jobs";
import { InterviewScheduleCard, InterviewCalendar } from "./interview-schedule";
import { AppliedJobCard, UpcomingInterviewCard } from "./applied-job-card";
import "./my-jobs.css";

const tabs = [
  {
    value: "applied",
    label: "Việc làm đã ứng tuyển",
    icon: Send,
    count: "applied",
  },
  { value: "saved", label: "Việc làm đã lưu", icon: Bookmark, count: "saved" },
  {
    value: "companies",
    label: "NTD Quan Tâm bạn",
    icon: Building2,
    count: "interestedEmployers",
  },
  {
    value: "interviews",
    label: "Lịch phỏng vấn",
    icon: CalendarDays,
    count: "interviews",
  },
  { value: "hired", label: "Đã nhận việc", icon: CheckCircle2, count: "hired" },
];
const number = (value) => Number(value || 0).toLocaleString("vi-VN");
const date = (value) => formatDateTime(value);
function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function MyJobsPage() {
  const { account, loading } = useCandidateSession();
  const [params] = useSearchParams();
  return (
    <div className="my-jobs-page font-roboto">
      <title>Việc làm của tôi | Job Tốt</title>
      <AuthHeader userName={account?.fullName} loading={loading} />
      <main className="mj-container">
        <div className="mj-breadcrumb">
          <nav aria-label="Đường dẫn">
            <Link to="/">Trang chủ</Link>
            <ChevronRight />
            <span>Việc làm của tôi</span>
          </nav>
          <span className="mj-talent">
            <Sparkles />
            Quản lý hành trình nghề nghiệp cùng Job Tốt
          </span>
        </div>
        {loading ? (
          <div className="mj-message" role="status">
            Đang kiểm tra đăng nhập…
          </div>
        ) : !account ? (
          <div className="mj-message">
            <BriefcaseBusiness />
            <h1>Việc làm của tôi</h1>
            <p>Đăng nhập để quản lý việc làm đã lưu, hồ sơ ứng tuyển và lịch phỏng vấn của bạn.</p>
            <Link className="company-primary" to="/login?returnTo=%2Fmy-jobs">
              Đăng nhập để tiếp tục
            </Link>
          </div>
        ) : (
          <CandidateJobs key={account.id} />
        )}
      </main>
      <div className="mj-resources">
        <CareerResources
          showCvTemplates={
            !["applied", "companies", "interviews", "hired"].includes(params.get("tab"))
          }
        />
      </div>
      <AuthFooter />
    </div>
  );
}
function CandidateJobs() {
  const notify = useToast();
  const { savedIds, savedLoading, savedError, reloadSaved } = useSavedJobs();
  const [params, setParams] = useSearchParams();
  const tab = tabs.some((item) => item.value === params.get("tab")) ? params.get("tab") : "saved";
  const requestedPage = Number(params.get("page"));
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 && requestedPage <= 1000000
      ? requestedPage
      : 1;
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirmPending, setConfirmPending] = useState([]);
  const [initialCalendarMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });
  const calendarMonth = /^20\d{2}-(0[1-9]|1[0-2])$/.test(params.get("month") || "")
    ? params.get("month")
    : initialCalendarMonth;
  const selectedDate = /^20\d{2}-\d{2}-\d{2}$/.test(params.get("date") || "")
    ? params.get("date")
    : null;
  const calendarKey = tab === "interviews" ? `${calendarMonth}:${selectedDate || ""}` : "";
  const avatarUrl = result?.avatarUrl;
  const savedKey = savedIds.join("|");
  const requestKey = `${tab}:${page}:${savedKey}:${attempt}:${calendarKey}`;
  useEffect(() => {
    if (!["interviews", "applied", "hired", "companies"].includes(tab)) return;
    const refresh = () => {
      if (document.visibilityState === "visible") setRefreshVersion((value) => value + 1);
    };
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [tab]);
  useEffect(() => {
    if (savedLoading) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const query = new URLSearchParams({
        tab,
        page: String(page),
        pageSize: tab === "companies" ? "6" : ["applied", "hired"].includes(tab) ? "4" : "3",
      });
      if (tab === "interviews") {
        query.set("calendarMonth", calendarMonth);
        query.set(
          "timeZoneOffsetMinutes",
          String(-new Date(`${calendarMonth}-01T00:00:00`).getTimezoneOffset()),
        );
        if (selectedDate) query.set("interviewDate", selectedDate);
      }
      myJobsApi
        .get(query, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;
          const lastPage = Math.max(1, Math.ceil(data.totalCount / data.pageSize));
          if (page > lastPage) {
            setParams(
              (current) => {
                const next = new URLSearchParams(current);
                next.set("tab", tab);
                next.set("page", String(lastPage));
                return next;
              },
              { replace: true },
            );
            return;
          }
          setResult({ ...data, requestKey, loadedAt: Date.now() });
          setError("");
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setError(failure.message);
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    tab,
    page,
    savedKey,
    savedLoading,
    attempt,
    requestKey,
    setParams,
    calendarMonth,
    selectedDate,
    refreshVersion,
  ]);
  async function confirmInterview(id) {
    if (confirmPending.includes(id)) return;
    setConfirmPending((current) => [...current, id]);
    try {
      await myJobsApi.confirmInterview(id);
      setResult((current) =>
        current
          ? {
              ...current,
              interviews: current.interviews.map((interview) =>
                interview.id === id ? { ...interview, status: "confirmed" } : interview,
              ),
            }
          : current,
      );
      notify("Đã xác nhận tham gia phỏng vấn.");
    } catch (failure) {
      notify(failure.message, { type: "error" });
      setRefreshVersion((value) => value + 1);
    } finally {
      setConfirmPending((current) => current.filter((value) => value !== id));
    }
  }
  async function availability(readyStatus) {
    if (busy || readyStatus === result.readyStatus) return;
    setBusy(true);
    try {
      await myJobsApi.status(readyStatus);
      setResult((current) => ({
        ...current,
        readyStatus,
        openToWork: readyStatus === "looking",
      }));
      notify(
        `Đã cập nhật trạng thái tìm việc: ${{ looking: "Tìm việc", considering: "Cân nhắc", paused: "Tạm khóa" }[readyStatus]}.`,
      );
    } catch (failure) {
      notify(failure.message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }
  const data = result?.requestKey === requestKey ? result : null;
  const stats = result?.stats;
  return (
    <section
      className={`mj-workspace${tab === "companies" ? " mj-workspace-interests" : ["applied", "hired"].includes(tab) ? " mj-workspace-applied" : ""}`}
    >
      <div className="mj-heading">
        <div>
          <h1>
            Việc làm của tôi{" "}
            <span>
              {result?.openToWork ? "● Ứng viên tích cực" : "● Quản lý hành trình tìm việc"}
            </span>
          </h1>
          <p>
            Quản lý hành trình tìm việc, theo dõi trạng thái ứng tuyển và các cơ hội việc làm đã
            lưu.
          </p>
        </div>
        <div>
          <Link className="mj-profile-link" to="/profile">
            <FileText />
            Cập nhật CV / Hồ sơ
          </Link>
          <Link className="company-primary" to="/jobs">
            <Search />
            Tìm việc làm mới
          </Link>
        </div>
      </div>
      {result && (
        <div className="mj-identity">
          <Link to="/profile" className="mj-avatar" aria-label="Chỉnh sửa ảnh đại diện">
            {avatarUrl ? (
              <span className="mj-avatar-image">
                <img src={mediaUrl(avatarUrl)} alt="Ảnh đại diện của bạn" />
              </span>
            ) : (
              <span>{result.fullName?.[0] || "UV"}</span>
            )}
            <CheckCircle2 />
            <span className="mj-avatar-edit">
              <Camera />
            </span>
          </Link>
          <div className="mj-identity-text">
            <h2>{result.fullName}</h2>
            <p>
              <Link to="/profile">
                <FileText />
                Quản lý CV
              </Link>
              {result.headline || "Cập nhật chức danh của bạn"}
              <span>•</span>
              <span>
                <FileText />
                CV chính: {result.cvTitle || "Chưa có CV"}
              </span>
            </p>
          </div>
          <div className="mj-status">
            <h3>TRẠNG THÁI TÌM VIỆC</h3>
            <div>
              {[
                ["looking", "Tìm việc"],
                ["considering", "Cân nhắc"],
                ["paused", "Tạm khóa"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  disabled={busy}
                  aria-pressed={result.readyStatus === value}
                  className={result.readyStatus === value ? "selected" : ""}
                  onClick={() => availability(value)}
                >
                  <i className={value} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="mj-stat-grid">
        {[
          {
            label: "ĐÃ ỨNG TUYỂN",
            count: stats?.applied,
            icon: Send,
            tone: "orange",
          },
          {
            label: "NTD ĐÃ XEM HỒ SƠ",
            count: stats?.viewed,
            icon: Eye,
            tone: "blue",
          },
          {
            label: "LỊCH PHỎNG VẤN",
            count: stats?.interviews,
            icon: CalendarDays,
            tone: "purple",
          },
          {
            label: "VIỆC LÀM ĐÃ LƯU",
            count: stats?.saved,
            icon: Bookmark,
            tone: "blue",
          },
        ].map(({ label, count, icon: Icon, tone }) => (
          <div key={label}>
            <div>
              <span>{label}</span>
              <strong>{count == null ? "—" : number(count)}</strong>
            </div>
            <span className={`mj-stat-icon mj-${tone}`}>
              <Icon />
            </span>
          </div>
        ))}
      </div>
      <nav className="mj-tabs" aria-label="Danh mục việc làm của tôi">
        {tabs.map(({ value, label, icon: Icon, count }) => (
          <Link
            key={value}
            to={`/my-jobs?tab=${value}`}
            aria-current={tab === value ? "page" : undefined}
          >
            <Icon />
            {label}
            {stats && <span>({number(stats[count])})</span>}
          </Link>
        ))}
      </nav>
      {savedError && (
        <div className="mj-error" role="alert">
          {savedError}
          <button onClick={reloadSaved}>Tải lại việc làm đã lưu</button>
        </div>
      )}
      <div className={`mj-content-grid${tab === "interviews" ? " mj-interviews-grid" : ""}`}>
        <div className="mj-list-column">
          {error ? (
            <div className="mj-error" role="alert">
              {error}
              <button onClick={() => setAttempt((value) => value + 1)}>Thử lại</button>
            </div>
          ) : !data ? (
            <div className="mj-loading" role="status">
              Đang tải việc làm của bạn…
            </div>
          ) : (
            <>
              {["applied", "hired"].includes(tab) &&
                data.applications.map((application) => (
                  <AppliedJobCard
                    key={`${application.detailUrl ? "campaign" : "submission"}:${application.id}`}
                    job={data.jobs.find((job) => job.id === application.jobId)}
                    application={application}
                    loadedAt={data.loadedAt}
                  />
                ))}
              {!["applied", "hired"].includes(tab) &&
                data.jobs.map((job) => (
                  <div key={job.id} className="mj-job-wrap">
                    <JobListingCard
                      job={job}
                      action={<SaveJobButton jobId={job.id} title={job.title} />}
                    />
                  </div>
                ))}
              {tab === "companies" &&
                (data.employerInterests || []).map((interest) => (
                  <EmployerInterestCard
                    key={interest.id}
                    interest={interest}
                    loadedAt={data.loadedAt}
                  />
                ))}
              {data.interviews.map((interview) => (
                <InterviewScheduleCard
                  key={interview.id}
                  interview={interview}
                  pending={confirmPending.includes(interview.id)}
                  onConfirm={confirmInterview}
                />
              ))}
              {!data.totalCount && (
                <div className="mj-empty">
                  <Bookmark />
                  <h2>
                    {tab === "saved"
                      ? "Bạn chưa lưu việc làm nào"
                      : tab === "hired"
                        ? "Bạn chưa có công việc đã nhận việc"
                        : tab === "applied"
                          ? "Bạn chưa gửi hồ sơ ứng tuyển"
                          : tab === "companies"
                            ? "Chưa có nhà tuyển dụng quan tâm hồ sơ của bạn"
                            : selectedDate
                              ? "Không có lịch phỏng vấn trong ngày đã chọn"
                              : "Chưa có lịch phỏng vấn sắp tới"}
                  </h2>
                  <p>
                    {tab === "saved"
                      ? "Nhấn biểu tượng lưu ở việc làm bạn quan tâm để dễ dàng tìm lại tại đây."
                      : tab === "companies"
                        ? "Khi nhà tuyển dụng đánh dấu quan tâm bạn, thông tin sẽ được cập nhật tại đây."
                        : "Các thông tin của bạn sẽ được cập nhật tại đây khi có dữ liệu mới."}
                  </p>
                  <Link
                    className="company-primary"
                    to={tab === "companies" ? "/companies" : "/jobs"}
                  >
                    {tab === "companies" ? "Khám phá doanh nghiệp" : "Khám phá việc làm"}
                    <ChevronRight />
                  </Link>
                </div>
              )}
              {data.totalCount > 0 && (
                <MyJobsPagination
                  data={data}
                  onPage={(value) =>
                    setParams((current) => {
                      const next = new URLSearchParams(current);
                      next.set("tab", tab);
                      next.set("page", String(value));
                      return next;
                    })
                  }
                />
              )}
            </>
          )}
        </div>
        <aside className="mj-sidebar">
          {tab === "interviews" ? (
            <InterviewCalendar
              month={calendarMonth}
              events={data?.interviewCalendar || []}
              selectedDate={selectedDate}
              loading={!data && !error}
              error={error}
              onMonth={(month) => setParams({ tab, page: "1", month })}
              onDate={(day) =>
                setParams({ tab, page: "1", month: calendarMonth, ...(day && { date: day }) })
              }
            />
          ) : (
            <>
              {["applied", "hired"].includes(tab) ? (
                <UpcomingInterviewCard
                  interview={data?.nextInterview}
                  loading={!data && !error}
                  error={error}
                />
              ) : (
                <section className="mj-side-card">
                  <h2>
                    <CalendarDays />
                    Hạn nộp & Lịch phỏng vấn <span>● Cần chú ý</span>
                  </h2>
                  {result?.deadlines.length ? (
                    result.deadlines.map((job) => (
                      <div
                        className={`mj-deadline ${new Date(job.expiresAt) - result.loadedAt <= 86400000 ? "is-urgent" : ""}`}
                        key={job.id}
                      >
                        <div>
                          <small>
                            <Clock3 />
                            {Math.max(
                              1,
                              Math.ceil((new Date(job.expiresAt) - result.loadedAt) / 3600000),
                            )}{" "}
                            giờ còn lại
                          </small>
                          <h3>{job.title}</h3>
                          <p>Hạn chót: {date(job.expiresAt)}</p>
                        </div>
                        <Link to={`/jobs/${job.id}#job-application`}>Nộp ngay</Link>
                      </div>
                    ))
                  ) : (
                    <p className="mj-side-empty">
                      Không có việc làm đã lưu sắp hết hạn trong 7 ngày tới.
                    </p>
                  )}
                  <Link className="mj-side-link" to="/my-jobs?tab=interviews">
                    Xem lịch phỏng vấn <ChevronRight />
                  </Link>
                </section>
              )}
              <section className="mj-side-card mj-matching">
                <h2>
                  <Sparkles />
                  {["applied", "hired"].includes(tab)
                    ? "Trợ lý Job Tốt Matching"
                    : "Gợi ý việc làm phù hợp"}
                </h2>
                <p className="mj-side-caption">Theo tỉnh/thành ưu tiên trong hồ sơ của bạn</p>
                {result?.recommendations.length ? (
                  result.recommendations.map((job) => (
                    <div key={job.id}>
                      <Link to={`/jobs/${job.id}`}>
                        <h3>{job.title}</h3>
                      </Link>
                      <p>{job.companyName}</p>
                      <footer>
                        <strong>{formatJobSalary(job)}</strong>
                        <Link to={`/jobs/${job.id}#job-application`}>Ứng tuyển ngay</Link>
                      </footer>
                    </div>
                  ))
                ) : (
                  <p className="mj-side-empty">Chưa có việc làm phù hợp với địa điểm đã chọn.</p>
                )}
                <Link className="mj-side-link" to="/jobs">
                  Khám phá thêm cơ hội <ChevronRight />
                </Link>
              </section>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
function EmployerInterestCard({ interest, loadedAt }) {
  const minutes = Math.max(0, Math.floor((loadedAt - new Date(interest.interestedAt)) / 60000));
  const viewedTime =
    minutes < 1
      ? "Vừa xong"
      : minutes < 60
        ? `${minutes} phút trước`
        : minutes < 1440
          ? `${Math.floor(minutes / 60)} giờ trước`
          : date(interest.interestedAt);
  const size =
    interest.companySizeMin && interest.companySizeMax
      ? `${number(interest.companySizeMin)} – ${number(interest.companySizeMax)} nhân viên`
      : interest.companySizeMin
        ? `Từ ${number(interest.companySizeMin)} nhân viên`
        : interest.companySizeMax
          ? `Đến ${number(interest.companySizeMax)} nhân viên`
          : null;
  const hiring = interest.openJobCount > 0;
  return (
    <article className="mj-employer-card">
      <header className="mj-employer-heading">
        <Link
          className="mj-employer-logo"
          to={`/companies/${interest.companyId}`}
          aria-label={`Trang công ty ${interest.companyName}`}
        >
          {interest.logoUrl?.startsWith("/uploads/companies/") ||
          safeUrl(mediaUrl(interest.logoUrl)) ? (
            <img src={mediaUrl(interest.logoUrl)} alt="" />
          ) : (
            <Building2 />
          )}
        </Link>
        <div className="mj-employer-company">
          <h2>
            <Link to={`/companies/${interest.companyId}`}>{interest.companyName}</Link>
          </h2>
          <p>
            {interest.location}
            {size && (
              <>
                <span>•</span>
                {size}
              </>
            )}
          </p>
        </div>
        {hiring && (
          <span className="mj-employer-hiring">
            <Building2 />
            Đang diễn ra tin tuyển dụng
          </span>
        )}
      </header>
      <div className="mj-employer-activity">
        <p>
          <strong>● Nhà tuyển dụng quan tâm hồ sơ của bạn</strong>
          {interest.recruiterName && (
            <>
              {" "}
              · HR phụ trách: <b>{interest.recruiterName}</b>
              {interest.recruiterTitle && ` (${interest.recruiterTitle})`}
            </>
          )}
        </p>
        <time dateTime={interest.interestedAt} title={date(interest.interestedAt)}>
          {viewedTime}
        </time>
      </div>
      {interest.recruiterEmail && (
        <div className="mj-employer-position">
          <div>
            <small>KẾT NỐI VỚI NHÀ TUYỂN DỤNG</small>
            <p>Trao đổi thêm về cơ hội việc làm phù hợp với bạn.</p>
          </div>
          <Link
            className="mj-employer-contact"
            to={`/messages?hr=${encodeURIComponent(interest.recruiterEmail)}`}
          >
            <MessageSquare />
            Phản hồi & Nhắn tin với HR
          </Link>
        </div>
      )}
      <footer className="mj-employer-links">
        <Link to={`/companies/${interest.companyId}#company-open-jobs`}>
          <BriefcaseBusiness />
          Xem {number(interest.openJobCount)} việc đang tuyển
        </Link>
        <Link to={`/companies/${interest.companyId}`}>
          <Building2 />
          Xem trang công ty
        </Link>
      </footer>
    </article>
  );
}
function MyJobsPagination({ data, onPage }) {
  return (
    <Pagination
      className="ui-pagination--card"
      aria-label="Phân trang việc làm của tôi"
      page={data.page}
      totalPages={Math.ceil(data.totalCount / data.pageSize)}
      onPageChange={onPage}
      info={
        <>
          Hiển thị {number((data.page - 1) * data.pageSize + 1)} –{" "}
          {number(Math.min(data.page * data.pageSize, data.totalCount))} trong tổng số{" "}
          {number(data.totalCount)}{" "}
          {data.tab === "saved"
            ? "việc làm đã lưu"
            : data.tab === "companies"
              ? "lượt nhà tuyển dụng quan tâm"
              : data.tab === "interviews"
                ? "lịch phỏng vấn"
                : data.tab === "hired"
                  ? "việc làm đã nhận việc"
                  : "việc làm đã ứng tuyển"}
        </>
      }
    />
  );
}
