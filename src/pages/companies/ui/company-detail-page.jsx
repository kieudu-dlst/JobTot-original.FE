import { mediaUrl } from "@/shared/lib/media-url";
import { CompanyMap } from "@/shared/ui/company-map";
import { useEffect, useLayoutEffect, useState } from "react";
import { Pagination } from "@/shared/ui/pagination";
import { useToast } from "@/shared/ui/toast-context";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  Building2,
  MapPin,
  Users,
  BadgeCheck,
  BriefcaseBusiness,
  Heart,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerResources } from "@/widgets/career-resources";
import { useCandidateSession } from "@/features/authenticate";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { companiesApi } from "../api/companies";
import { CompanyLogo } from "./company-card";
import "./companies.css";
import "./company-detail.css";

export function CompanyDetailPage() {
  const { id } = useParams();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [id]);

  return <CompanyDetail key={id} id={id} />;
}

function CompanyDetail({ id }) {
  const notify = useToast();
  const { hash } = useLocation();
  const { account, loading } = useCandidateSession();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState("");
  const [jobsError, setJobsError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(1);
  const [followed, setFollowed] = useState(false);
  const [pending, setPending] = useState(false);

  useLayoutEffect(() => {
    if (company && hash === "#company-open-jobs") {
      document
        .getElementById("company-open-jobs")
        ?.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [company, hash]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      companiesApi
        .detail(id, controller.signal)
        .then((value) => {
          if (!controller.signal.aborted) {
            setCompany(value);
            setError("");
          }
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setError(failure.message);
        });
      companiesApi
        .featured(controller.signal)
        .then((value) => {
          if (!controller.signal.aborted)
            setRelated(value.filter((item) => item.id !== id).slice(0, 3));
        })
        .catch(() => {});
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, attempt]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      companiesApi
        .jobs(id, page, controller.signal)
        .then((value) => {
          if (!controller.signal.aborted) {
            setJobs({ ...value, page });
            setJobsError("");
          }
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setJobsError(failure.message);
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, page, attempt]);

  useEffect(() => {
    if (!account) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      companiesApi
        .followed(controller.signal)
        .then((ids) => {
          if (!controller.signal.aborted) setFollowed(ids.includes(id));
        })
        .catch((failure) => {
          if (!controller.signal.aborted) notify(failure.message, { type: "error" });
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [account, id, notify]);

  async function toggleFollow() {
    if (!account) {
      notify("Đăng nhập để theo dõi doanh nghiệp.", {
        type: "info",
        action: { to: "/login", label: "Đăng nhập" },
      });
      return;
    }
    setPending(true);
    try {
      await companiesApi.follow(id, !followed);
      setFollowed(!followed);
      notify(followed ? `Đã bỏ theo dõi ${company.name}.` : `Đã theo dõi ${company.name}.`);
    } catch (failure) {
      notify(failure.message, { type: "error" });
    } finally {
      setPending(false);
    }
  }

  const location = company && [company.address, company.province].filter(Boolean).join(", ");
  const size =
    company?.sizeMin || company?.sizeMax
      ? `${company.sizeMin || company.sizeMax}${company.sizeMax && company.sizeMax !== company.sizeMin ? ` – ${company.sizeMax}` : company.sizeMax ? "" : "+"} nhân viên`
      : "Chưa cập nhật";
  return (
    <div className="companies-page company-detail-page font-roboto">
      <title>{company ? `${company.name} | Job Tốt` : "Chi tiết doanh nghiệp | Job Tốt"}</title>
      <AuthHeader userName={account?.fullName} loading={loading} />
      <main className="page-container company-container">
        <PageBreadcrumb
          parents={[{ to: "/companies", label: "Doanh nghiệp" }]}
          current={company?.name || "Chi tiết doanh nghiệp"}
        />
        {error ? (
          <div role="alert" className="company-error">
            {error}
            <button onClick={() => setAttempt((x) => x + 1)}>Thử lại</button>
          </div>
        ) : !company ? (
          <p role="status">Đang tải thông tin doanh nghiệp…</p>
        ) : (
          <>
            <section className="detail-hero">
              <div className="detail-cover">
                {company.coverUrl ? (
                  <img
                    src={mediaUrl(company.coverUrl)}
                    alt={`Không gian làm việc tại ${company.name}`}
                  />
                ) : (
                  <div className="detail-cover-placeholder">
                    <Building2 />
                    <span>Khám phá môi trường làm việc tại {company.name}</span>
                  </div>
                )}
                {company.province && (
                  <span className="detail-cover-location">
                    <MapPin />
                    {company.province}
                  </span>
                )}
              </div>
              <div className="detail-identity">
                <CompanyLogo company={company} />
                <div className="detail-identity-info">
                  <h1>{company.name}</h1>
                  <div className="company-badges">
                    {company.isVerified && (
                      <span>
                        <BadgeCheck />
                        Doanh nghiệp đã xác thực
                      </span>
                    )}
                    {company.industry && <span>{company.industry}</span>}
                  </div>
                  <p>
                    <MapPin />
                    {location || "Chưa cập nhật địa chỉ"}
                  </p>
                  <p>
                    <Users />
                    {size}
                  </p>
                </div>
                <div className="detail-identity-actions">
                  <Link
                    className="detail-follow"
                    to={`/messages?company=${encodeURIComponent(id)}`}
                  >
                    <MessageCircle />
                    Liên hệ với HR
                  </Link>
                  <a className="company-primary" href="#company-open-jobs">
                    <BriefcaseBusiness />
                    Việc làm đang tuyển ({company.openJobCount})
                  </a>
                  <button
                    className="detail-follow"
                    aria-pressed={!!account && followed}
                    disabled={pending}
                    onClick={toggleFollow}
                  >
                    <Heart fill={account && followed ? "currentColor" : "none"} />
                    {account && followed ? "Đang theo dõi" : "Theo dõi công ty"}
                  </button>
                </div>
              </div>
            </section>
            <div className="detail-columns">
              <div className="detail-main">
                <section className="detail-panel">
                  <h2>Về {company.name}</h2>
                  <p className="detail-description">
                    {company.description || "Doanh nghiệp chưa cập nhật giới thiệu."}
                  </p>
                  <div className="detail-stats">
                    <div>
                      <strong>{company.openJobCount}</strong>
                      <span>Việc làm đang mở</span>
                    </div>
                    <div>
                      <strong>{size}</strong>
                      <span>Quy mô doanh nghiệp</span>
                    </div>
                    <div>
                      <strong>{company.isVerified ? "Đã xác thực" : "Chưa xác thực"}</strong>
                      <span>Thông tin doanh nghiệp</span>
                    </div>
                  </div>
                </section>
                {company.brand && (
                  <>
                    <section className="detail-panel">
                      <h2>Thông tin thương hiệu doanh nghiệp</h2>
                      <dl className="detail-facts">
                        {[
                          ["Tên thương mại quốc tế", company.brand.englishName],
                          ["Người đại diện / Lãnh đạo", company.brand.representative],
                          ["Nguồn vốn / Vốn điều lệ", company.brand.capital],
                          ["Thời gian làm việc tiêu chuẩn", company.brand.workingHours],
                          ["Ngành nghề / Lĩnh vực", company.industry],
                        ]
                          .filter(([, value]) => value)
                          .map(([label, value]) => (
                            <div key={label}>
                              <dt>{label}</dt>
                              <dd>{value}</dd>
                            </div>
                          ))}
                      </dl>
                    </section>
                    {(company.brand.story || company.brand.values) && (
                      <section className="detail-panel">
                        <h2>Câu chuyện Văn hóa & Tuyên ngôn Giá trị</h2>
                        <p className="detail-description">{company.brand.story}</p>
                        {company.brand.values && (
                          <p className="detail-description">{company.brand.values}</p>
                        )}
                      </section>
                    )}
                    {company.brand.highlights?.length > 0 && (
                      <section className="detail-panel">
                        <h2>Chỉ số & Điểm nổi bật</h2>
                        {company.brand.highlights.map((item, index) => (
                          <div className="detail-brand-item" key={index}>
                            <h3>{item.title}</h3>
                            <p className="detail-description">{item.description}</p>
                            {item.tag && <small>{item.tag}</small>}
                          </div>
                        ))}
                      </section>
                    )}
                    {[
                      ["Phúc lợi & Đãi ngộ", company.brand.benefits],
                      ["Quy trình tuyển dụng", company.brand.hiringProcess],
                      ["Hoạt động văn hóa", company.brand.activities],
                    ].map(
                      ([title, items]) =>
                        items?.length > 0 && (
                          <section className="detail-panel" key={title}>
                            <h2>{title}</h2>
                            {items.map((item, index) => (
                              <div className="detail-brand-item" key={index}>
                                <h3>{item.title}</h3>
                                <p className="detail-description">{item.description}</p>
                                {item.tag && <small>{item.tag}</small>}
                              </div>
                            ))}
                          </section>
                        ),
                    )}
                    {(company.brand.workplace || company.brand.workLife) && (
                      <section className="detail-panel">
                        <h2>Môi trường làm việc & Đời sống công ty</h2>
                        <p className="detail-description">{company.brand.workplace}</p>
                        <p className="detail-description">{company.brand.workLife}</p>
                      </section>
                    )}
                    {company.brand.gallery?.length > 0 && (
                      <section className="detail-panel">
                        <h2>Thư viện Hình ảnh & Không gian Công ty</h2>
                        <div className="detail-brand-gallery">
                          {company.brand.gallery.map((url, index) => (
                            <img
                              key={index}
                              src={mediaUrl(url)}
                              loading="lazy"
                              alt={`Không gian doanh nghiệp ${index + 1}`}
                            />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
                <section className="detail-panel" id="company-open-jobs">
                  <h2>Việc làm đang tuyển tại {company.name}</h2>
                  <p className="detail-muted">Khám phá cơ hội nghề nghiệp phù hợp với bạn.</p>
                  {jobsError ? (
                    <div role="alert" className="company-error">
                      {jobsError}
                      <button onClick={() => setAttempt((x) => x + 1)}>Thử lại</button>
                    </div>
                  ) : !jobs || jobs.page !== page ? (
                    <p role="status">Đang tải việc làm…</p>
                  ) : (
                    <>
                      {jobs.items.length ? (
                        jobs.items.map((job) => (
                          <article className="detail-job" key={job.id}>
                            <div>
                              <span className="detail-job-company">{company.name}</span>
                              <h3>
                                <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                              </h3>
                              <p>
                                <MapPin />
                                {job.location || "Chưa cập nhật"}
                                <span>
                                  {job.salaryMin || job.salaryMax
                                    ? `${Number(job.salaryMin || 0).toLocaleString("vi-VN")} – ${Number(job.salaryMax || 0).toLocaleString("vi-VN")} VND`
                                    : "Lương thỏa thuận"}
                                </span>
                              </p>
                              <details>
                                <summary>Xem mô tả công việc</summary>
                                <p className="detail-description">{job.description}</p>
                              </details>
                            </div>
                            <Link
                              className="company-primary"
                              to={`/jobs/${job.id}#job-application`}
                            >
                              Ứng tuyển ngay <ArrowRight />
                            </Link>
                          </article>
                        ))
                      ) : (
                        <p>Doanh nghiệp chưa có việc làm đang mở.</p>
                      )}
                      {jobs.totalCount > 10 && (
                        <Pagination
                          aria-label="Phân trang việc làm"
                          page={page}
                          totalPages={Math.ceil(jobs.totalCount / 10)}
                          onPageChange={setPage}
                        />
                      )}
                    </>
                  )}
                </section>
              </div>
              <aside className="detail-sidebar">
                <section className="detail-panel">
                  <h2>
                    <Building2 />
                    Thông tin doanh nghiệp
                  </h2>
                  <dl className="detail-facts">
                    {[
                      ["Ngành nghề", company.industry],
                      ["Quy mô nhân sự", size],
                      ["Địa chỉ", location],
                      ["Việc làm đang mở", String(company.openJobCount)],
                      ["Xác thực", company.isVerified ? "Đã xác thực" : "Chưa xác thực"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value || "Chưa cập nhật"}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <section className="detail-panel">
                  <div className="detail-map-heading">
                    <h2>
                      <MapPin />
                      Vị trí trụ sở trên bản đồ
                    </h2>
                    <span className="detail-map-badge">Vị trí doanh nghiệp</span>
                  </div>
                  <CompanyMap address={company.address} province={company.province} />
                </section>
                <section className="detail-panel detail-safety">
                  <h2>
                    <ShieldCheck />
                    Ứng tuyển an toàn
                  </h2>
                  <p>Kiểm tra thông tin nhà tuyển dụng và không chuyển tiền để được nhận việc.</p>
                  <Link to="/profile" className="company-text-button">
                    Hoàn thiện hồ sơ của bạn →
                  </Link>
                </section>
                {related.length > 0 && (
                  <section className="detail-panel">
                    <h2>Khám phá doanh nghiệp khác</h2>
                    {related.map((item) => (
                      <Link
                        className="detail-related"
                        to={`/companies/${encodeURIComponent(item.id)}`}
                        key={item.id}
                      >
                        <CompanyLogo company={item} />
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.openJobCount} việc làm đang mở</small>
                        </span>
                        <ArrowRight />
                      </Link>
                    ))}
                  </section>
                )}
              </aside>
            </div>
          </>
        )}
        <CareerResources />
      </main>
      <AuthFooter />
    </div>
  );
}
