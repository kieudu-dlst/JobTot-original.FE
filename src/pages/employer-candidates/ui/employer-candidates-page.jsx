import { Select } from "@/shared/ui/select";
import { Table, TableScroll } from "@/shared/ui/table";
import { RecruitmentTabs } from "@/widgets/recruitment-tabs";
import { formatDate } from "@/shared/lib/date-format";
import { FormInput } from "@/shared/ui/date-picker";
import { ApplicantDetail } from "./applicant-detail";
import { applicationStatuses } from "@/shared/lib/application-status";
import { useToast } from "@/shared/ui/toast-context";
import { Pagination } from "@/shared/ui/pagination";
import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/shared/lib/media-url";
import { Link, Navigate } from "react-router-dom";
import {
  CalendarDays,
  Search,
  RefreshCw,
  UsersRound,
  FolderHeart,
  Plus,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X,
} from "lucide-react";
import { EmployerHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { useEmployerSession } from "@/features/authenticate";
import { recruitmentRequest, mutate } from "../api/candidates";
import "./employer-candidates.css";

const titles = {
  talents: "Danh sách tài năng",
  applications: "Quản lý ứng viên",
  interviews: "Lịch phỏng vấn & Đánh giá ứng viên",
};
const readiness = {
  unknown: "Chưa xác định",
  ready: "Sẵn sàng nhận việc",
  later: "Liên hệ sau",
  unavailable: "Chưa sẵn sàng",
};
const states = applicationStatuses;
const vnDate = (value) => formatDate(value, { timeZone: "Asia/Ho_Chi_Minh" });
const vnTime = (value) =>
  new Date(value).toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  });
const dayKey = (value) =>
  new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
