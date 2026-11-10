import { Select } from "@/shared/ui/select";
import { formatDate } from "@/shared/lib/date-format";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/shared/ui/toast-context";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Clock3,
  FileText,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerResources } from "@/widgets/career-resources";
import { useCandidateSession } from "@/features/authenticate";
import { SaveJobButton } from "@/features/save-job";
import { companiesApi, CompanyCard } from "@/entities/company";
import "./home.css";

const tabs = [
  ["all", "Tất cả"],
  ["recent", "Việc mới 24h"],
  ["salary", "Lương > 20 triệu"],
  ["manager", "Quản lý / Trưởng phòng"],
  ["remote", "Remote / Hybrid"],
];
const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function HomePage() {
  return <HomeContent />;
}

function HomeContent() {
  const notify = useToast();
  const { account, loading } = useCandidateSession();
  const navigate = useNavigate();
  const resultsRef = useRef(null);
  const [overview, setOverview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [result, setResult] = useState(null);
  const [query, setQuery] = useState({ keyword: "", provinceId: "", industryId: "" });
  const [tab, setTab] = useState("all");
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [overviewError, setOverviewError] = useState("");
  const [follows, setFollows] = useState({ accountId: null, ids: [] });
  const [pending, setPending] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      Promise.all([
        companiesApi.metadata(controller.signal),
        companiesApi.featured(controller.signal),
      ])
        .then(([metadata, featured]) => {
          if (!controller.signal.aborted) {
            setOverview({ ...metadata, featured });
            setOverviewError("");
          }
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setOverviewError(failure.message);
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [attempt]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const search = new URLSearchParams({
          pageSize: "100",
          ...(query.keyword && { keyword: query.keyword }),
          ...(query.provinceId && { provinceId: query.provinceId }),
        });
        const [response, directory] = await Promise.all([
          fetch(`${base}/api/jobs?${search}`, { signal: controller.signal }),
          companiesApi.list(
            new URLSearchParams({
              pageSize: "100",
              ...(query.industryId && { industryId: query.industryId }),
            }),
            controller.signal,
          ),
        ]);
        if (!response.ok) throw new Error("Không thể tải việc làm. Vui lòng thử lại.");
        const data = await response.json();
        if (!controller.signal.aborted) {
          setResult({ ...data, query, loadedAt: Date.now() });
          setCompanies(directory.items);
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
  }, [query, attempt]);

  useEffect(() => {
    if (!account) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      companiesApi
        .followed(controller.signal)
        .then((ids) => {
          if (!controller.signal.aborted) setFollows({ accountId: account.id, ids });
        })
        .catch((failure) => {
          if (!controller.signal.aborted) notify(failure.message, { type: "error" });
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [account, notify]);

  async function follow(company) {
    if (!account) {
      notify("Đăng nhập để theo dõi doanh nghiệp bạn quan tâm.", {
        type: "info",
        action: { to: "/login", label: "Đăng nhập" },
      });
      return;
    }
    const followed = follows.ids.includes(company.id);
    setPending((ids) => [...ids, company.id]);
    try {
      await companiesApi.follow(company.id, !followed);
      setFollows((current) => ({
        accountId: account.id,
        ids: followed
          ? current.ids.filter((id) => id !== company.id)
          : [...current.ids, company.id],
      }));
      notify(followed ? `Đã bỏ theo dõi ${company.name}.` : `Đã theo dõi ${company.name}.`);
    } catch (failure) {
      notify(failure.message, { type: "error" });
    } finally {
      setPending((ids) => ids.filter((id) => id !== company.id));
    }
  }

  const companyById = new Map(companies.map((company) => [company.id, company]));
  const items = (result?.query === query ? result.items : []).filter((job) => {
    if (query.industryId && !companyById.has(job.companyId)) return false;
    if (tab === "recent") return result.loadedAt - new Date(job.createdAt).getTime() <= 86400000;
    if (tab === "salary") return (job.salaryMax || job.salaryMin || 0) > 20000000;
    if (tab === "manager") return /quản lý|trưởng|manager|lead|head/i.test(job.title);
    if (tab === "remote")
      return /remote|hybrid|từ xa/i.test(`${job.location} ${job.title} ${job.description}`);
    return true;
  });
  const count = (value) => Number(value).toLocaleString("vi-VN");

  return (
    <div className="companies-page home-page font-roboto">
      <title>Job Tốt | Tìm việc làm, kết nối doanh nghiệp và phát triển sự nghiệp</title>
      <AuthHeader userName={account?.fullName} loading={loading} />
      <main className="page-container">
        <div className="home-discovery">
          <section className="home-hero" aria-labelledby="home-heading">
            <p className="home-ai">
              <Sparkles />
              Cơ hội mới. Bước tiến mới.
            </p>
            <h1 id="home-heading">
              Tìm việc bạn yêu thích,{" "}
              <span className="home-hero-emphasis">bắt nhịp tương lai.</span>
            </h1>
            <p className="home-description">
              Khám phá công việc từ{" "}
              {overview
                ? `${count(overview.stats.totalCompanies)} nhà tuyển dụng`
                : "các nhà tuyển dụng"}
              , tìm nơi phù hợp với bạn và tự tin cho bước tiến tiếp theo.
            </p>
          </section>
          <form
            className="company-search home-search"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setQuery({
                keyword: data.get("keyword").trim(),
                provinceId: data.get("provinceId"),
                industryId: data.get("industryId"),
              });
              setTab("all");
              setError("");
              resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <label>
              <Search />
              <input
                name="keyword"
                maxLength={200}
                placeholder="Từ khóa công việc"
                aria-label="Từ khóa công việc"
              />
            </label>
            <label>
              <MapPin />
              <span>
                ĐỊA ĐIỂM
                <Select
                  variant="embedded"
                  name="provinceId"
                  aria-label="Địa điểm"
                  disabled={!overview}
                >
                  <option value="">Tất cả tỉnh, thành</option>
                  {overview?.provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </Select>
              </span>
            </label>
            <label>
              <BriefcaseBusiness />
              <span>
                NGÀNH NGHỀ
                <Select variant="embedded" name="industryId" aria-label="Ngành nghề">
                  <option value="">Tất cả ngành nghề</option>
                  {overview?.industries.map((industry) => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </Select>
              </span>
            </label>
            <button className="company-primary" type="submit">
              <Search />
              Tìm việc ngay
            </button>
          </form>
          <aside className="home-opportunity" aria-label="Khám phá cơ hội nghề nghiệp">
            <div className="home-opportunity-heading">
              <span>
                <Sparkles />
                HÀNH TRÌNH CỦA BẠN
              </span>
              <ArrowUpRight aria-hidden="true" />
            </div>
            <p className="home-opportunity-title">
              Một bước mới,
              <br />
              nhiều cơ hội hơn.
            </p>
            <div className="home-opportunity-stats">
              <Link to="/jobs">
                <BriefcaseBusiness aria-hidden="true" />
                <strong>{overview ? count(overview.stats.openJobs) : "Tìm việc"}</strong>
                <span>{overview ? "việc làm đang mở" : "Khám phá việc làm"}</span>
              </Link>
              <Link to="/companies">
                <Building2 aria-hidden="true" />
                <strong>{overview ? count(overview.stats.totalCompanies) : "Kết nối"}</strong>
                <span>nhà tuyển dụng</span>
              </Link>
            </div>
            <Link className="home-opportunity-cv" to="/cv-templates">
              <span>
                <FileText aria-hidden="true" />
                Làm mới CV, sẵn sàng tỏa sáng
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </aside>
        </div>
        <section className="company-featured" aria-labelledby="home-companies">
          <div className="company-section-heading">
            <div>
              <p>
                <BriefcaseBusiness />
                ĐỐI TÁC TUYỂN DỤNG CHIẾN LƯỢC
              </p>
              <h2 id="home-companies">Doanh nghiệp TOP đầu đang tuyển dụng</h2>
            </div>
            <Link className="company-text-button" to="/companies">
              Xem tất cả {overview && `${count(overview.stats.totalCompanies)} `}doanh nghiệp{" "}
              <ArrowRight />
            </Link>
          </div>
          {overviewError ? (
            <div role="alert" className="company-error">
              {overviewError}
              <button onClick={() => setAttempt((value) => value + 1)}>Thử lại</button>
            </div>
          ) : !overview ? (
            <p role="status" className="home-muted">
              Đang tải doanh nghiệp…
            </p>
          ) : overview.featured.length ? (
            <div className="company-featured-grid">
              {overview.featured.slice(0, 4).map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  featured
                  followed={
                    !!account &&
                    follows.accountId === account.id &&
                    follows.ids.includes(company.id)
                  }
                  pending={
                    pending.includes(company.id) || (!!account && follows.accountId !== account.id)
                  }
                  onFollow={follow}
                  onJobs={(item) =>
                    navigate(`/companies/${encodeURIComponent(item.id)}#company-open-jobs`)
                  }
                />
              ))}
            </div>
          ) : (
            <p className="home-muted">Chưa có doanh nghiệp nổi bật.</p>
          )}
        </section>
        <section className="home-jobs" ref={resultsRef} aria-labelledby="home-jobs-heading">
          <div className="home-jobs-heading">
            <h2 id="home-jobs-heading">Việc làm HOT lương cao đề xuất cho bạn</h2>
            <div className="home-tabs" aria-label="Lọc việc làm">
              {tabs.map(([value, label]) => (
                <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {error ? (
            <div role="alert" className="company-error">
              {error}
              <button onClick={() => setAttempt((value) => value + 1)}>Thử lại</button>
            </div>
          ) : result?.query !== query ? (
            <p role="status" className="home-muted">
              Đang tải việc làm…
            </p>
          ) : items.length ? (
            <div className="home-job-grid">
              {items.slice(0, 9).map((job) => (
                <article className="home-job-card" key={job.id}>
                  <span className="home-job-time">
                    <Clock3 />
                    {job.createdAt ? formatDate(job.createdAt) : "Đang tuyển"}
                  </span>
                  <h3>
                    <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                  </h3>
                  <Link
                    className="home-job-company"
                    to={`/companies/${encodeURIComponent(job.companyId)}`}
                  >
                    <BadgeCheck />
                    {companyById.get(job.companyId)?.name || "Xem thông tin doanh nghiệp"}
                  </Link>
                  <div className="home-job-bottom">
                    <div>
                      <strong>
                        {job.salaryMin || job.salaryMax
                          ? `${job.salaryMin ? count(job.salaryMin / 1000000) : ""}${job.salaryMin && job.salaryMax ? " – " : ""}${job.salaryMax ? count(job.salaryMax / 1000000) : ""} triệu`
                          : "Lương thỏa thuận"}
                      </strong>
                      <span>
                        <MapPin />
                        {job.location || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div className="home-job-actions">
                      <Link className="company-primary" to={`/jobs/${job.id}#job-application`}>
                        Ứng tuyển ngay
                      </Link>
                      <SaveJobButton jobId={job.id} title={job.title} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="company-empty">
              <BriefcaseBusiness />
              <h3>Chưa có việc làm phù hợp</h3>
              <p>Thử thay đổi từ khóa, địa điểm hoặc bộ lọc.</p>
            </div>
          )}
          <div className="home-more">
            <Link to="/jobs">
              <BriefcaseBusiness />
              Khám phá thêm việc làm đang tuyển <ArrowRight />
            </Link>
          </div>
        </section>
        <CareerResources />
      </main>
      <AuthFooter />
    </div>
  );
}
