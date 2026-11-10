import { Select } from "@/shared/ui/select";
import { Table, TableScroll } from "@/shared/ui/table";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, Building2, Search, Layers, TrendingUp } from "lucide-react";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerResources } from "@/widgets/career-resources";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { useCandidateSession } from "@/features/authenticate";
import { SaveJobButton } from "@/features/save-job";
import { companiesApi } from "@/entities/company";
import { jobsApi, JobListingCard } from "@/entities/job";
import "./top-industries.css";

const number = (value) => Number(value || 0).toLocaleString("vi-VN");
function salary(item) {
  const values = [item.salaryMin, item.salaryMax].filter((value) => value != null);
  return values.length
    ? `${[...new Set(values.map((value) => number(value / 1000000)))].join(" – ")} triệu/tháng`
    : "Chưa có dữ liệu lương";
}
const groups = [
  "Tất cả",
  "Kinh doanh & Dịch vụ",
  "Kỹ thuật & Công nghệ",
  "Tài chính & Pháp lý",
  "Sản xuất & Vận tải",
  "Khác",
];
function group(name) {
  const text = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d");
  if (/tai chinh|ke toan|ngan hang|phap|bao hiem/.test(text)) return groups[3];
  if (/san xuat|van tai|logistic|kho|xay dung/.test(text)) return groups[4];
  if (/cong nghe|ky thuat|phan mem|it\b|vien thong/.test(text)) return groups[2];
  if (/kinh doanh|ban hang|dich vu|marketing|du lich|khach san/.test(text)) return groups[1];
  return groups[5];
}

