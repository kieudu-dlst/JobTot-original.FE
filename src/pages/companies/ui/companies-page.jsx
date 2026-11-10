import { Select } from "@/shared/ui/select";
import { CareerResources } from "@/widgets/career-resources";
import { useToast } from "@/shared/ui/toast-context";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  Building2,
  BadgeCheck,
  BriefcaseBusiness,
  Flame,
  SlidersHorizontal,
  ArrowRight,
  ChevronRight,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Pagination } from "@/shared/ui/pagination";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { useCandidateSession } from "@/features/authenticate";
import { ServiceNotice } from "@/shared/ui/service-notice";
import { companiesApi } from "../api/companies";
import { CompanyCard } from "./company-card";
import "./companies.css";

const sizes = [
  [1, 50, "1 – 50 nhân viên"],
  [51, 200, "51 – 200 nhân viên"],
  [201, 500, "201 – 500 nhân viên"],
  [501, 1000, "501 – 1.000 nhân viên"],
  [1001, "", "Trên 1.000 nhân viên"],
];
const number = (value) => Number(value || 0).toLocaleString("vi-VN");

export function CompaniesPage() {
  const notify = useToast();
  const navigate = useNavigate();
  const { account, loading: sessionLoading } = useCandidateSession();
  const [params, setParams] = useSearchParams();
  const [listing, setListing] = useState(null);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [overviewError, setOverviewError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [follows, setFollows] = useState({ accountId: null, ids: [] });
  const [pendingFollow, setPendingFollow] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const accountId = account?.id;
  const query = params.toString();
  const page = Math.max(1, Math.min(1000000, Math.trunc(Number(params.get("page"))) || 1));
  const sort = params.get("sort") || "relevant";
  const followedIds = follows.accountId === accountId ? follows.ids : [];
  const loading = !listing || listing.query !== query;

  useEffect(() => {
    const controller = new AbortController();
    const search = new URLSearchParams(query);
    search.set("page", String(page));
    search.set("pageSize", "10");
    // Let StrictMode's immediate cleanup cancel the scheduled work before sending HTTP requests.
    const timer = setTimeout(() => {
      companiesApi
        .list(search, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;
          setListing({ ...data, query });
          setError("");
        })
        .catch((failure) => {
          if (!controller.signal.aborted) {
            setError(failure.message);
            setListing({ query, items: [], totalCount: 0 });
          }
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, page, attempt]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      Promise.all([
        companiesApi.metadata(controller.signal),
        companiesApi.featured(controller.signal),
      ])
        .then(([metadata, featured]) => {
          if (controller.signal.aborted) return;
          setOverview({ ...metadata, featured });
          setOverviewError("");
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
    if (!accountId) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      companiesApi
        .followed(controller.signal)
        .then((ids) => {
          if (!controller.signal.aborted) setFollows({ accountId, ids });
        })
        .catch((failure) => {
          if (!controller.signal.aborted) notify(failure.message, { type: "error" });
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [accountId, attempt, notify]);

  function update(changes) {
    const next = new URLSearchParams(params);
    next.delete("page");
    for (const [key, value] of Object.entries(changes)) {
      if (value === "" || value === false || value == null) next.delete(key);
      else next.set(key, String(value));
    }
    setParams(next);
  }
  async function follow(company) {
    if (!account) {
      notify("Đăng nhập để theo dõi doanh nghiệp bạn quan tâm.", {
        type: "info",
        action: { to: "/login", label: "Đăng nhập" },
      });
      return;
    }
    const followed = !followedIds.includes(company.id);
    setPendingFollow((ids) => [...ids, company.id]);
    try {
      await companiesApi.follow(company.id, followed);
      setFollows((current) =>
        current.accountId === accountId
          ? {
              accountId,
              ids: followed
                ? [...new Set([...current.ids, company.id])]
                : current.ids.filter((id) => id !== company.id),
            }
          : current,
      );
      notify(followed ? `Đã theo dõi ${company.name}.` : `Đã bỏ theo dõi ${company.name}.`);
    } catch (failure) {
      notify(failure.message, { type: "error" });
    } finally {
      setPendingFollow((ids) => ids.filter((id) => id !== company.id));
    }
  }
  function card(company, featured = false) {
    return (
      <CompanyCard
        key={company.id}
        company={company}
        featured={featured}
        followed={followedIds.includes(company.id)}
        pending={
          pendingFollow.includes(company.id) || (!!account && follows.accountId !== accountId)
        }
        onFollow={follow}
        onJobs={(item) => navigate(`/companies/${encodeURIComponent(item.id)}#company-open-jobs`)}
      />
    );
  }
  const stats = overview?.stats;
  const filtered = [...params.keys()].some((key) => !["page", "sort"].includes(key));

  return (
    <div className="companies-page font-roboto">
      <title>Danh sách công ty & Doanh nghiệp tuyển dụng | Job Tốt</title>
      <AuthHeader userName={account?.fullName} loading={sessionLoading} />
      <main className="page-container company-container">
        <PageBreadcrumb current="Doanh nghiệp" />
        <section className="company-intro">
          <div>
            <p className="company-eyebrow">
              <Flame />
              HỆ THỐNG DOANH NGHIỆP XÁC THỰC TOÀN QUỐC 2026
            </p>
            <h1>Khám phá doanh nghiệp & Nhà tuyển dụng hàng đầu</h1>
            <p>
              Tìm hiểu văn hóa doanh nghiệp, chế độ đãi ngộ, môi trường làm việc và ứng tuyển ngay
              vào những vị trí phù hợp nhất.
            </p>
          </div>
          <div className="company-stat-grid">
            {[
              [Building2, stats?.totalCompanies, "Doanh nghiệp trong hệ thống", "orange"],
              [BriefcaseBusiness, stats?.openJobs, "Việc làm đang mở", "blue"],
              [BadgeCheck, stats?.verifiedCompanies, "Doanh nghiệp đã xác thực", "green"],
              [UsersIcon, stats?.hiringCompanies, "Doanh nghiệp đang tuyển", "purple"],
            ].map(([Icon, value, label, color]) => (
              <div className={`company-stat stat-${color}`} key={label}>
                <Icon />
                <strong>{value == null ? "—" : number(value)}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>
        <form
          className="company-search"
          onSubmit={(event) => {
            event.preventDefault();
            update({ keyword: new FormData(event.currentTarget).get("keyword")?.trim() || "" });
            document.getElementById("company-results")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <label className="company-search-keyword">
            <Search />
            <input
              key={params.get("keyword") || ""}
              name="keyword"
              defaultValue={params.get("keyword") || ""}
              maxLength={200}
              placeholder="Từ khóa công ty"
              aria-label="Từ khóa công ty"
            />
          </label>
          <label>
            <MapPin />
            <span>
              Địa điểm
              <Select
                variant="embedded"
                aria-label="Địa điểm"
                value={params.get("provinceId") || ""}
                onChange={(event) => update({ provinceId: event.target.value })}
              >
                <option value="">Tất cả tỉnh, thành</option>
                {overview?.provinces.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Select>
            </span>
          </label>
          <label>
            <Building2 />
            <span>
              Ngành nghề
              <Select
                variant="embedded"
                aria-label="Ngành nghề"
                value={params.get("industryId") || ""}
                onChange={(event) => update({ industryId: event.target.value })}
              >
                <option value="">Tất cả ngành nghề</option>
                {overview?.industries.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Select>
            </span>
          </label>
          <button className="company-primary" type="submit">
            <Search />
            Tìm công ty
          </button>
        </form>
        {overviewError && (
          <div className="company-error" role="alert">
            {overviewError}
            <button onClick={() => setAttempt((x) => x + 1)}>Thử lại</button>
          </div>
        )}
        {overview?.featured.length > 0 && (
          <section className="company-featured" aria-labelledby="featured-heading">
            <div className="company-section-heading">
              <div>
                <p>
                  <Flame />
                  NHÀ TUYỂN DỤNG TIÊU BIỂU
                </p>
                <h2 id="featured-heading">Doanh nghiệp nổi bật & Đối tác chiến lược</h2>
              </div>
              <button
                className="company-text-button"
                onClick={() => {
                  update({ verifiedOnly: true, hiringOnly: true, sort: "jobs" });
                  document
                    .getElementById("company-results")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Xem doanh nghiệp đã xác thực <ArrowRight />
              </button>
            </div>
            <div className="company-featured-grid">
              {overview.featured.map((company) => card(company, true))}
            </div>
          </section>
        )}
        <div className="company-directory" id="company-results">
          <aside className={`company-filters ${filtersOpen ? "filters-open" : ""}`}>
            <div className="company-filter-panel">
              <div className="company-filter-heading">
                <h2>
                  <SlidersHorizontal />
                  Bộ lọc doanh nghiệp
                </h2>
                <button className="company-text-button" onClick={() => setParams({})}>
                  Thiết lập lại
                </button>
              </div>
              <label className="company-verified-filter">
                <input
                  type="checkbox"
                  checked={params.get("verifiedOnly") === "true"}
                  onChange={(event) => update({ verifiedOnly: event.target.checked })}
                />
                <span>
                  <strong>
                    <ShieldCheck />
                    Job Tốt Shield
                  </strong>
                  <small>Chỉ hiển thị doanh nghiệp đã xác thực</small>
                </span>
              </label>
              <fieldset>
                <legend>Quy mô nhân sự</legend>
                <label>
                  <input
                    type="radio"
                    name="size"
                    checked={!params.get("CompanySizeMin") && !params.get("CompanySizeMax")}
                    onChange={() => update({ CompanySizeMin: "", CompanySizeMax: "", size: "" })}
                  />
                  Tất cả quy mô
                </label>
                {sizes.map(([min, max, label]) => (
                  <label key={min}>
                    <input
                      type="radio"
                      name="size"
                      checked={
                        params.get("CompanySizeMin") === String(min) &&
                        (params.get("CompanySizeMax") || "") === String(max)
                      }
                      onChange={() =>
                        update({ CompanySizeMin: min, CompanySizeMax: max, size: "" })
                      }
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Tình trạng tuyển dụng</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={params.get("hiringOnly") === "true"}
                    onChange={(event) => update({ hiringOnly: event.target.checked })}
                  />
                  Có việc làm đang mở
                </label>
              </fieldset>
              {overview?.industries.length > 0 && (
                <fieldset>
                  <legend>Lĩnh vực hoạt động</legend>
                  <label>
                    <input
                      type="radio"
                      name="industry"
                      checked={!params.get("industryId")}
                      onChange={() => update({ industryId: "" })}
                    />
                    Tất cả lĩnh vực
                  </label>
                  {overview.industries.map((option) => (
                    <label key={option.id}>
                      <input
                        type="radio"
                        name="industry"
                        checked={params.get("industryId") === option.id}
                        onChange={() => update({ industryId: option.id })}
                      />
                      <span>{option.name}</span>
                      <small>{number(option.count)}</small>
                    </label>
                  ))}
                </fieldset>
              )}
            </div>
            <div className="company-sidebar-promo">
              <span>CƠ HỘI NGHỀ NGHIỆP MỚI</span>
              <h3>Doanh nghiệp bạn chưa biết có thể là nơi bạn thuộc về</h3>
              <p>Tạo một hồ sơ rõ ràng để nhà tuyển dụng hiểu thế mạnh của bạn.</p>
              <Link to={account ? "/profile" : "/register"}>
                Hoàn thiện hồ sơ <ArrowRight />
              </Link>
            </div>
          </aside>
          <section className="company-results">
            <div className="company-results-toolbar">
              <h2>
                Tìm thấy <em>{loading ? "…" : number(listing.totalCount)}</em> doanh nghiệp
                {filtered ? " phù hợp" : " đang hoạt động"}
                <small>Cập nhật những cơ hội việc làm mới nhất</small>
              </h2>
              <div className="company-sort">
                {[
                  ["relevant", "Phù hợp nhất"],
                  ["jobs", "Nhiều việc làm nhất"],
                  ["name", "Tên A – Z"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={sort === value}
                    onClick={() => update({ sort: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                className="company-mobile-filter"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((x) => !x)}
              >
                <SlidersHorizontal />
                Bộ lọc
              </button>
            </div>
            {error && (
              <div className="company-error" role="alert">
                {error}
                <button onClick={() => setAttempt((x) => x + 1)}>Thử lại</button>
              </div>
            )}
            {loading ? (
              <div className="company-loading" role="status">
                Đang tải danh sách doanh nghiệp…
                {[1, 2, 3].map((value) => (
                  <div className="company-skeleton" key={value} />
                ))}
              </div>
            ) : (
              !error && (
                <>
                  {listing.items.length ? (
                    <div className="company-list">
                      {listing.items.map((company) => card(company))}
                    </div>
                  ) : (
                    <div className="company-empty">
                      <Building2 />
                      <h3>
                        {filtered
                          ? "Không tìm thấy doanh nghiệp phù hợp"
                          : "Chưa có doanh nghiệp trong hệ thống"}
                      </h3>
                      <p>
                        {filtered
                          ? "Thử thay đổi từ khóa hoặc thiết lập lại bộ lọc."
                          : "Danh sách sẽ được cập nhật khi doanh nghiệp được thêm vào hệ thống."}
                      </p>
                      {filtered && (
                        <button className="company-primary" onClick={() => setParams({})}>
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  )}
                  {listing.totalCount > 0 && (
                    <Pagination
                      aria-label="Phân trang doanh nghiệp"
                      page={page}
                      totalPages={Math.ceil(listing.totalCount / 10)}
                      onPageChange={(value) => update({ page: value })}
                      info={`Hiển thị ${(page - 1) * 10 + (listing.items.length ? 1 : 0)} – ${Math.min(page * 10, listing.totalCount)} trong số ${number(listing.totalCount)} công ty`}
                    />
                  )}
                </>
              )
            )}
          </section>
        </div>
        <CareerResources />
      </main>
      <AuthFooter />
    </div>
  );
}

const UsersIcon = Users;
