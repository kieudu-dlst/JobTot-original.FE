import { Select } from "@/shared/ui/select";
import { SectionTabs } from "@/shared/ui/section-tabs";
import { RecruitmentTabs } from "@/widgets/recruitment-tabs";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  UsersRound,
  Heart,
  Bookmark,
  BriefcaseBusiness,
  MapPin,
  ArrowUpRight,
  Check,
  X,
  MessageCircle,
  GraduationCap,
  Award,
  Layers,
  RefreshCw,
  Info,
} from "lucide-react";
import { Pagination } from "@/shared/ui/pagination";
import { EmployerHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { useEmployerSession } from "@/features/authenticate";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { useToast } from "@/shared/ui/toast-context";
import { mediaUrl } from "@/shared/lib/media-url";
import { discoveryRequest, updateCollection } from "../api/discovery";
import { SkillFilter } from "./skill-filter";
import "./employer-discovery.css";

const readyLabels = { looking: "Đang tìm việc", considering: "Cân nhắc cơ hội" };
const emptyFilters = {
  keyword: "",
  campaignId: "",
  provinceId: "",
  skill: "",
  minYears: "",
  readiness: "",
  minScore: "",
};
const collections = [
  ["all", "Khám phá hồ sơ", UsersRound],
  ["interested", "Đang quan tâm", Heart],
  ["saved", "Đã lưu tài năng", Bookmark],
];

function useDiscovery(path, attempt = 0, onLoaded) {
  const [state, setState] = useState({ path: null, data: null, error: "", loading: true });
  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        setState({ path, attempt, data: null, error: "", loading: true });
        try {
          const data = await discoveryRequest(path, { signal: controller.signal });
          if (!controller.signal.aborted) {
            setState({ path, attempt, data, error: "", loading: false });
            onLoaded?.(data);
          }
        } catch (failure) {
          if (!controller.signal.aborted)
            setState({ path, attempt, data: null, error: failure.message, loading: false });
        }
      },
      path.startsWith("?") ? 180 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [path, attempt, onLoaded]);
  return state.path === path && state.attempt === attempt
    ? state
    : { data: null, loading: true, error: "" };
}

export function EmployerDiscoveryPage() {
  const { account, loading, error } = useEmployerSession();
  if (loading)
    return (
      <p className="td-session" role="status">
        Đang kiểm tra phiên đăng nhập…
      </p>
    );
  if (!account && !error)
    return <Navigate to="/login?role=employer&returnTo=%2Femployer%2Fdiscover" replace />;
  if (!account)
    return (
      <p role="alert" className="td-session">
        {error}
      </p>
    );
  return <Discovery key={`${account.id}-${account.companyId}`} account={account} />;
}