export function TopIndustriesPage() {
  const { account, loading: sessionLoading } = useCandidateSession();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [category, setCategory] = useState(groups[0]);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
        const [response, metadata, jobs] = await Promise.all([
          fetch(`${base}/api/industries/overview`, {
            signal: controller.signal,
            credentials: "omit",
          }),
          companiesApi.metadata(controller.signal),
          jobsApi.search(new URLSearchParams({ pageSize: "4" }), controller.signal),
        ]);
        if (!response.ok) throw new Error("Không thể tải dữ liệu ngành nghề. Vui lòng thử lại.");
        const industries = await response.json();
        if (!controller.signal.aborted) {
          setData({ industries, metadata, jobs });
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
  }, [attempt]);
  function search(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget))
      if (String(value).trim()) params.set(key, String(value).trim());
    navigate(`/jobs?${params}`);
  }
  const industries = data?.industries || [];
  const filtered = industries.filter(
    (item) => category === groups[0] || group(item.name) === category,
  );
  const top = industries.slice(0, 8);
  const opportunities = (id) => `/jobs?industryId=${encodeURIComponent(id)}`;
  return (
    <div className="top-industries-page companies-page font-roboto">
      <title>Top ngành nghề & Xu hướng tuyển dụng 2026 | Job Tốt</title>
      <AuthHeader userName={account?.fullName} loading={sessionLoading} />
      <main className="page-container company-container">
        <PageBreadcrumb current="Top ngành nghề" />
        <section className="ti-hero">
          <span className="ti-eyebrow">
            <TrendingUp /> THỊ TRƯỜNG TUYỂN DỤNG 2026
          </span>
          <h1>
            Khám phá {industries.length ? `${industries.length} ` : ""}Ngành nghề & Xu hướng tuyển
            dụng 2026
          </h1>
          <div className="ti-hero-row">
            <p>
              Tìm kiếm việc làm theo lĩnh vực chuyên môn, tham khảo mức lương đăng tuyển và khám phá
              cơ hội phù hợp với bạn.
            </p>
            <div className="ti-stats">
              <span>
                <BriefcaseBusiness />
                <strong>{data ? number(data.metadata.stats.openJobs) : "—"}</strong>
                <small>Việc làm đang tuyển</small>
              </span>
              <span>
                <Building2 />
                <strong>{data ? number(data.metadata.stats.hiringCompanies) : "—"}</strong>
                <small>Doanh nghiệp tuyển dụng</small>
              </span>
            </div>
          </div>
          <form className="ti-search" onSubmit={search}>
            <label>
              <Search />
              <input
                name="keyword"
                aria-label="Từ khóa công việc"
                placeholder="Từ khóa công việc"
              />
            </label>
            <Select name="provinceId" aria-label="Địa điểm">
              <option value="">Tất cả địa điểm</option>
              {data?.metadata.provinces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select name="industryId" aria-label="Ngành nghề">
              <option value="">Tất cả ngành nghề</option>
              {industries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <button type="submit">
              <Search /> Tìm việc ngay
            </button>
          </form>
        </section>
        {error ? (
          <div className="ti-state" role="alert">
            {error}
            <button onClick={() => setAttempt((value) => value + 1)}>Thử lại</button>
          </div>
        ) : !data ? (
          <p className="ti-state" role="status">
            Đang tải ngành nghề…
          </p>
        ) : (
          <>
            <section className="ti-section">
              <div className="ti-section-heading">
                <div>
                  <span className="ti-eyebrow">CƠ HỘI TUYỂN DỤNG TRỌNG ĐIỂM</span>
                  <h2>Top Ngành Nghề Dẫn Đầu Làn Sóng Tuyển Dụng</h2>
                </div>
                <p>Xếp hạng theo số việc làm đang tuyển trên Job Tốt.</p>
              </div>
              <div className="ti-grid">
                {top.map((item, index) => (
                  <article className={`ti-industry ti-tone-${index % 4}`} key={item.id}>
                    <span className="ti-icon">
                      <Building2 />
                    </span>
                    <h3>{item.name}</h3>
                    <p className="ti-count">
                      <strong>+{number(item.openJobs)}</strong> việc làm
                    </p>
                    <div className="ti-salary">
                      <small>Dải lương đăng tuyển</small>
                      <strong>{salary(item)}</strong>
                    </div>
                    <small>Cơ hội mới trong 30 ngày</small>
                    <p className="ti-new">{number(item.newJobs)} tin tuyển dụng</p>
                    <Link to={opportunities(item.id)}>
                      Khám phá cơ hội <ArrowRight />
                    </Link>
                  </article>
                ))}
              </div>
              {!top.length && <p className="ti-state">Chưa có ngành nghề để hiển thị.</p>}
            </section>
            <section className="ti-section">
              <span className="ti-eyebrow">DANH MỤC TRA CỨU TỔNG HỢP</span>
              <h2>Tra Cứu Toàn Bộ Nhóm Ngành Nghề Tuyển Dụng</h2>
              <div className="ti-tabs" aria-label="Nhóm ngành nghề">
                {groups.map((value) => (
                  <button
                    key={value}
                    aria-pressed={category === value}
                    onClick={() => {
                      setCategory(value);
                      setExpanded(false);
                    }}
                  >
                    {value}
                    {value === groups[0] && ` (${industries.length})`}
                  </button>
                ))}
              </div>
              <div className="ti-directory">
                {filtered.slice(0, expanded ? filtered.length : 15).map((item, index) => (
                  <Link key={item.id} to={opportunities(item.id)}>
                    <span className={`ti-icon ti-tone-${index % 4}`}>
                      <Layers />
                    </span>
                    <strong>{item.name}</strong>
                    <small>+{number(item.openJobs)}</small>
                  </Link>
                ))}
                {filtered.length > 15 && (
                  <button onClick={() => setExpanded((value) => !value)}>
                    {expanded ? "Thu gọn" : `Xem tất cả ${filtered.length} ngành`} <ArrowRight />
                  </button>
                )}
              </div>
              {!filtered.length && <p>Chưa có ngành nghề trong nhóm này.</p>}
            </section>
            <section className="ti-report">
              <span className="ti-eyebrow">THỊ TRƯỜNG TUYỂN DỤNG 2026</span>
              <h2>Bảng Tham Khảo Mức Lương Đăng Tuyển Theo Ngành Nghề</h2>
              <p>
                Tổng hợp từ các việc làm đang tuyển có công bố lương theo tháng. Mức lương phụ thuộc
                vị trí và kinh nghiệm.
              </p>
              <TableScroll label="Mức lương theo ngành nghề" className="ti-table-wrap">
                <Table aria-label="Mức lương theo ngành nghề">
                  <thead>
                    <tr>
                      <th>Lĩnh vực chuyên môn</th>
                      <th>Dải lương / tháng</th>
                      <th>Việc làm đang tuyển</th>
                      <th>Tin mới trong 30 ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((item) => (
                      <tr key={item.id}>
                        <th>
                          <Link to={opportunities(item.id)}>{item.name}</Link>
                        </th>
                        <td className="ti-pay">{salary(item)}</td>
                        <td>{number(item.openJobs)}</td>
                        <td>
                          <span className="ti-trend">+{number(item.newJobs)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableScroll>
              <small>
                Lương theo giờ, theo ngày và tin chưa công bố lương không được tính vào dải lương
                này.
              </small>
            </section>
            <section className="ti-section">
              <div className="ti-section-heading">
                <div>
                  <span className="ti-eyebrow">TUYỂN DỤNG TRỰC TIẾP</span>
                  <h2>Cơ Hội Việc Làm Mới Nhất Theo Ngành Trọng Điểm</h2>
                </div>
                <Link to="/jobs">
                  Xem tất cả việc làm <ArrowRight />
                </Link>
              </div>
              <div className="ti-jobs">
                {data.jobs.items.map((job) => (
                  <JobListingCard
                    key={job.id}
                    job={job}
                    action={<SaveJobButton jobId={job.id} title={job.title} />}
                  />
                ))}
              </div>
              {!data.jobs.items.length && (
                <p className="ti-state">Hiện chưa có việc làm đang tuyển.</p>
              )}
            </section>
          </>
        )}
        <CareerResources />
      </main>
      <AuthFooter />
    </div>
  );
}
