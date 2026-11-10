import { Select } from "@/shared/ui/select";
import { formatDate } from "@/shared/lib/date-format";
import { FormInput } from "@/shared/ui/date-picker";
import { useDemoDataset } from "@/shared/api/use-demo-dataset";
import { mediaUrl } from "@/shared/lib/media-url";
import { CareerResources } from "@/widgets/career-resources";
import { useToast } from "@/shared/ui/toast-context";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  UserRound,
  Pencil,
  Plus,
  Award,
  GraduationCap,
  FolderKanban,
  CheckCircle2,
  SlidersHorizontal,
  Upload,
  Download,
  Eye,
  Trash2,
} from "lucide-react";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { AuthHeader } from "@/widgets/auth-header";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { AuthFooter } from "@/widgets/auth-footer";
import { ServiceNotice } from "@/shared/ui/service-notice";
import { useCandidateSession } from "@/features/authenticate";
import { profileApi, downloadCv } from "../api/profile";
import { companiesApi } from "@/entities/company";
import { AvatarEditor } from "./avatar-editor";
import "./profile.css";

const sections = [
  ["experiences", "Kinh nghiệm làm việc", "Thêm kinh nghiệm", BriefcaseBusiness],
  ["skills", "Kỹ năng & Đánh giá năng lực", "Thêm kỹ năng", Award],
  ["education", "Học vấn & Đào tạo", "Thêm học vấn", GraduationCap],
  ["certificates", "Chứng chỉ quốc tế", "Thêm chứng chỉ", Award],
  ["projects", "Dự án cá nhân & Portfolio", "Thêm dự án", FolderKanban],
];
const entryFields = [
  ["title", "Tiêu đề", "text"],
  ["organization", "Tổ chức / Vai trò", "text"],
  ["period", "Thời gian", "text"],
  ["description", "Mô tả (mỗi ý một dòng)", "textarea"],
  ["tags", "Công nghệ (phân cách bằng dấu phẩy)", "text"],
];
const personalFields = [
  ["fullName", "Họ và tên", "text"],
  ["headline", "Chức danh", "text"],
  ["location", "Địa chỉ", "text"],
  ["birthDate", "Ngày sinh", "date"],
  ["gender", "Giới tính", "text"],
];
const workTypes = ["Toàn thời gian", "Bán thời gian", "Làm việc từ xa", "Kết hợp (Hybrid)"];
const normalizeProvince = (value) =>
  (value || "")
    .replace(/^(Thành phố|Tỉnh)\s+/i, "")
    .trim()
    .toLocaleLowerCase("vi-VN");
const preferenceFields = [
  ["expectedSalaryMin", "Lương tối thiểu (VND/tháng)", "number"],
  ["expectedSalaryMax", "Lương tối đa (VND/tháng)", "number"],
  ["desiredPosition", "Cấp bậc mong muốn", "text"],
  ["workType", "Hình thức làm việc", "text"],
  ["desiredLocation", "Địa điểm ưu tiên", "text"],
];

export function ProfilePage() {
  const { account, loading } = useCandidateSession();
  if (loading) return <p role="status">Đang kiểm tra đăng nhập…</p>;
  if (!account) return <Navigate to="/login" replace />;
  return <AuthenticatedProfilePage />;
}