function Discovery({ account }) {
  const [params, setParams] = useSearchParams();
  const notify = useToast();
  const [attempt, setAttempt] = useState(0);
  const metadata = useDiscovery("/metadata", attempt);
  const selected = Object.fromEntries(
    Object.keys(emptyFilters).map((key) => [key, params.get(key) || ""]),
  );
  const collection = ["interested", "saved"].includes(params.get("collection"))
    ? params.get("collection")
    : "all";
  const sort = ["newest", "experience"].includes(params.get("sort")) ? params.get("sort") : "match";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [keyword, setKeyword] = useState(selected.keyword);
  const [detail, setDetail] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [overrides, setOverrides] = useState({});
  const clearOverrides = useCallback(() => setOverrides({}), [setOverrides]);
  const mutation = useRef(false);
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(selected).filter(([, value]) => value)),
    collection,
    sort,
    page,
    pageSize: 12,
  });
  const load = useDiscovery(metadata.data ? `?${query}` : null, attempt, clearOverrides);
  const data = load.data;
  const stats = data?.stats || metadata.data?.stats;
  const campaign = metadata.data?.campaigns.find((item) => item.id === selected.campaignId);
  const filtersCount = Object.values(selected).filter(Boolean).length;

  function change(values) {
    const next = new URLSearchParams(params);
    next.delete("page");
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // Commit the URL before the next filter event can read an older selection.
    setParams(next, { replace: true, flushSync: true });
    setActionError("");
  }
  function reset() {
    setKeyword("");
    setParams(collection === "all" ? {} : { collection }, { replace: true, flushSync: true });
  }
  function row(item) {
    return { ...item, ...overrides[item.candidateId] };
  }
  async function toggle(item, type) {
    if (mutation.current) return;
    mutation.current = true;
    setBusyId(item.candidateId);
    setActionError("");
    const value = type === "interest" ? !item.isInterested : !item.isSaved;
    try {
      const result = await updateCollection(item.candidateId, type, value);
      setOverrides((current) => ({
        ...current,
        [item.candidateId]: { ...current[item.candidateId], ...result },
      }));
      setDetail((current) =>
        current?.candidateId === item.candidateId ? { ...current, ...result } : current,
      );
      setAttempt((current) => current + 1);
      notify(
        type === "interest"
          ? value
            ? "Đã đánh dấu quan tâm hồ sơ."
            : "Đã bỏ quan tâm hồ sơ."
          : value
            ? "Đã lưu vào danh sách tài năng của công ty."
            : "Đã bỏ lưu hồ sơ khỏi danh sách tài năng.",
      );
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      mutation.current = false;
      setBusyId(null);
    }
  }

  return (
    <div className="talent-discovery font-roboto">
      <title>Tìm nhân tài | Job Tốt</title>
      <EmployerHeader userName={account.fullName} active="candidates" />
      <main className="page-container company-container td-container">
        <PageBreadcrumb current="Quản lý ứng viên" root={null} />
        <RecruitmentTabs active="discover" />
        <section className="td-hero">
          <div className="td-hero-copy">
            <span className="td-eyebrow">
              <span />
              KẾT NỐI ĐÚNG NGƯỜI, CHO ĐÚNG CƠ HỘI
            </span>
            <h1>
              Tìm nhân tài.
              <br />
              <em>Phát triển đội ngũ.</em>
            </h1>
            <p>
              Khám phá hồ sơ triển vọng, đối chiếu với nhu cầu tuyển dụng và giữ kết nối với những
              ứng viên bạn quan tâm.
            </p>
            <form
              className="td-search"
              onSubmit={(event) => {
                event.preventDefault();
                change({ keyword: keyword.trim() });
              }}
            >
              <Search />
              <input
                aria-label="Tìm hồ sơ ứng viên"
                placeholder="Tên, vị trí mong muốn hoặc kỹ năng…"
                maxLength={200}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <button type="submit">
                Tìm hồ sơ
                <ArrowUpRight />
              </button>
            </form>
          </div>
          <div className="td-hero-panel">
            <div className="td-panel-icon">
              <UsersRound />
            </div>
            <span>ĐỘI NGŨ TIẾP THEO CỦA</span>
            <h2>{metadata.data?.company.name || "Doanh nghiệp của bạn"}</h2>
            <p>Bắt đầu từ một kết nối phù hợp.</p>
            <div className="td-panel-stats">
              <div>
                <strong>{stats?.discoverable ?? "—"}</strong>
                <span>Hồ sơ đang mở</span>
              </div>
              <div>
                <strong>{metadata.data?.campaigns.length ?? "—"}</strong>
                <span>Chiến dịch đang chạy</span>
              </div>
            </div>
          </div>
        </section>

        <SectionTabs
          className="td-collections"
          label="Danh sách hồ sơ"
          active={collection}
          onChange={(value) => change({ collection: value })}
          items={collections.map(([value, label, icon]) => ({
            value,
            label,
            icon,
            count: stats ? stats[value === "all" ? "discoverable" : value] : "—",
          }))}
        />
        {metadata.error ? (
          <Failure error={metadata.error} retry={() => setAttempt((value) => value + 1)} />
        ) : !metadata.data ? (
          <p role="status" className="td-loading">
            Đang tải nhu cầu tuyển dụng…
          </p>
        ) : (
          <div className="td-layout">
            <aside className="td-filter-panel">
              <div className="td-filter-heading">
                <h2>
                  <SlidersHorizontal />
                  Bộ lọc hồ sơ
                </h2>
                {filtersCount > 0 && <span>{filtersCount}</span>}
              </div>
              <label>
                Đối chiếu chiến dịch
                <Select
                  aria-label="Đối chiếu chiến dịch"
                  value={selected.campaignId}
                  onChange={(event) => change({ campaignId: event.target.value })}
                >
                  <option value="">Phù hợp nhất với công ty</option>
                  {metadata.data.campaigns.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              </label>
              <p className="td-filter-help">
                {campaign
                  ? "Xếp hạng theo yêu cầu của chiến dịch đã chọn."
                  : "Đối chiếu với các chiến dịch đang chạy của công ty."}
              </p>
              <label>
                Địa điểm
                <Select
                  aria-label="Địa điểm ứng viên"
                  value={selected.provinceId}
                  onChange={(event) => change({ provinceId: event.target.value })}
                >
                  <option value="">Tất cả tỉnh / thành</option>
                  {metadata.data.provinces.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </label>
              <SkillFilter
                skills={metadata.data.skills}
                value={selected.skill}
                onChange={(skill) => change({ skill })}
              />
              <label>
                Kinh nghiệm
                <Select
                  aria-label="Kinh nghiệm tối thiểu"
                  value={selected.minYears}
                  onChange={(event) => change({ minYears: event.target.value })}
                >
                  <option value="">Không giới hạn</option>
                  <option value="1">Từ 1 năm</option>
                  <option value="3">Từ 3 năm</option>
                  <option value="5">Từ 5 năm</option>
                  <option value="10">Từ 10 năm</option>
                </Select>
              </label>
              <label>
                Trạng thái tìm việc
                <Select
                  aria-label="Trạng thái tìm việc"
                  value={selected.readiness}
                  onChange={(event) => change({ readiness: event.target.value })}
                >
                  <option value="">Đang mở cơ hội</option>
                  {Object.entries(readyLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                Mức phù hợp
                <Select
                  aria-label="Mức phù hợp tối thiểu"
                  value={selected.minScore}
                  disabled={!metadata.data.campaigns.length}
                  onChange={(event) => change({ minScore: event.target.value })}
                >
                  <option value="">Tất cả mức phù hợp</option>
                  <option value="50">Từ 50 điểm</option>
                  <option value="70">Từ 70 điểm</option>
                  <option value="85">Từ 85 điểm</option>
                </Select>
              </label>
              <button className="td-reset" onClick={reset}>
                <RefreshCw />
                Đặt lại bộ lọc
              </button>
              <div className="td-filter-note">
                <Info />
                <p>
                  Hồ sơ đang tìm việc hoặc cân nhắc cơ hội mới. Bạn có thể liên hệ trực tiếp qua tin
                  nhắn.
                </p>
              </div>
            </aside>
            <section className="td-results" aria-label="Kết quả hồ sơ ứng viên">
              <div className="td-results-heading">
                <div>
                  <span className="td-result-eyebrow">
                    {collection === "all"
                      ? "KHÁM PHÁ CƠ HỘI KẾT NỐI"
                      : collection === "interested"
                        ? "NHỮNG HỒ SƠ BẠN QUAN TÂM"
                        : "TÀI NĂNG CHO ĐỘI NGŨ"}
                  </span>
                  <h2>
                    {campaign?.title ||
                      (collection === "all"
                        ? "Hồ sơ triển vọng cho công ty"
                        : collection === "interested"
                          ? "Hồ sơ đang quan tâm"
                          : "Hồ sơ đã lưu")}
                  </h2>
                  <p>{data ? `${data.totalCount} hồ sơ phù hợp với bộ lọc` : "Đang tìm hồ sơ…"}</p>
                </div>
                <label>
                  Sắp xếp
                  <Select
                    aria-label="Sắp xếp hồ sơ"
                    value={sort}
                    onChange={(event) => change({ sort: event.target.value })}
                  >
                    <option value="match">Phù hợp nhất</option>
                    <option value="newest">Cập nhật gần nhất</option>
                    <option value="experience">Kinh nghiệm nhiều nhất</option>
                  </Select>
                </label>
              </div>
              {!!selected.keyword && (
                <div className="td-search-chip">
                  Từ khóa: <b>{selected.keyword}</b>
                  <button
                    aria-label="Xóa từ khóa"
                    onClick={() => {
                      setKeyword("");
                      change({ keyword: "" });
                    }}
                  >
                    <X />
                  </button>
                </div>
              )}
              <div className="td-matching-note">
                <Info />
                <p>
                  {metadata.data.matchingExplanation ||
                    "Mức phù hợp tham khảo dựa trên kỹ năng, vị trí, kinh nghiệm và địa điểm của các chiến dịch đang chạy."}
                  {!metadata.data.campaigns.length &&
                    " Tạo chiến dịch để nhận gợi ý phù hợp với vị trí tuyển dụng."}
                </p>
                {!metadata.data.campaigns.length && (
                  <Link to="/employer/campaigns/new">
                    Tạo chiến dịch
                    <ArrowUpRight />
                  </Link>
                )}
              </div>
              {actionError && (
                <p className="td-error" role="alert">
                  {actionError}
                </p>
              )}
              {load.error ? (
                <Failure error={load.error} retry={() => setAttempt((value) => value + 1)} />
              ) : load.loading ? (
                <div className="td-skeletons" role="status" aria-label="Đang tải hồ sơ">
                  {[0, 1, 2, 3].map((key) => (
                    <div className="td-skeleton" key={key}>
                      <span />
                      <i />
                      <i />
                      <i />
                    </div>
                  ))}
                </div>
              ) : data?.items.length ? (
                <>
                  <div className="td-cards">
                    {data.items.map((item) => (
                      <CandidateCard
                        key={item.candidateId}
                        item={row(item)}
                        busy={busyId !== null}
                        toggle={toggle}
                        open={() => {
                          setActionError("");
                          setDetail(item);
                        }}
                      />
                    ))}
                  </div>
                  <Pagination
                    aria-label="Phân trang hồ sơ ứng viên"
                    page={page}
                    totalPages={Math.ceil(data.totalCount / data.pageSize)}
                    onPageChange={(value) => change({ page: String(value) })}
                    info={`Hiển thị ${data.totalCount ? (page - 1) * data.pageSize + 1 : 0}–${Math.min(page * data.pageSize, data.totalCount)} / ${data.totalCount} hồ sơ`}
                  />
                </>
              ) : (
                <div className="td-empty">
                  <UsersRound />
                  <h3>
                    {collection === "all"
                      ? "Chưa tìm thấy hồ sơ phù hợp"
                      : collection === "interested"
                        ? "Chưa có hồ sơ đang quan tâm"
                        : "Chưa có hồ sơ đã lưu"}
                  </h3>
                  <p>
                    {collection === "all"
                      ? "Thử mở rộng địa điểm, kỹ năng hoặc mức kinh nghiệm."
                      : "Khám phá hồ sơ và lưu những ứng viên bạn muốn kết nối."}
                  </p>
                  <button
                    onClick={collection === "all" ? reset : () => change({ collection: "all" })}
                  >
                    {collection === "all" ? "Mở rộng bộ lọc" : "Khám phá hồ sơ"}
                  </button>
                </div>
              )}
              <div className="td-pool-note">
                <Bookmark />
                <div>
                  <strong>Giữ kết nối với những người phù hợp</strong>
                  <p>
                    Hồ sơ đã lưu được chia sẻ trong danh sách tài năng của công ty. Thêm ghi chú và
                    gán vào chiến dịch để tiếp tục tuyển dụng.
                  </p>
                </div>
                <Link to="/employer/talents">
                  Mở danh sách
                  <ArrowUpRight />
                </Link>
              </div>
            </section>
          </div>
        )}
      </main>
      <AuthFooter />
      {detail && (
        <CandidateDetail
          key={detail.candidateId}
          refreshVersion={attempt}
          campaignId={selected.campaignId}
          item={row(data?.items.find((item) => item.candidateId === detail.candidateId) || detail)}
          close={() => {
            setDetail(null);
            setActionError("");
          }}
          toggle={toggle}
          busy={busyId !== null}
          actionError={actionError}
        />
      )}
    </div>
  );
}

function Failure({ error, retry }) {
  return (
    <p role="alert" className="td-error">
      {error}
      <button onClick={retry}>Thử lại</button>
    </p>
  );
}
function CandidateAvatar({ profile }) {
  const src = mediaUrl(profile.avatarUrl);
  const [broken, setBroken] = useState(null);
  return (
    <span className="td-avatar">
      {src && src !== broken ? (
        <img src={src} alt="" onError={() => setBroken(src)} />
      ) : (
        profile.name
          .split(" ")
          .slice(-2)
          .map((word) => word[0])
          .join("")
      )}
    </span>
  );
}
function MatchBadge({ match }) {
  return match?.score != null ? (
    <span className={`td-match td-match-${match.score >= 70 ? "high" : "medium"}`}>
      <b>{match.score}</b>
      <small>/100 phù hợp</small>
    </span>
  ) : (
    <span className="td-unscored">Chưa đối chiếu</span>
  );
}
function CollectionActions({ item, toggle, busy }) {
  const name = item.profile.name;
  return (
    <div className="td-collection-actions">
      <button
        className={item.isInterested ? "td-interested" : ""}
        aria-label={`${item.isInterested ? "Bỏ quan tâm" : "Quan tâm"} ${name}`}
        aria-pressed={item.isInterested}
        disabled={busy}
        onClick={() => toggle(item, "interest")}
      >
        <Heart fill={item.isInterested ? "currentColor" : "none"} />
        {item.isInterested ? "Đang quan tâm" : "Quan tâm"}
      </button>
      <button
        className={item.isSaved ? "td-saved" : ""}
        aria-label={`${item.isSaved ? "Bỏ lưu" : "Lưu tài năng"} ${name}`}
        aria-pressed={item.isSaved}
        disabled={busy}
        onClick={() => toggle(item, "saved")}
      >
        <Bookmark fill={item.isSaved ? "currentColor" : "none"} />
        {item.isSaved ? "Đã lưu" : "Lưu tài năng"}
      </button>
    </div>
  );
}
function CandidateCard({ item, busy, toggle, open }) {
  const { profile, match } = item;
  return (
    <article className="td-candidate-card">
      <div className="td-card-top">
        <CandidateAvatar profile={profile} />
        <MatchBadge match={match} />
      </div>
      <button className="td-name" aria-label={`Xem hồ sơ ${profile.name}`} onClick={open}>
        <h3>{profile.name}</h3>
        <ArrowUpRight />
      </button>
      <p className="td-headline">
        {profile.headline || profile.desiredPosition || "Chưa cập nhật vị trí"}
      </p>
      <div className="td-facts">
        <span>
          <MapPin />
          {profile.location || "Chưa cập nhật địa điểm"}
        </span>
        <span>
          <BriefcaseBusiness />
          {profile.yearsExperience != null
            ? `${profile.yearsExperience} năm kinh nghiệm`
            : "Chưa cập nhật kinh nghiệm"}
        </span>
      </div>
      <span className={`td-ready td-ready-${profile.readyStatus}`}>
        <span />
        {readyLabels[profile.readyStatus] || "Đang mở cơ hội"}
      </span>
      <div className="td-skills">
        {profile.skills.slice(0, 4).map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
        {profile.skills.length > 4 && <span>+{profile.skills.length - 4}</span>}
        {!profile.skills.length && <small>Chưa cập nhật kỹ năng</small>}
      </div>
      <p className="td-summary">
        {profile.summary || "Ứng viên chưa bổ sung giới thiệu chuyên môn."}
      </p>
      <div className="td-fit-reasons">
        {match?.campaignTitle && (
          <span>
            <BriefcaseBusiness />
            {match.campaignTitle}
          </span>
        )}
        {match?.reasons.slice(0, 2).map((reason) => (
          <p key={reason}>
            <Check />
            {reason}
          </p>
        ))}
        {!match?.reasons.length && (
          <p className="td-neutral-reason">
            <Info />
            {match?.score != null
              ? "Xem hồ sơ để đối chiếu thêm với nhu cầu tuyển dụng."
              : "Thêm chiến dịch để đối chiếu hồ sơ."}
          </p>
        )}
      </div>
      <div className="td-card-footer">
        <CollectionActions item={item} toggle={toggle} busy={busy} />
        <button className="td-view" onClick={open}>
          Xem hồ sơ
          <ArrowUpRight />
        </button>
      </div>
    </article>
  );
}

function CandidateDetail({ item, campaignId, refreshVersion, close, toggle, busy, actionError }) {
  const [attempt, setAttempt] = useState(0);
  const detail = useDiscovery(
    `/${item.candidateId}${campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : ""}`,
    attempt + refreshVersion,
  );
  const currentItem = detail.data || item;
  const profile = detail.data?.profile || item.profile;
  const match = detail.data?.match || item.match;
  const entries = [
    [BriefcaseBusiness, "Kinh nghiệm làm việc", "experiences"],
    [GraduationCap, "Học vấn", "education"],
    [Layers, "Dự án", "projects"],
    [Award, "Chứng chỉ", "certificates"],
  ];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
    >
      <DialogContent className="td-detail font-roboto" showCloseButton={false}>
        <button className="td-detail-close" aria-label="Đóng hồ sơ" onClick={close} disabled={busy}>
          <X />
        </button>
        <div className="td-detail-hero">
          <CandidateAvatar profile={profile} />
          <div>
            <DialogTitle>{profile.name}</DialogTitle>
            <DialogDescription>
              {profile.headline || profile.desiredPosition || "Hồ sơ ứng viên"}
            </DialogDescription>
            <div className="td-facts">
              <span>
                <MapPin />
                {profile.location || "Chưa cập nhật"}
              </span>
              <span>
                <BriefcaseBusiness />
                {profile.yearsExperience != null
                  ? `${profile.yearsExperience} năm kinh nghiệm`
                  : "Chưa cập nhật kinh nghiệm"}
              </span>
            </div>
          </div>
        </div>
        {actionError && (
          <p role="alert" className="td-error">
            {actionError}
          </p>
        )}
        <div className="td-detail-toolbar">
          <CollectionActions
            item={currentItem}
            toggle={toggle}
            busy={busy || detail.loading || !!detail.error}
          />
          {item.accountId && (
            <Link
              className="td-primary"
              to={`/employer/messages?account=${encodeURIComponent(item.accountId)}`}
            >
              <MessageCircle />
              Nhắn tin
            </Link>
          )}
        </div>
        {detail.error ? (
          <Failure error={detail.error} retry={() => setAttempt((value) => value + 1)} />
        ) : detail.loading ? (
          <p role="status" className="td-loading">
            Đang tải hồ sơ chi tiết…
          </p>
        ) : (
          <div className="td-detail-body">
            <section className="td-detail-match">
              <div>
                <h3>Mức phù hợp với nhu cầu tuyển dụng</h3>
                <p>{match?.campaignTitle || "Chưa có chiến dịch để đối chiếu"}</p>
              </div>
              <MatchBadge match={match} />
              <ul>
                {match?.reasons.map((reason) => (
                  <li key={reason}>
                    <Check />
                    {reason}
                  </li>
                ))}
              </ul>
              {!!match?.missingSkills.length && (
                <p className="td-missing-skills">
                  Kỹ năng chưa thể đối chiếu: {match.missingSkills.join(", ")}
                </p>
              )}
            </section>
            <section>
              <h3>Giới thiệu chuyên môn</h3>
              <p className="td-long-text">{profile.summary || "Chưa cập nhật."}</p>
            </section>
            <section>
              <h3>Kỹ năng</h3>
              <div className="td-skills">
                {profile.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
                {!profile.skills.length && <p>Chưa cập nhật.</p>}
              </div>
            </section>
            <section>
              <h3>Mong muốn nghề nghiệp</h3>
              <dl className="td-preferences">
                <div>
                  <dt>Vị trí</dt>
                  <dd>{profile.desiredPosition || profile.headline || "Chưa cập nhật"}</dd>
                </div>
                <div>
                  <dt>Địa điểm</dt>
                  <dd>{profile.desiredLocation || profile.location || "Chưa cập nhật"}</dd>
                </div>
                <div>
                  <dt>Hình thức làm việc</dt>
                  <dd>{profile.workType || "Chưa cập nhật"}</dd>
                </div>
                <div>
                  <dt>Trạng thái</dt>
                  <dd>{readyLabels[profile.readyStatus] || "Đang mở cơ hội"}</dd>
                </div>
              </dl>
            </section>
            {entries.map(
              ([Icon, title, key]) =>
                !!profile[key]?.length && (
                  <section key={key}>
                    <h3>
                      <Icon />
                      {title}
                    </h3>
                    <div className="td-experience-list">
                      {profile[key].map((entry, index) => (
                        <article key={index}>
                          <div>
                            <h4>{entry.title}</h4>
                            <span>{entry.period}</span>
                          </div>
                          {entry.organization && (
                            <p className="td-organization">{entry.organization}</p>
                          )}
                          {entry.description && <p className="td-long-text">{entry.description}</p>}
                          {entry.tags && <small>{entry.tags}</small>}
                        </article>
                      ))}
                    </div>
                  </section>
                ),
            )}
            {currentItem.isSaved && (
              <Link className="td-talent-link" to="/employer/talents">
                <Bookmark />
                Thêm ghi chú hoặc gán hồ sơ vào chiến dịch
                <ArrowUpRight />
              </Link>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
