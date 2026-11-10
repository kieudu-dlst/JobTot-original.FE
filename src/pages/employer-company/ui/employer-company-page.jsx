import { useToast } from "@/shared/ui/toast-context";
import { mediaUrl } from "@/shared/lib/media-url";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Building2,
  BadgeCheck,
  MapPin,
  Users,
  FileCheck2,
  Pencil,
  Eye,
  Globe,
  Clock,
  Plus,
  Gift,
  Workflow,
  Heart,
  Images,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useEmployerSession } from "@/features/authenticate";
import { EmployerHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { employerCompanyApi } from "../api/company";
import { SectionEditor } from "./section-editor";
import { GalleryEditor } from "./gallery-editor";
import "./employer-company.css";
import { CompanyMap } from "@/shared/ui/company-map";

const field = (name, label, extra = {}) => ({ name, label, ...extra });
const numberFields = ["foundedYear", "sizeMin", "sizeMax"];
const coreFields = [
  field("name", "Tên hiển thị doanh nghiệp", { required: true, max: 200 }),
  field("website", "Website doanh nghiệp", { type: "url", max: 2048 }),
  field("address", "Địa chỉ trụ sở chính", { max: 200 }),
  field("foundedYear", "Năm thành lập", { type: "number", min: 1800, limit: 2100 }),
  field("sizeMin", "Quy mô nhân sự tối thiểu", { type: "number", min: 1, limit: 1000000 }),
  field("sizeMax", "Quy mô nhân sự tối đa", { type: "number", min: 1, limit: 1000000 }),
];
const brandFields = [
  field("englishName", "Tên thương mại quốc tế"),
  field("representative", "Người đại diện / Lãnh đạo"),
  field("capital", "Nguồn vốn / Vốn điều lệ"),
  field("workingHours", "Thời gian làm việc tiêu chuẩn"),
  field("industry", "Ngành nghề / Lĩnh vực"),
];
const listLabels = {
  highlights: "Chỉ số & điểm nổi bật",
  benefits: "Chế độ đãi ngộ & Phúc lợi đặc quyền",
  hiringProcess: "Quy trình phỏng vấn chuẩn",
  activities: "Hoạt động văn hóa nổi bật",
};

export function EmployerCompanyPage() {
  const { account, loading, error } = useEmployerSession();
  if (loading)
    return (
      <p role="status" className="ec-session">
        Đang kiểm tra phiên đăng nhập…
      </p>
    );
  if (!account && !error)
    return <Navigate to="/login?role=employer&returnTo=%2Femployer%2Fcompany" replace />;
  if (!account)
    return (
      <main className="ec-session">
        <p role="alert">{error}</p>
        <Link to="/login?role=employer">Đăng nhập lại</Link>
      </main>
    );
  return <CompanyEditor key={account.companyId} account={account} />;
}

function CompanyEditor({ account }) {
  const notify = useToast();
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [editor, setEditor] = useState(null);
  const submitting = useRef(false);
  const imageInput = useRef(null);
  const imageKind = useRef("logo");

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const value = await employerCompanyApi.get(controller.signal);
        if (!controller.signal.aborted) {
          setData(value);
          setDraft(structuredClone(value.document));
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
  async function save(next) {
    if (submitting.current) throw new Error("Đang lưu hồ sơ. Vui lòng chờ.");
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const value = await employerCompanyApi.save(next);
      setData(value);
      setDraft(structuredClone(value.document));
      notify("Đã lưu hồ sơ doanh nghiệp thành công.");
    } catch (failure) {
      setError(failure.message);
      throw failure;
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  function chooseImage(kind) {
    imageKind.current = kind;
    imageInput.current.click();
  }
  async function uploadImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || submitting.current) return;
    if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Chọn ảnh PNG/JPEG tối đa 5 MB.");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const value = await employerCompanyApi.upload(imageKind.current, file, draft.revision);
      window.dispatchEvent(new Event("employer-company-updated"));
      setData(value);
      setDraft(structuredClone(value.document));
      notify("Đã cập nhật ảnh doanh nghiệp.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  function editFields(title, target, fields) {
    setEditor({ title, target, fields, value: target === "core" ? draft : draft.brand });
  }
  function editList(name) {
    setEditor({ title: listLabels[name], target: name, list: true, value: draft.brand[name] });
  }
  async function apply(value) {
    let next;
    if (editor.target === "core") {
      next = { ...value };
      for (const name of numberFields)
        next[name] = next[name] === "" || next[name] == null ? null : Number(next[name]);
      if (next.sizeMin != null && next.sizeMax != null && next.sizeMin > next.sizeMax)
        throw new Error("Quy mô tối thiểu không được lớn hơn quy mô tối đa.");
    } else if (editor.target === "brand") next = { ...draft, brand: value };
    else next = { ...draft, brand: { ...draft.brand, [editor.target]: value } };
    await save(next);
    setEditor(null);
  }
  const editable = Boolean(data?.canEdit) && !pending;
  const editButton = (label, action) => (
    <button type="button" className="ec-edit" disabled={!editable} onClick={action}>
      <Pencil />
      {label}
    </button>
  );
  const text = (value) => value || "Chưa cập nhật";
  const brand = draft?.brand;
  const completion = draft
    ? Math.round(
        ([
          draft.name,
          draft.description,
          draft.address,
          draft.website,
          draft.foundedYear,
          brand.logoUrl,
          brand.coverUrl,
          brand.story,
          brand.values,
          brand.benefits.length,
          brand.hiringProcess.length,
          brand.gallery.length,
        ].filter(Boolean).length /
          12) *
          100,
      )
    : 0;
  const sectionHead = (Icon, title, subtitle, actions) => (
    <div className="ec-section-head">
      <div>
        <h2>
          <Icon />
          {title}
        </h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
  function itemCards(name, Icon) {
    const items = brand[name];
    return items.length ? (
      <div className={`ec-item-grid ${name === "hiringProcess" ? "ec-process" : ""}`}>
        {items.map((item, index) => (
          <article key={index}>
            <span className={`ec-item-icon ec-tone-${index % 4}`}>
              {name === "hiringProcess" ? index + 1 : <Icon />}
            </span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.tag && (
                <small>
                  <CheckCircle2 />
                  {item.tag}
                </small>
              )}
            </div>
            {editButton(`Chỉnh sửa mục ${index + 1}`, () => editList(name))}
          </article>
        ))}
      </div>
    ) : (
      <div className="ec-empty">
        Chưa có nội dung.{" "}
        {editable && (
          <button type="button" onClick={() => editList(name)}>
            <Plus />
            Thêm thông tin
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="employer-company-page font-roboto">
      <input
        ref={imageInput}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        onChange={uploadImage}
        aria-label="Tải ảnh doanh nghiệp"
      />
      <title>Hồ sơ doanh nghiệp & Thương hiệu tuyển dụng | Job Tốt</title>
      <EmployerHeader userName={account.fullName} active="company" />
      <main className="page-container company-container ec-container">
        <PageBreadcrumb current="Hồ sơ doanh nghiệp" />
        <div className="ec-page-heading">
          <div>
            <p>
              EMPLOYER BRANDING SUITE <span>● Hồ sơ doanh nghiệp</span>
            </p>
            <h1>Hồ sơ Doanh nghiệp & Thương hiệu Tuyển dụng</h1>
            <p>
              Xây dựng trang thương hiệu tuyển dụng chuyên nghiệp để thu hút nhân tài
              <br className="ec-desktop-break" /> bằng những giá trị khác biệt của doanh nghiệp.
            </p>
          </div>
          <div className="ec-heading-actions">
            {data && (
              <Link
                className="ec-outline"
                to={`/companies/${data.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Eye />
                Xem trang ứng viên nhìn thấy
              </Link>
            )}
          </div>
        </div>
        {error && (
          <div role="alert" className="ec-error-banner">
            {error}
            <button
              type="button"
              disabled={pending}
              onClick={() => setAttempt((value) => value + 1)}
            >
              Tải lại hồ sơ
            </button>
          </div>
        )}

        {!data ? (
          !error && (
            <p role="status" className="ec-loading">
              Đang tải hồ sơ doanh nghiệp…
            </p>
          )
        ) : (
          <>
            {!data.canEdit && (
              <p className="ec-readonly">
                <ShieldCheck />
                Tài khoản chưa có liên kết hoạt động với doanh nghiệp để chỉnh sửa hồ sơ.
              </p>
            )}
            <section className="ec-strength">
              <div className="ec-progress" style={{ "--progress": `${completion}%` }}>
                <span>{completion}%</span>
              </div>
              <div>
                <h2>
                  Chỉ số hấp dẫn hồ sơ (Profile Strength){" "}
                  <span>{completion >= 80 ? "ĐẦY ĐỦ" : "ĐANG HOÀN THIỆN"}</span>
                </h2>
                <p>
                  Hoàn thiện thông tin doanh nghiệp, phúc lợi và văn hóa để giúp ứng viên hiểu rõ
                  hơn.
                </p>
              </div>
              <div className="ec-strength-stats">
                <span>Đang tuyển dụng</span>
                <strong>{data.openJobs.toLocaleString("vi-VN")} vị trí</strong>
              </div>
            </section>
            <section className="ec-identity ec-card">
              <div className={`ec-cover ${!brand.coverUrl ? "ec-cover-empty" : ""}`}>
                {brand.coverUrl && (
                  <img src={mediaUrl(brand.coverUrl)} alt="Ảnh bìa doanh nghiệp" />
                )}
                <div className="ec-cover-action">
                  {
                    <button
                      type="button"
                      className="ec-edit"
                      disabled={!editable}
                      onClick={() => chooseImage("cover")}
                    >
                      <Pencil />
                      Thay đổi ảnh bìa
                    </button>
                  }
                </div>
                {!brand.coverUrl && (
                  <div>
                    <Building2 />
                    <p>Không gian làm việc & Thương hiệu doanh nghiệp</p>
                  </div>
                )}
              </div>
              <div className="ec-identity-info">
                <button
                  type="button"
                  className="ec-logo"
                  disabled={!editable}
                  aria-label="Thay đổi logo doanh nghiệp"
                  onClick={() => chooseImage("logo")}
                >
                  {brand.logoUrl ? (
                    <img src={mediaUrl(brand.logoUrl)} alt={`Logo ${draft.name}`} />
                  ) : (
                    <Building2 />
                  )}
                </button>
                <div className="ec-identity-name">
                  <h2>{draft.name}</h2>
                  <span
                    className={`ec-badge ${data.verificationStatus === "Verified" ? "" : "ec-badge-pending"}`}
                  >
                    <BadgeCheck />
                    {data.verificationStatus === "Verified"
                      ? "Doanh nghiệp đã xác minh"
                      : "Đang chờ xác minh"}
                  </span>
                  <p>
                    <Users />
                    {draft.sizeMin || draft.sizeMax
                      ? `${draft.sizeMin || 0} – ${draft.sizeMax || draft.sizeMin} nhân viên`
                      : "Chưa cập nhật quy mô"}{" "}
                    <span>•</span> {text(brand.industry)}
                  </p>
                  <p>
                    <MapPin />
                    {text(draft.address || data.province)}
                  </p>
                </div>
                <div className="ec-company-stats">
                  <div>
                    <small>TIN ĐANG MỞ</small>
                    <strong>{data.openJobs} vị trí</strong>
                  </div>
                  <div>
                    <small>THEO DÕI</small>
                    <strong>{data.followers.toLocaleString("vi-VN")}</strong>
                  </div>
                </div>
              </div>
            </section>
            <section className="ec-card">
              {sectionHead(
                FileCheck2,
                "Pháp lý & Giấy phép Doanh nghiệp",
                "Thông tin đăng ký và hồ sơ pháp lý của doanh nghiệp",
                editButton("Chỉnh sửa thông tin", () =>
                  editFields("Thông tin doanh nghiệp", "core", coreFields),
                ),
              )}
              <div className="ec-facts">
                <div>
                  <label>Mã số thuế (MST) doanh nghiệp</label>
                  <strong>{text(data.taxCode)}</strong>
                  <small>
                    <ShieldCheck />
                    {data.verificationStatus === "Verified"
                      ? "Đã xác minh"
                      : "Chờ kiểm tra thông tin đăng ký"}
                  </small>
                </div>
                <div>
                  <label>Tên pháp lý theo đăng ký kinh doanh</label>
                  <strong>{text(data.legalName)}</strong>
                </div>
                {[
                  ["Tên thương mại quốc tế", brand.englishName],
                  ["Người đại diện / Lãnh đạo", brand.representative],
                  ["Nguồn vốn / Vốn điều lệ", brand.capital],
                  ["Năm thành lập", draft.foundedYear],
                  ["Thời gian làm việc tiêu chuẩn", brand.workingHours],
                ].map(([label, value]) => (
                  <div key={label}>
                    <label>{label}</label>
                    <strong>{text(value)}</strong>
                  </div>
                ))}
                <div>
                  <label>Website chính thức của công ty</label>
                  {draft.website ? (
                    <a href={draft.website} target="_blank" rel="noopener noreferrer">
                      <Globe />
                      {draft.website}
                    </a>
                  ) : (
                    <strong>Chưa cập nhật</strong>
                  )}
                </div>
                <div>
                  <label>Trụ sở chính & Chi nhánh đăng ký</label>
                  <strong>
                    <MapPin />
                    {text(draft.address)} {data.province && `• ${data.province}`}
                  </strong>
                </div>
              </div>
              <div className="ec-industry">
                <div>
                  <h3>Ngành nghề & Lĩnh vực hoạt động chính</h3>
                  <p>{text(brand.industry)}</p>
                </div>
                {editButton("Bổ sung thông tin", () =>
                  editFields("Thông tin thương hiệu doanh nghiệp", "brand", brandFields),
                )}
              </div>
            </section>
            <div className="ec-two-columns">
              <section className="ec-card">
                {sectionHead(
                  MapPin,
                  "Vị trí trụ sở trên bản đồ",
                  null,
                  <span className="ec-badge">Vị trí doanh nghiệp</span>,
                )}
                <CompanyMap
                  address={draft.address}
                  province={data.province}
                  resolveMap={employerCompanyApi.resolveMap}
                />
              </section>
              <section className="ec-card">
                {sectionHead(
                  Users,
                  `Ban Tuyển Dụng (${data.team.length})`,
                  "Các thành viên đang liên kết với doanh nghiệp",
                )}
                <div className="ec-team">
                  {data.team.map((member, index) => (
                    <article key={member.id}>
                      <span className={`ec-team-avatar ec-tone-${index % 4}`}>
                        {member.name
                          .split(" ")
                          .slice(-2)
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <div>
                        <h3>{member.name}</h3>
                        <p>
                          {member.title || "Nhà tuyển dụng"} {member.email && `• ${member.email}`}
                        </p>
                      </div>
                      {member.isCompanyAdmin && <small>Quản trị viên</small>}
                    </article>
                  ))}
                </div>
              </section>
            </div>
            <section className="ec-card">
              {sectionHead(
                BookOpen,
                "Câu chuyện Văn hóa & Tuyên ngôn Giá trị",
                "Truyền tải những giá trị làm nên khác biệt của doanh nghiệp",
                editButton("Chỉnh sửa câu chuyện", () =>
                  editFields("Câu chuyện doanh nghiệp", "brand", [
                    field("story", "Câu chuyện / Giới thiệu doanh nghiệp", { multiline: true }),
                    field("values", "Tuyên ngôn giá trị & Giá trị cốt lõi", { multiline: true }),
                  ]),
                ),
              )}
              <div className="ec-story">
                <h3>Giới thiệu tổng quan & Sứ mệnh doanh nghiệp</h3>
                <p>{text(brand.story || draft.description)}</p>
                <h3>Giá trị cốt lõi</h3>
                <p>{text(brand.values)}</p>
              </div>
              <div className="ec-subheading">
                <h3>Chỉ số & Điểm nổi bật đáng tự hào</h3>
                {editButton("Chỉnh sửa điểm nổi bật", () => editList("highlights"))}
              </div>
              <div className="ec-highlights">
                {brand.highlights.length ? (
                  brand.highlights.map((item, index) => (
                    <article key={index}>
                      <strong>{item.title}</strong>
                      <h3>{item.description}</h3>
                      <p>{item.tag}</p>
                    </article>
                  ))
                ) : (
                  <p className="ec-empty">Chưa cập nhật chỉ số nổi bật.</p>
                )}
              </div>
              <div className="ec-description">
                <h3>Mô tả công khai trên trang ứng viên</h3>
                <p>{text(draft.description)}</p>
                {editButton("Chỉnh sửa mô tả", () =>
                  editFields("Mô tả doanh nghiệp", "core", [
                    field("description", "Mô tả công khai", {
                      multiline: true,
                      max: 4000,
                      rows: 6,
                    }),
                  ]),
                )}
              </div>
            </section>
            <section className="ec-card">
              {sectionHead(
                Gift,
                "Chế độ đãi ngộ & Phúc lợi đặc quyền",
                "Thể hiện những quyền lợi khác biệt mà ứng viên sẽ nhận được",
                editButton("Thêm / sửa phúc lợi", () => editList("benefits")),
              )}
              {itemCards("benefits", Gift)}
            </section>
            <section className="ec-card">
              {sectionHead(
                Workflow,
                "Quy trình Phỏng vấn Chuẩn (Standard Hiring & Interview Workflow)",
                "Quy trình rõ ràng giúp ứng viên chủ động chuẩn bị cho từng vòng tuyển dụng",
                editButton("Chỉnh sửa quy trình", () => editList("hiringProcess")),
              )}
              {itemCards("hiringProcess", Workflow)}
            </section>
            <section className="ec-card">
              {sectionHead(
                Heart,
                "Văn hóa & Đời sống Công ty (Workplace Culture & Life)",
                "Chia sẻ những giá trị gắn kết và trải nghiệm làm việc tại doanh nghiệp",
                editButton("Chỉnh sửa văn hóa", () =>
                  editFields("Văn hóa & Đời sống công ty", "brand", [
                    field("workplace", "Môi trường làm việc & Phong cách cộng tác", {
                      multiline: true,
                    }),
                    field("workLife", "Nhịp điệu làm việc & Cân bằng cuộc sống", {
                      multiline: true,
                    }),
                  ]),
                ),
              )}
              <div className="ec-culture-grid">
                <article>
                  <h3>Môi trường làm việc & Phong cách cộng tác</h3>
                  <p>{text(brand.workplace)}</p>
                </article>
                <article>
                  <h3>Nhịp điệu làm việc & Cân bằng cuộc sống</h3>
                  <p>{text(brand.workLife)}</p>
                </article>
              </div>
              <div className="ec-subheading">
                <h3>Hoạt động văn hóa nổi bật</h3>
                {editButton("Thêm / sửa hoạt động", () => editList("activities"))}
              </div>
              {itemCards("activities", Heart)}
            </section>
            <section className="ec-card">
              {sectionHead(
                Images,
                "Thư viện Hình ảnh & Không gian Công ty",
                "Đem lại góc nhìn chân thực về không gian làm việc của doanh nghiệp",
                editButton("Chỉnh sửa thư viện ảnh", () => setEditor({ target: "gallery" })),
              )}
              <div className="ec-gallery">
                {brand.gallery.length
                  ? brand.gallery.map((url, index) => (
                      <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          loading="lazy"
                          src={mediaUrl(url)}
                          alt={`Không gian doanh nghiệp ${index + 1}`}
                        />
                      </a>
                    ))
                  : Array.from({ length: 4 }, (_, index) => (
                      <div key={index}>
                        <Images />
                        <span>Chưa có ảnh</span>
                      </div>
                    ))}
              </div>
            </section>
          </>
        )}
      </main>
      <AuthFooter />
      {editor?.target === "gallery" && (
        <GalleryEditor
          error={error}
          urls={brand.gallery}
          busy={pending}
          onUpload={() => chooseImage("gallery")}
          onRemove={(index) =>
            save({
              ...draft,
              brand: { ...draft.brand, gallery: draft.brand.gallery.filter((_, i) => i !== index) },
            }).catch(() => {})
          }
          onClose={() => {
            if (!submitting.current) setEditor(null);
          }}
        />
      )}
      {editor && editor.target !== "gallery" && (
        <SectionEditor
          busy={pending}
          key={editor.title}
          editor={editor}
          onApply={apply}
          onClose={() => {
            if (!submitting.current) setEditor(null);
          }}
        />
      )}
    </div>
  );
}
