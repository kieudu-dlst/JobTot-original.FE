import { formatDate } from "@/shared/lib/date-format";
import { mediaUrl } from "@/shared/lib/media-url";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileText,
  Gift,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { jobsApi, formatJobSalary } from "@/entities/job";
import { companiesApi } from "@/entities/company";
import { SaveJobButton } from "@/features/save-job";
import { ApplicationForm } from "@/features/apply-job";
import { useCandidateSession } from "@/features/authenticate";
import { useToast } from "@/shared/ui/toast-context";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerResources } from "@/widgets/career-resources";
import "./job-detail.css";

const experiences = {
  none: "Không yêu cầu kinh nghiệm",
  "under-1": "Dưới 1 năm",
  "1-3": "1 – 3 năm",
  "3-5": "3 – 5 năm",
  "over-5": "Trên 5 năm",
};
const positions = {
  intern: "Thực tập sinh / Sinh viên",
  employee: "Nhân viên",
  supervisor: "Trưởng nhóm / Giám sát",
  manager: "Quản lý / Trưởng phòng",
  director: "Giám đốc / Cấp cao",
};
const types = {
  "full-time": "Toàn thời gian",
  "part-time": "Bán thời gian",
  internship: "Thực tập",
  remote: "Remote / Từ xa",
  flexible: "Hybrid linh hoạt",
};
const lines = (value) =>
  (value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
export function JobDetailPage() {
  const { id } = useParams();
  return <JobDetail key={id} id={id} />;
}
function JobDetail({ id }) {
  const { account, loading } = useCandidateSession();
  const { hash } = useLocation();
  const notify = useToast();
  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState("");
  const [companyError, setCompanyError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      jobsApi
        .detail(id, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;
          setJob(data);
          setError("");
          companiesApi
            .detail(data.companyId, controller.signal)
            .then((value) => {
              if (!controller.signal.aborted) {
                setCompany(value);
                setCompanyError("");
              }
            })
            .catch((failure) => {
              if (!controller.signal.aborted) setCompanyError(failure.message);
            });
          jobsApi
            .search(
              new URLSearchParams({ companyId: data.companyId, pageSize: "4" }),
              controller.signal,
            )
            .then((value) => {
              if (!controller.signal.aborted)
                setRelated(value.items.filter((item) => item.id !== id).slice(0, 3));
            })
            .catch(() => {});
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setError(failure.message);
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, attempt]);
  useEffect(() => {
    if (!job) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    if (hash === "#job-application") {
      const timer = setTimeout(
        () => document.getElementById("job-application")?.scrollIntoView({ block: "start" }),
        0,
      );
      return () => clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id, job, hash]);
  const closed = job && (job.isClosed || new Date(job.expiresAt) <= new Date());
  async function share() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/jobs/${id}`);
      notify("Đã sao chép liên kết việc làm.");
    } catch {
      notify("Không thể sao chép liên kết. Bạn có thể sao chép địa chỉ trên trình duyệt.", {
        type: "error",
      });
    }
  }
  const companyUrl = job ? `/companies/${job.companyId}` : "/companies";
  return (
    <div className="job-detail-page font-roboto">
      <title>{job ? `${job.title} | Job Tốt` : "Chi tiết việc làm | Job Tốt"}</title>
      <AuthHeader userName={account?.fullName} loading={loading} />
      <main className="jd-container">
        <nav className="jd-breadcrumb" aria-label="Đường dẫn">
          <Link to="/">Trang chủ</Link>
          <ChevronRight />
          <Link to="/jobs">Việc làm</Link>
          <ChevronRight />
          {job && <Link to={companyUrl}>{job.companyName}</Link>}
        </nav>
        {error ? (
          <div role="alert" className="jd-panel jd-error">
            {error}
            <button onClick={() => setAttempt((value) => value + 1)}>Thử lại</button>
            <Link to="/jobs">Quay lại danh sách việc làm</Link>
          </div>
        ) : !job ? (
          <div className="jd-panel" role="status">
            Đang tải chi tiết việc làm…
          </div>
        ) : (
          <>
            <section className="jd-panel jd-hero">
              <div className="jd-hero-top">
                <div className="jd-job-identity">
                  <div className="jd-logo">
                    {job.companyLogoUrl ? (
                      <img
                        src={mediaUrl(job.companyLogoUrl)}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                      />
                    ) : (
                      <BriefcaseBusiness />
                    )}
                  </div>
                  <div>
                    <div className="jd-badges">
                      {job.employmentType && <span>{types[job.employmentType]}</span>}
                      {job.isVerified && (
                        <span>
                          <ShieldCheck />
                          Doanh nghiệp xác thực
                        </span>
                      )}
                    </div>
                    <h1>{job.title}</h1>
                    <Link className="jd-company-name" to={companyUrl}>
                      {job.companyName}
                      {job.isVerified && <BadgeCheck />}
                    </Link>
                  </div>
                </div>
                <div className="jd-hero-actions">
                  {closed ? (
                    <span className="jd-closed">Đã ngừng nhận hồ sơ</span>
                  ) : (
                    <a className="jd-primary" href="#job-application">
                      Ứng tuyển ngay
                    </a>
                  )}
                  <SaveJobButton jobId={id} title={job.title} />
                  <button className="jd-icon-button" onClick={share} aria-label="Chia sẻ việc làm">
                    <Share2 />
                  </button>
                  {job.recruiterEmail && (
                    <a
                      className="jd-contact-link"
                      href={`/messages?hr=${encodeURIComponent(job.recruiterEmail)}`}
                    >
                      <MessageCircle />
                      Liên hệ với HR
                    </a>
                  )}
                </div>
              </div>
              <div className="jd-summary">
                <Summary icon={Banknote} label="MỨC LƯƠNG" value={formatJobSalary(job)} orange />
                <Summary icon={MapPin} label="ĐỊA ĐIỂM" value={job.location} />
                <Summary
                  icon={BriefcaseBusiness}
                  label="KINH NGHIỆM"
                  value={experiences[job.experienceLevel] || "Chưa cập nhật"}
                />
                <Summary
                  icon={CalendarClock}
                  label="HẠN NỘP HỒ SƠ"
                  value={formatDate(job.expiresAt)}
                  note={closed ? "Đã kết thúc" : "Đang nhận hồ sơ"}
                />
              </div>
            </section>
            <div className="jd-grid">
              <div className="jd-main-column">
                <section className="jd-panel">
                  <h2>
                    <Gift />
                    Phúc lợi & Quyền lợi đặc biệt
                  </h2>
                  {job.benefits ? (
                    <div className="jd-benefits">
                      {job.benefits
                        .split(/\||\r?\n/)
                        .filter((value) => value.trim())
                        .map((benefit, index) => (
                          <div key={`${index}:${benefit}`}>
                            <span className={`jd-benefit-icon jd-tone-${index % 4}`}>
                              <Gift />
                            </span>
                            <strong>{benefit.trim()}</strong>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p>Nhà tuyển dụng chưa cập nhật phúc lợi cho vị trí này.</p>
                  )}
                </section>
                <section className="jd-panel">
                  <h2>
                    <FileText />
                    Mô tả công việc
                  </h2>
                  <div className="jd-description">
                    {lines(job.description).map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </section>
                <section className="jd-panel">
                  <h2>
                    <ShieldCheck />
                    Yêu cầu ứng viên
                  </h2>
                  {job.requirements ? (
                    <ul className="jd-requirements">
                      {lines(job.requirements).map((line, index) => (
                        <li key={index}>
                          <CheckCircle2 />
                          <span>{line.replace(/^[-•]\s*/, "")}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Nhà tuyển dụng chưa cập nhật yêu cầu chi tiết.</p>
                  )}
                </section>
                <section className="jd-panel">
                  <h2>
                    <BriefcaseBusiness />
                    Quy trình phỏng vấn & Tuyển dụng
                  </h2>
                  {job.hiringProcess ? (
                    <ol className="jd-timeline">
                      {lines(job.hiringProcess).map((line, index) => {
                        const [title, ...description] = line.split("|");
                        return (
                          <li key={index}>
                            <span className="jd-step-number">{index + 1}</span>
                            <div>
                              <small>VÒNG {index + 1}</small>
                              <h3>{title}</h3>
                              {description.length > 0 && <p>{description.join(" · ")}</p>}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p>Quy trình tuyển dụng sẽ được trao đổi khi nhà tuyển dụng liên hệ.</p>
                  )}
                </section>
                <ApplicationForm job={job} closed={closed} account={account} loading={loading} />
              </div>
              <aside className="jd-sidebar">
                <section className="jd-panel">
                  <h2>
                    <BriefcaseBusiness />
                    Thông tin công việc tóm tắt
                  </h2>
                  <dl>
                    {[
                      ["Cấp bậc", positions[job.positionLevel]],
                      ["Hình thức làm việc", types[job.employmentType]],
                      ["Thời gian làm việc", job.workSchedule],
                      ["Số lượng tuyển", job.vacancies ? `${job.vacancies} nhân sự` : null],
                      [
                        "Giới tính",
                        job.genderRequirement === "any" ? "Không yêu cầu" : job.genderRequirement,
                      ],
                      ["Độ tuổi phù hợp", job.ageRequirement],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value || "Chưa cập nhật"}</dd>
                      </div>
                    ))}
                  </dl>
                  {job.recruiterName && (
                    <div className="jd-recruiter">
                      <small>BỘ PHẬN TUYỂN DỤNG PHỤ TRÁCH</small>
                      <div className="jd-recruiter-person">
                        <span>
                          <Users />
                        </span>
                        <div>
                          <strong>{job.recruiterName}</strong>
                          <p>{job.recruiterTitle || "Bộ phận tuyển dụng"}</p>
                        </div>
                      </div>
                      {job.recruiterEmail && (
                        <a
                          className="jd-contact-link"
                          href={`/messages?hr=${encodeURIComponent(job.recruiterEmail)}`}
                        >
                          <MessageCircle />
                          Liên hệ với HR
                        </a>
                      )}
                    </div>
                  )}
                </section>
                <section className="jd-panel jd-company-panel">
                  <h2>
                    {job.companyName}
                    {job.isVerified && <BadgeCheck />}
                  </h2>
                  {company ? (
                    <>
                      <p className="jd-company-about">{company.description}</p>
                      <p>
                        <Users />
                        {company.sizeMin || company.sizeMax
                          ? `${Number(company.sizeMin || company.sizeMax).toLocaleString("vi-VN")}${company.sizeMax > company.sizeMin ? ` – ${Number(company.sizeMax).toLocaleString("vi-VN")}` : ""} nhân viên`
                          : "Chưa cập nhật quy mô"}
                      </p>
                      <p>
                        <MapPin />
                        {[company.address, company.province].filter(Boolean).join(", ") ||
                          job.location}
                      </p>
                      {company.coverUrl && (
                        <img
                          className="jd-company-cover"
                          src={mediaUrl(company.coverUrl)}
                          alt={`Không gian làm việc tại ${company.name}`}
                          loading="lazy"
                        />
                      )}
                    </>
                  ) : (
                    <p>{companyError || "Đang tải thông tin doanh nghiệp…"}</p>
                  )}
                  <div className="jd-company-links">
                    <Link to={companyUrl}>Xem công ty</Link>
                    <Link to={`${companyUrl}#company-open-jobs`}>Việc làm khác</Link>
                  </div>
                </section>
                {related.length > 0 && (
                  <section className="jd-panel jd-related">
                    <h2>Việc làm tương tự tại công ty</h2>
                    {related.map((item) => (
                      <Link key={item.id} to={`/jobs/${item.id}`}>
                        <h3>{item.title}</h3>
                        <strong>{formatJobSalary(item)}</strong>
                        <p>{item.location}</p>
                        {item.employmentType && <span>{types[item.employmentType]}</span>}
                      </Link>
                    ))}
                  </section>
                )}
              </aside>
            </div>
          </>
        )}
      </main>
      <div className="jd-resources">
        <CareerResources />
      </div>
      <AuthFooter />
    </div>
  );
}
function Summary({ icon: Icon, label, value, note, orange }) {
  return (
    <div>
      <span className={`jd-summary-icon ${orange ? "jd-tone-0" : "jd-tone-1"}`}>
        <Icon />
      </span>
      <div>
        <small>{label}</small>
        <strong className={orange ? "jd-orange" : ""}>{value}</strong>
        {note && <span className="jd-orange">{note}</span>}
      </div>
    </div>
  );
}