function useLoad(path, attempt = 0, keepData = false) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!keepData) setData(null);
      setError("");
      try {
        const value = await recruitmentRequest(path, { signal: controller.signal });
        if (!controller.signal.aborted) setData(value);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [path, attempt, keepData]);
  return { data, error };
}
export function EmployerCandidatesPage({ view = "applications" }) {
  const { account, loading, error } = useEmployerSession();
  if (loading)
    return (
      <p role="status" className="er-loading">
        Đang kiểm tra phiên đăng nhập…
      </p>
    );
  if (!account && !error) return <Navigate to="/login?role=employer" replace />;
  if (!account) return <p role="alert">{error}</p>;
  return <Recruitment key={`${account.companyId}-${view}`} account={account} view={view} />;
}
function Recruitment({ account, view }) {
  const notify = useToast();
  const [attempt, setAttempt] = useState(0),
    [dialog, setDialog] = useState(null),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  const busy = useRef(false);
  const metadata = useLoad("/metadata", attempt, true);
  async function action(path, data, method = "POST") {
    if (busy.current) return false;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      await mutate(path, data, method);
      notify("Đã lưu thay đổi thành công.");
      setAttempt((value) => value + 1);
      setDialog(null);
      return true;
    } catch (failure) {
      setError(failure.message);
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <div className="employer-recruitment font-roboto">
      <title>{titles[view]} | Job Tốt</title>
      <EmployerHeader userName={account.fullName} active="candidates" />
      <main className="page-container company-container er-container">
        <PageBreadcrumb current="Quản lý ứng viên" root={null} />
        <RecruitmentTabs active={view} />
        {(error || metadata.error) && (
          <p role="alert" className="er-error">
            {error || metadata.error}
            <button
              onClick={() => {
                setError("");
                setAttempt((value) => value + 1);
              }}
            >
              Thử lại
            </button>
          </p>
        )}
        {!metadata.data ? (
          !metadata.error && (
            <p role="status" className="er-loading">
              Đang tải dữ liệu tuyển dụng…
            </p>
          )
        ) : view === "interviews" ? (
          <Interviews
            metadata={metadata.data}
            attempt={attempt}
            open={(value) => {
              setError("");
              setDialog(value);
            }}
            refresh={() => setAttempt((value) => value + 1)}
            action={action}
            pending={pending}
          />
        ) : (
          <Candidates
            view={view}
            metadata={metadata.data}
            attempt={attempt}
            open={(value) => {
              setError("");
              setDialog(value);
            }}
            action={action}
            pending={pending}
            refresh={() => setAttempt((value) => value + 1)}
          />
        )}
      </main>
      <AuthFooter />
      {dialog?.type === "detail" ? (
        <ApplicantDetail item={dialog.item} close={() => setDialog(null)} open={setDialog} />
      ) : (
        dialog && (
          <RecruitmentDialog
            key={`${dialog.type}-${dialog.item?.id || "new"}`}
            dialog={dialog}
            metadata={metadata.data}
            close={() => {
              if (!pending) setDialog(null);
            }}
            action={action}
            pending={pending}
            error={error}
          />
        )
      )}
    </div>
  );
}
function LoadState({ load, retry }) {
  return load.error ? (
    <p role="alert" className="er-error">
      {load.error} <button onClick={retry}>Thử lại</button>
    </p>
  ) : !load.data ? (
    <p role="status" className="er-loading">
      Đang tải…
    </p>
  ) : null;
}
function Candidates({ view, metadata, attempt, open, action, pending, refresh }) {
  const talent = view === "talents";
  const [keyword, setKeyword] = useState(""),
    [query, setQuery] = useState(""),
    [campaign, setCampaign] = useState(metadata.campaigns[0]?.id || ""),
    [stage, setStage] = useState(""),
    [state, setState] = useState(""),
    [source, setSource] = useState(""),
    [ready, setReady] = useState(""),
    [sort, setSort] = useState("newest"),
    [page, setPage] = useState(1),
    [selection, setSelection] = useState([]);
  const selectedCampaign = metadata.campaigns.find((item) => item.id === campaign);
  const parameters = new URLSearchParams({
    page,
    ...(query && { keyword: query }),
    ...(talent
      ? ready && { readiness: ready }
      : {
          ...(campaign && { campaignId: campaign }),
          ...(stage && { stageId: stage }),
          ...(state && { state }),
          ...(source && { source }),
          sort,
        }),
  });
  const load = useLoad(`${talent ? "/talents" : ""}?${parameters}`, attempt);
  const result = load.data;
  function clear() {
    setKeyword("");
    setQuery("");
    setStage("");
    setState("");
    setSource("");
    setReady("");
    setSort("newest");
    setPage(1);
    setSelection([]);
  }
  function select(id) {
    setSelection((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }
  const selectedRows = result?.items.filter((item) => selection.includes(item.id)) || [];
  const moveCampaign = metadata.campaigns.find((item) => item.id === selectedRows[0]?.campaignId);
  const canMoveSelection =
    selectedRows.length > 0 &&
    moveCampaign?.stages.length > 0 &&
    selectedRows.every(
      (item) =>
        item.campaignId === moveCampaign.id &&
        !["Hired", "Rejected"].includes(item.applicationStatus),
    );
  return (
    <>
      <section className="er-card er-banner">
        <span className="er-banner-icon">{talent ? <FolderHeart /> : <UsersRound />}</span>
        <div>
          {talent ? (
            <>
              <h1>Kho Tài Năng Tiềm Năng - Toàn Doanh Nghiệp</h1>
              <p>
                Tổng cộng: <b>{result?.poolCount ?? "—"}</b> hồ sơ • Sẵn sàng nhận việc:{" "}
                <b className="er-green">
                  {result?.poolCount
                    ? `${Math.round((result.readyCount / result.poolCount) * 100)}%`
                    : "—"}
                </b>
              </p>
            </>
          ) : (
            <>
              <small>CHIẾN DỊCH ĐANG CHỌN</small>
              <Select
                aria-label="Chọn chiến dịch"
                value={campaign}
                onChange={(event) => {
                  setCampaign(event.target.value);
                  setStage("");
                  setPage(1);
                  setSelection([]);
                }}
              >
                <option value="">Tất cả chiến dịch</option>
                {metadata.campaigns.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
              <p>
                {selectedCampaign?.department || "Toàn doanh nghiệp"} • Tổng{" "}
                {selectedCampaign?.applications ?? result?.totalCount ?? 0} hồ sơ tiếp nhận
              </p>
            </>
          )}
        </div>
        {!talent && selectedCampaign && (
          <div className="er-campaign-summary">
            <p>
              Chỉ tiêu: <b>{selectedCampaign.openings}</b> • Đã nhận:{" "}
              <b className="er-green">{selectedCampaign.hired}</b>
            </p>
            <p>
              Hạn chót:{" "}
              {selectedCampaign.endDate
                ? vnDate(`${selectedCampaign.endDate}T00:00:00+07:00`)
                : "Chưa đặt hạn"}
            </p>
            <p>
              Phụ trách: <b>{selectedCampaign.owner}</b>
            </p>
          </div>
        )}
      </section>
      {!talent && (
        <>
          <div className="er-pipeline">
            <button
              aria-pressed={!stage}
              onClick={() => {
                setStage("");
                setPage(1);
                setSelection([]);
              }}
            >
              Tất cả hồ sơ <b>{selectedCampaign?.applications ?? "—"}</b>
              <small>Toàn chiến dịch</small>
            </button>
            {selectedCampaign?.stages.map((item, index) => (
              <button
                key={item.id}
                aria-pressed={stage === item.id}
                onClick={() => {
                  setStage(item.id);
                  setPage(1);
                  setSelection([]);
                }}
              >
                V{index + 1}. {item.name}
                <b>{item.count}</b>
                <small>Vòng tuyển dụng</small>
              </button>
            ))}
            <Link to="/employer/talents">
              Talent Pool<small>Kho lưu trữ & tái kết nối</small>
            </Link>
          </div>
          {metadata.pendingImports > 0 && (
            <div className="er-import">
              <p>
                Có {metadata.pendingImports} hồ sơ ứng tuyển từ website chưa được đưa vào quy trình.
              </p>
              <button className="er-primary" disabled={pending} onClick={() => action("/import")}>
                Đồng bộ hồ sơ ứng tuyển
              </button>
            </div>
          )}
        </>
      )}
      {!talent && (
        <div className="er-pipeline-help">
          <div>
            <strong>Quản lý vòng tuyển dụng</strong>
            <p>
              Bấm V1, V2… để lọc hồ sơ theo vòng. Dùng nút “Chuyển vòng” tại hồ sơ hoặc tick nhiều
              ứng viên để chuyển cùng lúc.
            </p>
            <p>
              Trạng thái xử lý được cập nhật riêng bằng nút “Cập nhật trạng thái”. Chuyển vòng sẽ
              đưa hồ sơ sang trạng thái Đang phỏng vấn.
            </p>
          </div>
          {selectedCampaign && (
            <Link to={`/employer/campaigns/${selectedCampaign.id}/edit`}>
              Cấu hình các vòng
              <ArrowRight />
            </Link>
          )}
        </div>
      )}
      <section className="er-card er-filters">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(keyword.trim());
            setPage(1);
            setSelection([]);
          }}
        >
          <label className="er-search">
            <Search />
            <FormInput
              aria-label="Tìm ứng viên"
              placeholder="Tên ứng viên, email, kỹ năng…"
              maxLength={200}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <button type="submit">Tìm</button>
          </label>
          {talent ? (
            <Select
              aria-label="Độ sẵn sàng"
              value={ready}
              onChange={(event) => {
                setReady(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Độ sẵn sàng: Tất cả</option>
              {Object.entries(readiness).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          ) : (
            <>
              <Select
                aria-label="Trạng thái xử lý"
                value={state}
                onChange={(event) => {
                  setState(event.target.value);
                  setPage(1);
                  setSelection([]);
                }}
              >
                <option value="">Trạng thái: Tất cả</option>
                {Object.entries(states).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Nguồn ứng viên"
                value={source}
                onChange={(event) => {
                  setSource(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Nguồn: Tất cả</option>
                <option>Website</option>
                <option>Talent Pool</option>
                <option>Referral</option>
              </Select>
            </>
          )}
          <button
            type="button"
            aria-label="Làm mới danh sách"
            onClick={() => {
              setSelection([]);
              refresh();
            }}
          >
            <RefreshCw />
          </button>
        </form>
        <div className="er-filter-summary">
          <span>
            ĐANG LỌC: {query || "Tất cả hồ sơ"}{" "}
            {stage && `• ${selectedCampaign?.stages.find((item) => item.id === stage)?.name}`}
          </span>
          <button onClick={clear}>Xóa tất cả bộ lọc</button>
          {!talent && (
            <label>
              Sắp xếp:{" "}
              <Select
                aria-label="Sắp xếp ứng viên"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
              >
                <option value="newest">Mới nhất</option>
                <option value="name">Tên ứng viên</option>
                <option value="score">Điểm phù hợp cao nhất</option>
              </Select>
            </label>
          )}
        </div>
      </section>
      {!talent && selectedRows.length > 0 && (
        <div className="er-bulk">
          <b>Đã chọn {selectedRows.length} ứng viên</b>
          <button
            className="er-primary"
            onClick={() =>
              open({
                type: "move",
                ids: selectedRows.map((item) => item.id),
                campaign: moveCampaign,
              })
            }
            disabled={pending || !canMoveSelection}
          >
            <ArrowRight />
            Chuyển vòng tuyển dụng
          </button>
          {!canMoveSelection && (
            <span>
              Chọn hồ sơ chưa kết thúc tuyển dụng, thuộc cùng một chiến dịch có cấu hình vòng.
            </span>
          )}
        </div>
      )}
      <section className="er-card er-table-card">
        <LoadState load={load} retry={refresh} />
        {result && (
          <>
            <TableScroll label="Danh sách ứng viên" className="er-table-scroll">
              <Table aria-label="Danh sách ứng viên" className="er-table">
                <thead>
                  <tr>
                    <th>
                      {!talent && (
                        <FormInput
                          type="checkbox"
                          aria-label="Chọn tất cả ứng viên trang này"
                          checked={
                            result.items.length > 0 && selectedRows.length === result.items.length
                          }
                          onChange={(event) =>
                            setSelection(
                              event.target.checked ? result.items.map((item) => item.id) : [],
                            )
                          }
                        />
                      )}
                    </th>
                    <th>ỨNG VIÊN / VỊ TRÍ</th>
                    <th>KỸ NĂNG & CHUYÊN MÔN</th>
                    <th>TRẠNG THÁI & GHI CHÚ</th>
                    <th>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {!talent && (
                          <FormInput
                            type="checkbox"
                            aria-label={`Chọn ${item.profile.name}`}
                            checked={selection.includes(item.id)}
                            onChange={() => select(item.id)}
                          />
                        )}
                      </td>
                      <td>
                        <div className="er-person">
                          <Avatar profile={item.profile} />
                          <div>
                            <button
                              className="er-candidate-name"
                              onClick={() => open({ type: "detail", item })}
                            >
                              {item.profile.name}
                            </button>
                            {!talent && (
                              <span className="er-status">
                                {states[item.applicationStatus] || item.applicationStatus}
                              </span>
                            )}
                            <p>
                              {item.profile.headline || "Chưa cập nhật vị trí"}
                              {item.profile.yearsExperience != null &&
                                ` • ${item.profile.yearsExperience} năm KN`}
                            </p>
                            <small>
                              {item.profile.email || "Chưa có email"}
                              {item.profile.phone && ` • ${item.profile.phone}`}
                            </small>
                            {!talent && (
                              <small>
                                {item.stage || "Chưa phân vòng"} • {item.source || "Không rõ nguồn"}
                                {item.matchScore != null && ` • Phù hợp: ${item.matchScore}%`}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="er-skills">
                          {item.profile.skills.slice(0, 3).map((skill, index) => (
                            <span key={`${skill}-${index}`}>{skill}</span>
                          ))}
                          {item.profile.skills.length > 3 && (
                            <span className="er-more-skills">
                              +{item.profile.skills.length - 3}
                            </span>
                          )}
                        </div>
                        <p className="er-candidate-summary">
                          {item.profile.summary || "Chưa cập nhật chuyên môn."}
                        </p>
                      </td>
                      <td>
                        <span className={`er-readiness er-${item.readinessStatus || "unknown"}`}>
                          {talent
                            ? readiness[item.readinessStatus] || "Chưa xác định"
                            : item.profile.readyStatus === "looking"
                              ? "Đang tìm việc"
                              : item.profile.readyStatus || "Chưa cập nhật"}
                        </span>
                        <p>
                          {talent
                            ? item.notes || "Chưa có ghi chú."
                            : `Ứng tuyển ngày ${vnDate(item.appliedAt)}`}
                        </p>
                      </td>
                      <td>
                        <div className="er-row-actions">
                          {talent ? (
                            <>
                              <button onClick={() => open({ type: "assign", item })}>
                                <Plus />
                                Gán Job
                              </button>
                              <button
                                aria-label={`Ghi chú ${item.profile.name}`}
                                onClick={() => open({ type: "talent", item })}
                              >
                                <Pencil />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="er-status-action"
                                aria-label={`Trạng thái ${item.profile.name}`}
                                disabled={pending}
                                onClick={() => open({ type: "status", item })}
                              >
                                <Pencil />
                                Cập nhật trạng thái
                              </button>
                              <button
                                className="er-move-action"
                                aria-label={`Chuyển vòng ${item.profile.name}`}
                                disabled={
                                  pending ||
                                  ["Hired", "Rejected"].includes(item.applicationStatus) ||
                                  !metadata.campaigns.find((value) => value.id === item.campaignId)
                                    ?.stages.length
                                }
                                onClick={() =>
                                  open({
                                    type: "move",
                                    item,
                                    ids: [item.id],
                                    campaign: metadata.campaigns.find(
                                      (value) => value.id === item.campaignId,
                                    ),
                                  })
                                }
                              >
                                <ArrowRight />
                                Chuyển vòng
                              </button>
                              <button
                                aria-label={`Lưu ${item.profile.name} vào kho tài năng`}
                                disabled={pending || item.isSavedToTalentPool}
                                onClick={() => action("/talents", { applicationId: item.id })}
                              >
                                <FolderHeart />
                                {item.isSavedToTalentPool ? "Đã thêm tài năng" : "Thêm Tài Năng"}
                              </button>
                              <button
                                aria-label={`Lên lịch ${item.profile.name}`}
                                onClick={() => open({ type: "schedule", item })}
                              >
                                <CalendarDays />
                                Tạo lịch phỏng vấn
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
            {!result.items.length && <p className="er-empty">Chưa có hồ sơ phù hợp.</p>}
            <Pagination
              page={page}
              totalPages={Math.ceil(result.totalCount / 10)}
              onPageChange={(value) => {
                setPage(value);
                setSelection([]);
              }}
              info={
                <>
                  Hiển thị{" "}
                  {result.items.length
                    ? `${(page - 1) * 10 + 1} – ${(page - 1) * 10 + result.items.length}`
                    : "0"}{" "}
                  trong tổng số {result.totalCount} hồ sơ
                </>
              }
            />
          </>
        )}
      </section>
    </>
  );
}
function Avatar({ profile }) {
  const [failed, setFailed] = useState(false);
  return profile.avatarUrl && !failed ? (
    <img
      className="er-avatar"
      src={mediaUrl(profile.avatarUrl)}
      alt=""
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="er-avatar er-avatar-fallback">
      {profile.name?.slice(0, 1).toUpperCase() || "U"}
    </span>
  );
}
function dateShift(key, days) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
function shiftPeriod(key, direction, mode) {
  if (mode !== "month") return dateShift(key, direction * (mode === "week" ? 7 : 1));
  const date = new Date(`${key}T12:00:00Z`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + direction, 1))
    .toISOString()
    .slice(0, 10);
}
function rangeFor(key, mode) {
  if (mode === "day") return { from: key, to: key };
  const date = new Date(`${key}T12:00:00Z`);
  if (mode === "month") {
    const first = `${key.slice(0, 7)}-01`;
    const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
      .toISOString()
      .slice(0, 10);
    return { from: first, to: last };
  }
  const first = dateShift(key, -((date.getUTCDay() + 6) % 7));
  return { from: first, to: dateShift(first, 6) };
}
function Interviews({ attempt, open, refresh, action, pending }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [date, setDate] = useState(() => dayKey(Date.now())),
    [mode, setMode] = useState("week"),
    [keyword, setKeyword] = useState(""),
    [query, setQuery] = useState("");
  const range = rangeFor(date, mode),
    monthRange = rangeFor(date, "month");
  const sameRange = range.from === monthRange.from && range.to === monthRange.to && !query;
  const mainLoad = useLoad(
      sameRange
        ? null
        : `/interviews?${new URLSearchParams({ ...range, ...(query && { keyword: query }) })}`,
      attempt,
    ),
    monthLoad = useLoad(`/interviews?${new URLSearchParams(monthRange)}`, attempt);
  const load = sameRange ? monthLoad : mainLoad;
  const rows = load.data || [],
    active = rows.filter((item) => item.interviewStatus !== "cancelled");
  const days = [...new Set(rows.map((item) => dayKey(item.scheduledStart)))];
  const calendarStart = dateShift(
    monthRange.from,
    -((new Date(`${monthRange.from}T12:00:00Z`).getUTCDay() + 6) % 7),
  );
  const today = dayKey(now);
  return (
    <>
      <div className="er-calendar-heading">
        <div>
          <small>ĐIỀU PHỐI LỊCH PHỎNG VẤN</small>
          <h1>Lịch phỏng vấn & Đánh giá ứng viên</h1>
        </div>
        <button className="er-primary" onClick={() => open({ type: "schedule" })}>
          <Plus />
          Lên lịch phỏng vấn mới
        </button>
      </div>
      <div className="er-calendar-stats">
        <article>
          <CalendarDays />
          <span>
            Khoảng đang xem<b>{active.length} buổi PV</b>
          </span>
        </article>
        <article>
          <CalendarDays />
          <span>
            Hôm nay
            <b>{active.filter((item) => dayKey(item.scheduledStart) === today).length} buổi</b>
          </span>
        </article>
      </div>
      <div className="er-calendar-toolbar">
        <button onClick={() => setDate(today)}>Hôm nay</button>
        <button aria-label="Khoảng trước" onClick={() => setDate(shiftPeriod(date, -1, mode))}>
          <ChevronLeft />
        </button>
        <FormInput
          aria-label="Ngày xem lịch"
          type="date"
          value={date}
          onChange={(event) => {
            if (event.target.value) setDate(event.target.value);
          }}
        />
        <button aria-label="Khoảng sau" onClick={() => setDate(shiftPeriod(date, 1, mode))}>
          <ChevronRight />
        </button>
        <div>
          {[
            ["day", "Ngày"],
            ["week", "Tuần"],
            ["month", "Tháng"],
          ].map(([value, label]) => (
            <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>
              {label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(keyword.trim());
          }}
        >
          <Search />
          <FormInput
            aria-label="Tìm lịch phỏng vấn"
            placeholder="Ứng viên, email, phòng…"
            maxLength={200}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <button>Tìm</button>
        </form>
      </div>
      <div className="er-calendar-layout">
        <section>
          <LoadState load={load} retry={refresh} />
          {load.data && !rows.length && (
            <p className="er-card er-empty">Không có lịch phỏng vấn trong khoảng đã chọn.</p>
          )}
          {days.map((day) => (
            <div className="er-day" key={day}>
              <div className="er-card er-day-title">
                <strong>{vnDate(`${day}T12:00:00+07:00`)}</strong>
                <span>
                  {rows.filter((item) => dayKey(item.scheduledStart) === day).length} lịch PV
                </span>
              </div>
              {rows
                .filter((item) => dayKey(item.scheduledStart) === day)
                .map((item) => (
                  <article
                    className={`er-card er-interview ${item.interviewStatus === "cancelled" ? "er-cancelled" : ""}`}
                    key={item.id}
                  >
                    <div className="er-interview-time">
                      <b>
                        {vnTime(item.scheduledStart)} – {vnTime(item.scheduledEnd)}
                      </b>
                      <small>
                        {item.interviewStatus === "cancelled"
                          ? "ĐÃ HỦY"
                          : item.interviewStatus === "completed"
                            ? "ĐÃ ĐÁNH GIÁ"
                            : new Date(item.scheduledEnd) < new Date()
                              ? "ĐÃ DIỄN RA"
                              : new Date(item.scheduledStart) < new Date()
                                ? "ĐANG DIỄN RA"
                                : "SẼ DIỄN RA"}
                      </small>
                    </div>
                    <div className="er-interview-person">
                      <h2>{item.candidate}</h2>
                      <p>{item.headline || "Chưa cập nhật vị trí"}</p>
                      <span className="er-status">{item.stage}</span>
                      <p className="er-orange">Chiến dịch: {item.campaign}</p>
                      <p>
                        Địa điểm / Phòng họp:{" "}
                        {item.location || (item.meetingUrl ? "Trực tuyến" : "Chưa cập nhật")}
                        {item.meetingUrl && (
                          <>
                            {" "}
                            •{" "}
                            <a href={item.meetingUrl} target="_blank" rel="noreferrer">
                              Mở phòng họp
                            </a>
                          </>
                        )}
                      </p>
                      {item.feedbacks.map((feedback, index) => (
                        <p key={index} className="er-feedback">
                          <b>
                            {feedback.reviewer}: {feedback.score}/10 • {feedback.decision}
                          </b>
                          <br />
                          {feedback.comment}
                        </p>
                      ))}
                    </div>
                    <div className="er-interview-actions">
                      <button
                        className="er-primary"
                        disabled={
                          item.interviewStatus === "cancelled" ||
                          new Date(item.scheduledStart) > new Date()
                        }
                        onClick={() => open({ type: "feedback", item })}
                      >
                        Nhập đánh giá
                      </button>
                      {!["cancelled", "completed"].includes(item.interviewStatus) && (
                        <button
                          disabled={pending}
                          onClick={() => {
                            if (window.confirm("Hủy lịch phỏng vấn này?"))
                              action(`/interviews/${item.id}/cancel`);
                          }}
                        >
                          Hủy lịch
                        </button>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          ))}
        </section>
        <aside>
          <section className="er-card er-month">
            <h2>
              <CalendarDays />
              Lịch tháng {Number(date.slice(5, 7))}/{date.slice(0, 4)}
            </h2>
            <LoadState load={monthLoad} retry={refresh} />
            <div className="er-calendar-grid">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
                <strong key={label}>{label}</strong>
              ))}
              {Array.from({ length: 42 }, (_, index) => {
                const key = dateShift(calendarStart, index),
                  count =
                    monthLoad.data?.filter(
                      (item) =>
                        dayKey(item.scheduledStart) === key && item.interviewStatus !== "cancelled",
                    ).length || 0;
                return (
                  <button
                    key={key}
                    className={`${key === date ? "er-selected-day" : ""} ${key.slice(0, 7) !== date.slice(0, 7) ? "er-other-month" : ""}`}
                    aria-label={`Xem ngày ${key}`}
                    onClick={() => {
                      setDate(key);
                      setMode("day");
                    }}
                  >
                    <b>{Number(key.slice(-2))}</b>
                    {count > 0 && <small>{count} ca</small>}
                    {key === today && <i />}
                  </button>
                );
              })}
            </div>
            <p>Chọn ngày để xem lịch phỏng vấn.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
function RecruitmentDialog({ dialog, metadata, close, action, pending, error }) {
  const [candidateSearch, setCandidateSearch] = useState("");
  const ref = useRef(null);
  const [form, setForm] = useState(() => ({
    state: dialog.item?.applicationStatus || "Applied",
    campaignId: dialog.item?.campaignId || metadata.campaigns[0]?.id || "",
    applicationId: dialog.item?.id || "",
    stageId: dialog.type === "move" ? dialog.item?.stageId || "" : "",
    readiness: dialog.item?.readinessStatus || "unknown",
    notes: dialog.item?.notes || "",
    start: "",
    end: "",
    location: "",
    meetingUrl: "",
    score: 5,
    decision: "Consider",
    comment: "",
  }));
  const campaign =
    dialog.campaign || metadata.campaigns.find((item) => item.id === form.campaignId);
  const applications = useLoad(
    dialog.type === "schedule" && !dialog.item
      ? `?${new URLSearchParams({ campaignId: form.campaignId, page: 1, ...(candidateSearch.trim() && { keyword: candidateSearch.trim() }) })}`
      : null,
  );
  useEffect(() => {
    ref.current.showModal();
    const element = ref.current;
    return () => element.close();
  }, []);
  const patch = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const field = (key, label, type = "text", required = true) => (
    <label className="er-dialog-field">
      {label}
      <FormInput
        aria-label={label}
        required={required}
        type={type}
        maxLength={key === "meetingUrl" ? 2048 : 200}
        min={key === "score" ? 0 : undefined}
        max={key === "score" ? 10 : undefined}
        step={key === "score" ? 0.1 : undefined}
        value={form[key]}
        onChange={(event) => patch(key, event.target.value)}
      />
    </label>
  );
  const select = (key, label, items) => (
    <label className="er-dialog-field">
      {label}
      <Select
        aria-label={label}
        required
        value={form[key]}
        onChange={(event) => {
          patch(key, event.target.value);
          if (key === "campaignId") {
            patch("stageId", "");
            if (!dialog.item) patch("applicationId", "");
          }
        }}
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
  async function submit(event) {
    event.preventDefault();
    if (dialog.type === "status")
      return action(
        `/${dialog.item.id}/status`,
        { state: form.state, revision: dialog.item.revision ?? null },
        "PUT",
      );
    if (dialog.type === "talent")
      return action(
        `/talents/${dialog.item.id}`,
        { readiness: form.readiness, notes: form.notes, revision: dialog.item.revision },
        "PUT",
      );
    if (dialog.type === "assign")
      return action(`/talents/${dialog.item.id}/assign`, { campaignId: form.campaignId });
    if (dialog.type === "move")
      return action("/move", { applicationIds: dialog.ids, stageId: form.stageId });
    if (dialog.type === "feedback")
      return action(
        `/interviews/${dialog.item.id}/feedback`,
        { score: Number(form.score), decision: form.decision, comment: form.comment },
        "PUT",
      );
    if (dialog.type === "schedule")
      return action("/interviews", {
        applicationId: form.applicationId,
        stageId: form.stageId,
        start: `${form.start}:00+07:00`,
        end: `${form.end}:00+07:00`,
        location: form.location,
        meetingUrl: form.meetingUrl,
      });
  }
  const title = {
    status: "Cập nhật trạng thái ứng viên",
    talent: "Ghi chú & Độ sẵn sàng",
    assign: "Gán ứng viên vào chiến dịch",
    move: "Chuyển vòng tuyển dụng",
    schedule: "Lên lịch phỏng vấn",
    feedback: "Đánh giá phỏng vấn",
    cv: "Hồ sơ CV",
  }[dialog.type];
  return (
    <dialog
      ref={ref}
      className="er-dialog"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="er-dialog-heading">
        <h2>{title}</h2>
        <button disabled={pending} aria-label="Đóng" onClick={close}>
          <X />
        </button>
      </div>
      {error && (
        <p role="alert" className="er-error">
          {error}
        </p>
      )}
      <form onSubmit={submit}>
        <fieldset disabled={pending}>
          {dialog.type === "status" && (
            <>
              <p className="er-dialog-note">
                Ứng viên: <b>{dialog.item.profile.name}</b> • Vòng:{" "}
                {dialog.item.stage || "Chưa phân vòng"}
              </p>
              {select(
                "state",
                "Trạng thái xử lý",
                Object.entries(states).map(([id, name]) => ({ id, name })),
              )}
              <p className="er-dialog-note">
                Cập nhật trạng thái không thay đổi vòng tuyển dụng hiện tại.
              </p>
            </>
          )}
          {dialog.type === "talent" && (
            <>
              {select(
                "readiness",
                "Độ sẵn sàng",
                Object.entries(readiness).map(([id, name]) => ({ id, name })),
              )}
              <label className="er-dialog-field">
                Ghi chú
                <textarea
                  aria-label="Ghi chú hồ sơ"
                  maxLength={4000}
                  value={form.notes}
                  onChange={(event) => patch("notes", event.target.value)}
                />
              </label>
            </>
          )}
          {["assign", "schedule"].includes(dialog.type) &&
            select(
              "campaignId",
              "Chiến dịch",
              metadata.campaigns
                .filter((item) => item.campaignStatus !== "Ended")
                .map((item) => ({ id: item.id, name: item.title })),
            )}
          {dialog.type === "schedule" && !dialog.item && (
            <label className="er-dialog-field">
              Tìm ứng viên trong chiến dịch
              <FormInput
                aria-label="Tìm ứng viên để lên lịch"
                maxLength={200}
                value={candidateSearch}
                onChange={(event) => {
                  setCandidateSearch(event.target.value);
                  patch("applicationId", "");
                }}
              />
            </label>
          )}
          {dialog.type === "schedule" && (
            <>
              {dialog.item ? (
                <p>
                  Ứng viên: <b>{dialog.item.profile.name}</b>
                </p>
              ) : (
                select(
                  "applicationId",
                  "Ứng viên",
                  (applications.data?.items || []).map((item) => ({
                    id: item.id,
                    name: item.profile.name,
                  })),
                )
              )}
              {applications.data?.totalCount > 10 && (
                <p className="er-dialog-note">
                  Danh sách hiện 10 hồ sơ mới nhất. Có thể lên lịch trực tiếp từ màn Quản lý ứng
                  viên để chọn hồ sơ khác.
                </p>
              )}
              {select(
                "stageId",
                "Vòng phỏng vấn",
                (campaign?.stages || []).map((item) => ({ id: item.id, name: item.name })),
              )}
              {field("start", "Bắt đầu (giờ Việt Nam)", "datetime-local")}
              {field("end", "Kết thúc (giờ Việt Nam)", "datetime-local")}
              {field("location", "Địa điểm / Phòng họp", "text", false)}
              {field("meetingUrl", "Link họp trực tuyến", "url", false)}
            </>
          )}
          {dialog.type === "move" && (
            <>
              <p className="er-dialog-note">
                {dialog.item ? (
                  <>
                    {dialog.item.profile.name} • Vòng hiện tại:{" "}
                    <b>{dialog.item.stage || "Chưa phân vòng"}</b>
                  </>
                ) : (
                  `Đã chọn ${dialog.ids.length} ứng viên`
                )}
              </p>
              {select(
                "stageId",
                "Vòng tuyển dụng",
                (campaign?.stages || []).map((item, index) => ({
                  id: item.id,
                  name: `V${index + 1}. ${item.name}`,
                })),
              )}
              <p className="er-dialog-note">
                Chuyển vòng sẽ cập nhật trạng thái thành Đang phỏng vấn.
              </p>
            </>
          )}
          {dialog.type === "feedback" && (
            <>
              {field("score", "Điểm đánh giá (0–10)", "number")}
              {select("decision", "Kết luận", [
                { id: "Pass", name: "Đạt" },
                { id: "Fail", name: "Không đạt" },
                { id: "Consider", name: "Cân nhắc" },
              ])}
              <label className="er-dialog-field">
                Nhận xét
                <textarea
                  aria-label="Nhận xét đánh giá"
                  required
                  maxLength={4000}
                  value={form.comment}
                  onChange={(event) => patch("comment", event.target.value)}
                />
              </label>
            </>
          )}
          <div className="er-dialog-actions">
            <button type="button" onClick={close}>
              Hủy
            </button>
            <button
              className="er-primary"
              disabled={
                dialog.type === "move" && !!dialog.item && form.stageId === dialog.item.stageId
              }
            >
              {pending ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </fieldset>
      </form>
    </dialog>
  );
}
