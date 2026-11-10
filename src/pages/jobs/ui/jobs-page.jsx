import { Select } from "@/shared/ui/select";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { jobsApi, JobListingCard } from "@/entities/job";
import { companiesApi } from "@/entities/company";
import { SaveJobButton, useSavedJobs } from "@/features/save-job";
import { useCandidateSession } from "@/features/authenticate";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerResources } from "@/widgets/career-resources";
import { ServiceNotice } from "@/shared/ui/service-notice";
import { Pagination } from "@/shared/ui/pagination";
import "./jobs.css";

const pageSize = 6;
const number = (value) => Number(value || 0).toLocaleString("vi-VN");
const validId = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export function JobsPage({ savedOnly = false }) {
  return <JobDirectory savedOnly={savedOnly} />;
}
function JobDirectory({ savedOnly }) {
  const { account, loading: sessionLoading } = useCandidateSession();
  const { savedIds } = useSavedJobs();
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [locations, setLocations] = useState(null);
  const [error, setError] = useState("");
  const [metadataError, setMetadataError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsRef = useRef(null);
  const search = params.toString();
  const savedKey = savedOnly ? savedIds.filter(validId).slice(0, 1000).join(",") : "";
  const requestKey = `${search}|${savedOnly}|${savedKey}`;
  const page = Math.max(1, Math.min(1000000, Math.trunc(Number(params.get("page"))) || 1));
  const loading = result?.key !== requestKey;
  const legacyLocation = params.get("location");
  const normalizeProvinceName = (name) =>
    name
      .replace(/^(Thành phố|Tỉnh)\s+/i, "")
      .trim()
      .toLocaleLowerCase("vi-VN");
  const legacyProvince =
    legacyLocation &&
    locations?.provinces.find(
      (option) => normalizeProvinceName(option.name) === normalizeProvinceName(legacyLocation),
    );
  const needsProvinceResolution = !!legacyLocation && !params.has("provinceId");
  const waitingForProvinceResolution =
    needsProvinceResolution && ((!locations && !metadataError) || !!legacyProvince);

  useEffect(() => {
    if (!needsProvinceResolution || !legacyProvince) return;
    const next = new URLSearchParams(search);
    next.delete("location");
    next.set("provinceId", legacyProvince.id);
    setParams(next, { replace: true });
  }, [needsProvinceResolution, legacyProvince, search, setParams]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      Promise.allSettled([
        jobsApi.filters(controller.signal),
        companiesApi.metadata(controller.signal),
      ]).then(([filters, directory]) => {
        if (controller.signal.aborted) return;
        if (filters.status === "fulfilled") setMetadata(filters.value);
        if (directory.status === "fulfilled") setLocations(directory.value);
        setMetadataError(
          [filters, directory]
            .filter((item) => item.status === "rejected")
            .map((item) => item.reason.message)
            .join(" "),
        );
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
      if (waitingForProvinceResolution) return;
      const query = new URLSearchParams(search);
      if (query.has("q") && !query.has("keyword")) query.set("keyword", query.get("q"));
      query.delete("q");
      query.delete("includeClosed");
      query.delete("jobIds");
      query.set("page", String(page));
      query.set("pageSize", String(pageSize));
      if (savedOnly && !savedKey) {
        setResult({
          key: requestKey,
          items: [],
          totalCount: 0,
          now: Date.now(),
        });
        setError("");
        return;
      }
      if (savedOnly) savedKey.split(",").forEach((id) => query.append("jobIds", id));
      try {
        const data = await jobsApi.search(query, controller.signal);
        if (!controller.signal.aborted) {
          setResult({ ...data, key: requestKey, now: Date.now() });
          setError("");
        }
      } catch (failure) {
        if (!controller.signal.aborted) {
          setError(failure.message);
          setResult({ key: requestKey, items: [], totalCount: 0 });
        }
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, page, requestKey, savedOnly, savedKey, attempt, waitingForProvinceResolution]);
  function update(changes) {
    const next = new URLSearchParams(params);
    next.delete("page");
    for (const [key, value] of Object.entries(changes)) {
      next.delete(key);
      if (Array.isArray(value)) value.forEach((item) => next.append(key, item));
      else if (value !== "" && value !== false && value != null) next.set(key, String(value));
    }
    setError("");
    setParams(next);
  }
  function toggle(key, value) {
    const values = params.getAll(key);
    update({
      [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
    });
  }
  function checkboxGroup(key, title, options) {
    return (
      <fieldset className="job-filter-panel">
        <legend>{title}</legend>
        {options?.map((option) => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={params.getAll(key).includes(option.value)}
              onChange={() => toggle(key, option.value)}
            />
            <span>{option.label}</span>
            <small>{number(option.count)}</small>
          </label>
        ))}
      </fieldset>
    );
  }
  const totalPages = Math.ceil((result?.totalCount || 0) / pageSize);
  return (
    <div className="companies-page jobs-directory-page font-roboto">
      <title>{savedOnly ? "Việc làm đã lưu" : "Tìm việc làm mới nhất"} | Job Tốt</title>
      <AuthHeader userName={account?.fullName} loading={sessionLoading} />
      <main className="page-container">
        <section className="jobs-hero">
          <p className="jobs-ai">
            <Sparkles />
            Job Search Engine đầu tiên do người Việt phát triển <strong>· Chuẩn AI 2026</strong>
          </p>
          <h1>
            {savedOnly ? (
              "Việc làm bạn đã lưu"
            ) : (
              <>
                Tìm việc chuẩn xác, kết nối trực tiếp <br />
                với{" "}
                <Link to="/companies">
                  {metadata
                    ? `${number(metadata.totalCompanies)} nhà tuyển dụng`
                    : "nhà tuyển dụng"}
                </Link>{" "}
                hàng đầu
              </>
            )}
          </h1>
          <p>
            Tối ưu hóa hành trình nghề nghiệp với bộ lọc thông minh,{" "}
            {metadata
              ? `khám phá ${number(metadata.totalJobs)} việc làm `
              : "khám phá cơ hội việc làm "}
            <br className="jobs-desktop-break" />
            toàn quốc và sàng lọc cơ hội lương cao, an toàn tuyệt đối.
          </p>
        </section>
        <div className="jobs-personal-link">
          <Link to="/my-jobs">
            Việc làm của tôi · Xem các việc làm đã lưu <ArrowRight />
          </Link>
        </div>
        <form
          className="company-search jobs-search"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            update({
              keyword: data.get("keyword").trim(),
              q: "",
              location: "",
              provinceId: data.get("provinceId"),
              industryId: data.get("industryId"),
            });
            resultsRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <label>
            <Search />
            <input
              key={params.get("keyword") || params.get("q") || ""}
              name="keyword"
              defaultValue={params.get("keyword") || params.get("q") || ""}
              aria-label="Từ khóa công việc"
              maxLength={200}
              placeholder="Từ khóa công việc"
            />
          </label>
          <label>
            <MapPin />
            <span>
              ĐỊA ĐIỂM
              <Select
                variant="embedded"
                key={`${params.get("provinceId") || ""}|${!!locations}`}
                name="provinceId"
                aria-label="Địa điểm"
                defaultValue={params.get("provinceId") || ""}
                disabled={!locations}
              >
                <option value="">Tất cả tỉnh, thành</option>
                {locations?.provinces.map((option) => (
                  <option value={option.id} key={option.id}>
                    {option.name}
                  </option>
                ))}
              </Select>
            </span>
          </label>
          <label>
            <BriefcaseBusiness />
            <span>
              NGÀNH NGHỀ
              <Select
                variant="embedded"
                key={`${params.get("industryId") || ""}|${!!locations}`}
                name="industryId"
                aria-label="Ngành nghề"
                defaultValue={params.get("industryId") || ""}
              >
                <option value="">Tất cả ngành nghề</option>
                {locations?.industries.map((option) => (
                  <option value={option.id} key={option.id}>
                    {option.name}
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
        <div className="job-directory-layout" ref={resultsRef}>
          <button
            className="jobs-mobile-filters"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((value) => !value)}
          >
            <SlidersHorizontal />
            Bộ lọc việc làm
          </button>
          <aside
            className={`job-directory-filters ${filtersOpen ? "is-open" : ""}`}
            aria-label="Bộ lọc việc làm"
          >
            <div className="job-filter-panel job-shield-panel">
              <h2>
                <ShieldCheck />
                Bảo chứng uy tín <span>JOB TỐT SHIELD</span>
              </h2>
              <label className="job-shield-choice">
                <input
                  type="checkbox"
                  checked={params.get("verifiedOnly") === "true"}
                  onChange={(event) => update({ verifiedOnly: event.target.checked })}
                />
                <span>
                  <strong>Chỉ hiển thị NTD có Job Tốt Shield</strong>
                  <small>Doanh nghiệp đã được xác thực trên nền tảng.</small>
                </span>
              </label>
            </div>
            {metadataError && (
              <div role="alert" className="company-error">
                {metadataError}
                <button onClick={() => setAttempt((value) => value + 1)}>Thử lại</button>
              </div>
            )}
            {!metadata && !metadataError ? (
              <p role="status" className="job-filter-loading">
                Đang tải bộ lọc…
              </p>
            ) : (
              <>
                <fieldset className="job-filter-panel">
                  <legend>Mức lương hàng tháng</legend>
                  <button className="job-filter-reset" onClick={() => update({ salaryBand: "" })}>
                    Đặt lại
                  </button>
                  {metadata?.salaryBands.map((option) => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name="salary-band"
                        checked={params.get("salaryBand") === option.value}
                        onChange={() => update({ salaryBand: option.value })}
                      />
                      <span>{option.label}</span>
                      <small>{number(option.count)}</small>
                    </label>
                  ))}
                </fieldset>
                {checkboxGroup(
                  "experienceLevels",
                  "Kinh nghiệm làm việc",
                  metadata?.experienceLevels,
                )}
                {checkboxGroup("positionLevels", "Cấp bậc", metadata?.positionLevels)}
                <fieldset className="job-filter-panel">
                  <legend>Hình thức làm việc</legend>
                  <div className="job-employment-options">
                    {metadata?.employmentTypes.map((option) => (
                      <button
                        key={option.value}
                        aria-pressed={params.getAll("employmentTypes").includes(option.value)}
                        onClick={() => toggle("employmentTypes", option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
            <button
              className="job-reset-all"
              onClick={() => {
                setError("");
                setParams({});
              }}
            >
              Thiết lập lại bộ lọc
            </button>
            <ServiceNotice title="Job Tốt Shield">
              <button className="job-filter-help">
                <ShieldCheck />
                Tìm hiểu về bảo chứng uy tín <ArrowRight />
              </button>
            </ServiceNotice>
          </aside>
          <section
            className="job-directory-results"
            aria-label={savedOnly ? "Việc làm đã lưu" : "Kết quả tìm việc"}
            aria-busy={loading}
          >
            {error ? (
              <div role="alert" className="company-error">
                {error}
                <button onClick={() => setAttempt((value) => value + 1)}>Thử lại</button>
              </div>
            ) : loading ? (
              <div role="status" className="job-directory-loading">
                Đang tải việc làm…
                {[1, 2, 3].map((value) => (
                  <div className="company-skeleton" key={value} />
                ))}
              </div>
            ) : result.items.length ? (
              <>
                <div className="job-directory-list">
                  {result.items.map((job) => (
                    <JobListingCard
                      key={job.id}
                      job={job}
                      now={result.now}
                      action={<SaveJobButton jobId={job.id} title={job.title} />}
                    />
                  ))}
                </div>
                <Pagination
                  aria-label="Phân trang việc làm"
                  page={page}
                  totalPages={totalPages}
                  info={`Hiển thị ${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, result.totalCount)} trong tổng số ${number(result.totalCount)} việc làm`}
                  onPageChange={(value) => {
                    update({ page: value });
                    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              </>
            ) : (
              <div className="company-empty">
                <BriefcaseBusiness />
                <h2>
                  {savedOnly
                    ? "Chưa có việc làm đã lưu phù hợp"
                    : "Không tìm thấy việc làm phù hợp"}
                </h2>
                <p>
                  {savedOnly
                    ? "Lưu các vị trí bạn quan tâm để tìm lại tại đây."
                    : "Thử thay đổi từ khóa hoặc thiết lập lại bộ lọc."}
                </p>
                {savedOnly ? (
                  <Link className="company-primary" to="/jobs">
                    Khám phá việc làm
                  </Link>
                ) : (
                  <button className="company-primary" onClick={() => setParams({})}>
                    Thiết lập lại bộ lọc
                  </button>
                )}
              </div>
            )}
            {!loading && !error && result.totalCount > 0 && result.items.length === 0 && (
              <button className="company-primary" onClick={() => update({ page: 1 })}>
                Về trang đầu
              </button>
            )}
          </section>
        </div>
        <div className="jobs-career-resources">
          <CareerResources />
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