function AuthenticatedProfilePage() {
  const notify = useToast();
  const { account, loading: sessionLoading, updateAvatar } = useCandidateSession();
  const accountId = account?.id;
  const demo = useDemoDataset("profile", !sessionLoading && !account);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null);
  const [provinces, setProvinces] = useState(null);
  const [provinceError, setProvinceError] = useState("");
  const [provinceAttempt, setProvinceAttempt] = useState(0);
  const editingPreferences = editor?.section === "preferences";
  const editingCatalog = editingPreferences || editor?.section === "personal";
  useEffect(() => {
    if (!editingCatalog) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      companiesApi
        .metadata(controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) {
            setProvinces(result.provinces);
            setProvinceError("");
          }
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setProvinceError(failure.message);
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [editingCatalog, provinceAttempt]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (accountId)
        profileApi
          .get(controller.signal)
          .then((value) => {
            if (!controller.signal.aborted) setData(value);
          })
          .catch((failure) => {
            if (!controller.signal.aborted) setError(failure.message);
          });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [accountId]);
  const preview = !account;
  const profile = data?.profile;
  async function persist(next) {
    setBusy(true);
    setError("");
    try {
      const saved = await profileApi.save(next);
      setData((current) => ({ ...saved, activity: saved.activity ?? current?.activity }));
      notify("Đã lưu hồ sơ thành công.");
      return true;
    } catch (failure) {
      setError(failure.message);
      notify(failure.message, { type: "error" });
      return false;
    } finally {
      setBusy(false);
    }
  }
  function edit(section, index = null) {
    if (preview) {
      notify("Đăng nhập để tạo và chỉnh sửa hồ sơ của bạn.", { type: "info" });
      return;
    }
    const values =
      section === "personal" || section === "preferences" || section === "summary"
        ? { ...profile }
        : index === null
          ? {
              title: "",
              organization: "",
              period: "",
              description: "",
              tags: "",
            }
          : { ...profile[section][index] };
    setEditor({ section, index, values });
  }
  async function submit(event) {
    event.preventDefault();
    const { section, index } = editor;
    const values = { ...editor.values };
    if (section === "preferences") {
      const selectedProvince = provinces?.find(
        (province) =>
          province.id === values.desiredProvinceId ||
          (!values.desiredProvinceId &&
            normalizeProvince(province.name) === normalizeProvince(values.desiredLocation)),
      );
      if (!workTypes.includes(values.workType) || !selectedProvince || provinceError) {
        notify("Vui lòng chọn hình thức làm việc và tỉnh/thành phố có sẵn.", {
          type: "error",
        });
        return;
      }
      values.desiredProvinceId = selectedProvince.id;
      values.desiredLocation = selectedProvince.name;
    }
    if (section === "personal") {
      const selectedProvince = provinces?.find(
        (province) =>
          province.id === values.provinceId ||
          (!values.provinceId &&
            normalizeProvince(province.name) === normalizeProvince(values.location)),
      );
      if (!selectedProvince || provinceError || !["Nam", "Nữ", "Khác"].includes(values.gender)) {
        notify("Vui lòng chọn tỉnh/thành phố và giới tính có sẵn.", {
          type: "error",
        });
        return;
      }
      values.provinceId = selectedProvince.id;
      values.location = selectedProvince.name;
    }
    let next = { ...profile };
    if (["personal", "preferences", "summary"].includes(section)) next = { ...next, ...values };
    else {
      next[section] = [...next[section]];
      if (index === null) next[section].push(values);
      else next[section][index] = values;
    }
    if (await persist(next)) setEditor(null);
  }
  async function upload(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !file.name.toLowerCase().endsWith(".pdf")) {
      notify("Chọn tệp PDF tối đa 5 MB.", { type: "error" });
      return;
    }
    setBusy(true);
    setError("");
    try {
      await profileApi.upload(file);
      setData(await profileApi.get());
      notify("Đã tải CV lên thành công.");
    } catch (failure) {
      setError(failure.message);
      notify(failure.message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }
  const fields =
    editor?.section === "personal"
      ? personalFields
      : editor?.section === "preferences"
        ? preferenceFields
        : editor?.section === "summary"
          ? [["summary", "Giới thiệu bản thân", "textarea"]]
          : entryFields;
  return (
    <div className="candidate-profile font-roboto">
      <title>Hồ sơ cá nhân | Job Tốt</title>
      <AuthHeader userName={profile?.fullName || account?.fullName} />
      <main className="page-container profile-container">
        <PageBreadcrumb current="Hồ sơ cá nhân">
          <span className="talent-banner">
            🔥 Hơn 2.500.000+ ứng viên tài CV và trúng tuyển tại FPT, Viettel, Vingroup, Big4
          </span>
        </PageBreadcrumb>
        {preview && !sessionLoading && (
          <div className="profile-message">
            Đây là hồ sơ mẫu theo thiết kế. <Link to="/login">Đăng nhập</Link> để quản lý hồ sơ cá
            nhân của bạn.
          </div>
        )}
        {error && (
          <div role="alert" className="profile-error">
            {error}
            {account && !data && (
              <button
                onClick={() => {
                  setError("");
                  profileApi
                    .get()
                    .then(setData)
                    .catch((e) => setError(e.message));
                }}
              >
                Thử lại
              </button>
            )}
          </div>
        )}
        {sessionLoading || (!preview && !profile && !error) ? (
          <p role="status">Đang tải hồ sơ…</p>
        ) : (
          profile && (
            <>
              <section className="profile-hero">
                <div className="profile-identity">
                  <div className="profile-avatar">
                    {profile.avatarUrl ? (
                      <img src={mediaUrl(profile.avatarUrl)} alt="Ảnh đại diện của bạn" />
                    ) : (
                      <span className="profile-avatar-placeholder">
                        <UserRound aria-hidden="true" />
                      </span>
                    )}
                    <CheckCircle2 />
                    <AvatarEditor
                      avatarUrl={profile.avatarUrl}
                      fullName={profile.fullName}
                      onSaved={(value) => {
                        setData((current) => ({
                          ...value,
                          activity: value.activity ?? current?.activity,
                        }));
                        updateAvatar(value.profile.avatarUrl);
                      }}
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <div className="identity-name">
                      <h1>{profile.fullName}</h1>
                      <button
                        aria-label="Chỉnh sửa thông tin cá nhân"
                        onClick={() => edit("personal")}
                      >
                        <Pencil />
                      </button>
                    </div>
                    <h2>{profile.headline || "Thêm chức danh của bạn"}</h2>
                    <p>
                      <Mail />
                      {preview ? demo?.email || "" : data.email || "Chưa có email"}
                      <Phone />
                      {preview ? demo?.phone || "" : data.phone || "Chưa có số điện thoại"}
                    </p>
                    <p>
                      <MapPin />
                      {profile.location || "Chưa cập nhật địa chỉ"}
                      <Calendar />
                      {profile.birthDate
                        ? formatDate(`${profile.birthDate}T00:00:00`)
                        : "Chưa cập nhật"}
                      <User />
                      {profile.gender}
                    </p>
                  </div>
                </div>
              </section>
              <div className="profile-columns">
                <div className="profile-sections">
                  <section className="profile-card">
                    <div className="section-heading">
                      <h2>
                        <span className="section-icon orange">
                          <BriefcaseBusiness />
                        </span>
                        Giới thiệu bản thân
                      </h2>
                      <button aria-label="Chỉnh sửa giới thiệu" onClick={() => edit("summary")}>
                        <Pencil />
                      </button>
                    </div>
                    <p className="summary-text">
                      {profile.summary ||
                        "Giới thiệu kinh nghiệm, điểm mạnh và mục tiêu nghề nghiệp của bạn."}
                    </p>
                  </section>
                  {sections.map(([key, title, add, Icon]) => (
                    <section className="profile-card" key={key}>
                      <div className="section-heading">
                        <h2>
                          <span
                            className={`section-icon ${key === "certificates" ? "green" : key === "skills" ? "purple" : "blue"}`}
                          >
                            <Icon />
                          </span>
                          {title}
                        </h2>
                        <button className="add-button" onClick={() => edit(key)}>
                          <Plus />
                          {add}
                        </button>
                      </div>
                      <div className={key === "certificates" ? "certificate-grid" : "entry-list"}>
                        {profile[key].length === 0 && (
                          <p className="empty-section">
                            Chưa có thông tin. Thêm để hoàn thiện hồ sơ của bạn.
                          </p>
                        )}
                        {profile[key].map((entry, index) => (
                          <article className={`profile-entry ${key}`} key={index}>
                            {key === "skills" ? (
                              <CheckCircle2 className="skill-check" />
                            ) : key === "certificates" ? (
                              <span className="certificate-icon">
                                <Award />
                              </span>
                            ) : null}
                            <div className="entry-top">
                              <h3>{entry.title}</h3>
                              {key !== "certificates" && (
                                <span className="entry-period">{entry.period}</span>
                              )}
                              <button
                                aria-label={`Chỉnh sửa ${entry.title}`}
                                onClick={() => edit(key, index)}
                              >
                                <Pencil />
                              </button>
                            </div>
                            {entry.organization && (
                              <p className="entry-organization">{entry.organization}</p>
                            )}
                            {key === "certificates" && (
                              <p className="certificate-period">Hiệu lực: {entry.period}</p>
                            )}
                            {entry.description &&
                              (key === "experiences" ? (
                                <ul>
                                  {entry.description
                                    .split("\n")
                                    .filter(Boolean)
                                    .map((line, i) => (
                                      <li key={i}>
                                        <CheckCircle2 />
                                        {line}
                                      </li>
                                    ))}
                                </ul>
                              ) : (
                                <p className="entry-description">{entry.description}</p>
                              ))}
                            {entry.tags && (
                              <div className="entry-tags">
                                {entry.tags
                                  .split(",")
                                  .filter((x) => x.trim())
                                  .map((tag, i) => (
                                    <span key={i}>{tag.trim()}</span>
                                  ))}
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
                <aside className="profile-sidebar">
                  <section className="profile-card">
                    <div className="section-heading">
                      <h2>
                        <FileText className="orange-text" />
                        CV đính kèm chính
                      </h2>
                      <span className="green-label">
                        {data?.cvs?.length || preview ? "Đang kích hoạt" : "Chưa có CV"}
                      </span>
                    </div>
                    {preview ? (
                      <div className="cv-document cv-document-preview">
                        <span>PDF</span>
                        <div>
                          <strong>{demo?.cvTitle}</strong>
                          <p>Tạo từ Job Tốt CV Studio</p>
                        </div>
                      </div>
                    ) : (
                      data.cvs.map((cv) => (
                        <div
                          className={`cv-document cv-file-card${cv.isDefault ? " is-default" : ""}`}
                          key={cv.id}
                        >
                          <div className="cv-file-heading">
                            <span className="cv-file-icon">
                              <FileText />
                            </span>
                            <div className="cv-file-identity">
                              <strong>{cv.title}</strong>
                              <p>{cv.isOnline ? "Job Tốt CV Studio" : "Tài liệu PDF"}</p>
                            </div>
                          </div>
                          <span className={`cv-file-badge${cv.isDefault ? " is-default" : ""}`}>
                            {cv.isDefault && <CheckCircle2 />}
                            {cv.isDefault ? "CV chính" : "CV bổ sung"}
                          </span>
                          <div className="cv-file-actions">
                            {cv.isOnline ? (
                              <Link className="cv-file-primary" to={`/my-cvs/${cv.id}/edit`}>
                                <Pencil />
                                Chỉnh sửa CV online
                              </Link>
                            ) : (
                              <button
                                className="cv-file-primary"
                                type="button"
                                onClick={() =>
                                  downloadCv(cv).catch((failure) => setError(failure.message))
                                }
                              >
                                <Download />
                                Tải xuống
                              </button>
                            )}
                            <button
                              className="cv-file-secondary"
                              type="button"
                              disabled={busy}
                              onClick={async () => {
                                setBusy(true);
                                setError("");
                                try {
                                  const cvs = await profileApi.setDefault(cv.id, !cv.isDefault);
                                  setData((current) => ({ ...current, cvs }));
                                  notify("Đã cập nhật loại CV.");
                                } catch (failure) {
                                  setError(failure.message);
                                } finally {
                                  setBusy(false);
                                }
                              }}
                            >
                              {cv.isDefault ? "Đặt làm CV bổ sung" : "Đặt làm CV chính"}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    <p className="cv-hint">
                      {preview
                        ? `ATS: ${demo?.ats ?? "—"}/100`
                        : "PDF tối đa 5 MB • Chỉ bạn có quyền tải CV"}
                    </p>
                    {preview ? (
                      <button className="wide-button" onClick={() => edit("personal")}>
                        <Upload />
                        Tải lên mẫu CV khác
                      </button>
                    ) : (
                      <label className="wide-button upload-label">
                        <Upload />
                        {busy ? "Đang xử lý…" : "Tải lên CV PDF"}
                        <FormInput
                          disabled={busy}
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={upload}
                        />
                      </label>
                    )}
                  </section>
                  <section className="profile-card">
                    <div className="section-heading">
                      <h2>
                        <SlidersHorizontal className="orange-text" />
                        Tiêu chí tìm việc
                      </h2>
                      <button className="orange-text" onClick={() => edit("preferences")}>
                        Chỉnh sửa
                      </button>
                    </div>
                    <dl className="preference-list">
                      {[
                        [
                          "Mức lương mong muốn",
                          profile.expectedSalaryMin || profile.expectedSalaryMax
                            ? `${(profile.expectedSalaryMin || 0) / 1000000} – ${(profile.expectedSalaryMax || 0) / 1000000} triệu (Gross)`
                            : "Chưa cập nhật",
                        ],
                        ["Cấp bậc mong muốn", profile.desiredPosition],
                        ["Hình thức làm việc", profile.workType],
                        ["Địa điểm ưu tiên", profile.desiredLocation],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value || "Chưa cập nhật"}</dd>
                        </div>
                      ))}
                    </dl>
                    <button className="wide-button" onClick={() => edit("preferences")}>
                      Cập nhật tiêu chí
                    </button>
                  </section>
                  <section className="profile-card">
                    <div className="section-heading">
                      <h2>
                        <Eye className="orange-text" />
                        Lượt xem & Lời mời
                      </h2>
                      <span className="muted">7 ngày qua</span>
                    </div>
                    <div className="profile-stats">
                      <div>
                        <span>Lượt xem hồ sơ</span>
                        <strong>
                          {preview ? (demo?.views ?? "—") : (data?.activity?.views ?? 0)}
                        </strong>
                      </div>
                      <div>
                        <span>Mời phỏng vấn</span>
                        <strong>
                          {preview
                            ? (demo?.invitations ?? "—")
                            : (data?.activity?.invitations ?? 0)}
                        </strong>
                      </div>
                    </div>
                    <p className="visitors-heading">DOANH NGHIỆP ĐÃ XEM GẦN ĐÂY</p>
                    {preview ? (
                      (demo?.visitors || []).map(({ name, initials }) => (
                        <div className="profile-visitor" key={name}>
                          <span>{initials}</span>
                          <strong>
                            {name}
                            <small>Hoạt động gần đây</small>
                          </strong>
                        </div>
                      ))
                    ) : data?.activity?.visitors?.length ? (
                      data.activity.visitors.map((visitor) => (
                        <Link
                          className="profile-visitor"
                          key={visitor.companyId}
                          to={`/companies/${visitor.companyId}`}
                        >
                          <span>
                            {visitor.name
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((word) => word[0])
                              .join("")}
                          </span>
                          <strong>
                            {visitor.name}
                            <small>Đã xem ngày {formatDate(visitor.viewedAt)}</small>
                          </strong>
                        </Link>
                      ))
                    ) : (
                      <p className="muted">Chưa có doanh nghiệp xem hồ sơ trong 7 ngày qua.</p>
                    )}
                  </section>
                </aside>
              </div>
            </>
          )
        )}
        <CareerResources />
      </main>
      <AuthFooter />
      <Dialog
        open={!!editor}
        onOpenChange={(open) => {
          if (!open && !busy) setEditor(null);
        }}
      >
        <DialogContent className="profile-dialog">
          <DialogTitle>
            {editor?.index === null ? "Cập nhật hồ sơ" : "Chỉnh sửa thông tin"}
          </DialogTitle>
          <DialogDescription>
            Bổ sung thông tin để nhà tuyển dụng hiểu rõ hơn về bạn.
          </DialogDescription>
          {editor && (
            <form onSubmit={submit}>
              {fields
                .filter(([key]) => editor.section !== "skills" || key === "title")
                .map(([key, label, type]) => (
                  <label key={key}>
                    {label}
                    {editor.section === "preferences" && key === "workType" ? (
                      <Select
                        required
                        disabled={busy}
                        value={
                          workTypes.includes(editor.values.workType) ? editor.values.workType : ""
                        }
                        onChange={(e) =>
                          setEditor({
                            ...editor,
                            values: {
                              ...editor.values,
                              workType: e.target.value,
                            },
                          })
                        }
                      >
                        <option value="" disabled>
                          Chọn hình thức làm việc
                        </option>
                        {workTypes.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </Select>
                    ) : (editor.section === "preferences" && key === "desiredLocation") ||
                      (editor.section === "personal" && key === "location") ? (
                      <>
                        <Select
                          required
                          disabled={busy || !provinces || !!provinceError}
                          value={
                            provinces?.find(
                              (province) =>
                                province.id ===
                                  editor.values[
                                    key === "location" ? "provinceId" : "desiredProvinceId"
                                  ] ||
                                (!editor.values[
                                  key === "location" ? "provinceId" : "desiredProvinceId"
                                ] &&
                                  normalizeProvince(province.name) ===
                                    normalizeProvince(editor.values[key])),
                            )?.id || ""
                          }
                          onChange={(e) =>
                            setEditor({
                              ...editor,
                              values: {
                                ...editor.values,
                                [key === "location" ? "provinceId" : "desiredProvinceId"]:
                                  e.target.value,
                                [key]:
                                  provinces.find((province) => province.id === e.target.value)
                                    ?.name || "",
                              },
                            })
                          }
                        >
                          <option value="" disabled>
                            {provinces ? "Chọn tỉnh/thành phố" : "Đang tải tỉnh/thành phố…"}
                          </option>
                          {provinces?.map((province) => (
                            <option key={province.id} value={province.id}>
                              {province.name}
                            </option>
                          ))}
                        </Select>
                        {provinceError && (
                          <span role="alert">
                            {provinceError}
                            <button
                              type="button"
                              onClick={() => setProvinceAttempt((value) => value + 1)}
                            >
                              Tải lại địa điểm
                            </button>
                          </span>
                        )}
                      </>
                    ) : editor.section === "personal" && key === "gender" ? (
                      <Select
                        required
                        disabled={busy}
                        value={
                          ["Nam", "Nữ", "Khác"].includes(editor.values.gender)
                            ? editor.values.gender
                            : ""
                        }
                        onChange={(e) =>
                          setEditor({
                            ...editor,
                            values: {
                              ...editor.values,
                              gender: e.target.value,
                            },
                          })
                        }
                      >
                        <option value="" disabled>
                          Chọn giới tính
                        </option>
                        {["Nam", "Nữ", "Khác"].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </Select>
                    ) : type === "textarea" ? (
                      <textarea
                        rows={6}
                        maxLength={10000}
                        value={editor.values[key] || ""}
                        onChange={(e) =>
                          setEditor({
                            ...editor,
                            values: { ...editor.values, [key]: e.target.value },
                          })
                        }
                      />
                    ) : (
                      <FormInput
                        type={type}
                        required={key === "title" || key === "fullName"}
                        maxLength={key === "tags" ? 1000 : 200}
                        min={type === "number" ? 0 : undefined}
                        max={
                          type === "number"
                            ? 1000000000
                            : type === "date"
                              ? new Date().toISOString().slice(0, 10)
                              : undefined
                        }
                        value={editor.values[key] ?? ""}
                        onChange={(e) =>
                          setEditor({
                            ...editor,
                            values: {
                              ...editor.values,
                              [key]:
                                type === "number"
                                  ? e.target.value === ""
                                    ? null
                                    : Number(e.target.value)
                                  : e.target.value,
                            },
                          })
                        }
                      />
                    )}
                  </label>
                ))}
              {error && (
                <p role="alert" className="profile-error">
                  {error}
                </p>
              )}
              <div className="editor-actions">
                {editor.index !== null &&
                  !["personal", "preferences", "summary"].includes(editor.section) && (
                    <button
                      className="delete-button"
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          await persist({
                            ...profile,
                            [editor.section]: profile[editor.section].filter(
                              (_, i) => i !== editor.index,
                            ),
                          })
                        )
                          setEditor(null);
                      }}
                    >
                      <Trash2 />
                      Xóa mục
                    </button>
                  )}
                <button type="button" disabled={busy} onClick={() => setEditor(null)}>
                  Hủy
                </button>
                <button
                  className="primary"
                  disabled={busy || (editingCatalog && (!provinces || !!provinceError))}
                >
                  {busy ? "Đang lưu…" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
