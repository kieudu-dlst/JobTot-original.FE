import { formatDateTime } from "@/shared/lib/date-format";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Send, ShieldCheck, Upload, CheckCircle2 } from "lucide-react";
import { useToast } from "@/shared/ui/toast-context";
import { applicationsApi } from "../api/applications";

export function ApplicationForm({ job, closed, account, loading }) {
  return (
    <section id="job-application" className="jd-panel jd-application">
      <h2>
        <Send />
        Ứng tuyển nhanh – 1 chạm
      </h2>
      <p>Gửi hồ sơ ứng tuyển tới {job.companyName}.</p>
      {closed ? (
        <p role="status">Việc làm đã ngừng nhận hồ sơ.</p>
      ) : loading ? (
        <p role="status">Đang kiểm tra đăng nhập…</p>
      ) : !account ? (
        <div className="jd-login">
          <p>Đăng nhập để chọn CV và gửi hồ sơ ứng tuyển.</p>
          <Link
            className="jd-primary"
            to={`/login?returnTo=${encodeURIComponent(`/jobs/${job.id}#job-application`)}`}
          >
            Đăng nhập để ứng tuyển
          </Link>
        </div>
      ) : (
        <CandidateApplication key={`${job.id}:${account.id}`} job={job} />
      )}
    </section>
  );
}
function CandidateApplication({ job }) {
  const notify = useToast();
  const [profile, setProfile] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [cvId, setCvId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      Promise.all([
        applicationsApi.profile(controller.signal),
        applicationsApi.status(job.id, controller.signal),
      ])
        .then(([data, status]) => {
          if (!controller.signal.aborted) {
            setProfile(data);
            setSubmission(status);
            setCvId((data.cvs.find((cv) => cv.isDefault) || data.cvs[0])?.id || "");
            setError("");
          }
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setError(failure.message);
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [job.id, attempt]);
  async function upload(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") || file.size > 5 * 1024 * 1024) {
      notify("Vui lòng chọn PDF tối đa 5 MB.", { type: "error" });
      return;
    }
    setBusy(true);
    setError("");
    try {
      const cv = await applicationsApi.upload(file);
      setProfile((current) => ({
        ...current,
        cvs: [
          { ...cv, isDefault: true },
          ...current.cvs.map((item) => ({ ...item, isDefault: false })),
        ],
      }));
      setCvId(cv.id);
      notify("Đã tải CV lên hồ sơ của bạn.");
    } catch (failure) {
      setError(failure.message);
      notify(failure.message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      fullName: form.get("fullName"),
      phone: form.get("phone"),
      coverLetter: form.get("coverLetter"),
    };
    setBusy(true);
    setError("");
    try {
      const result = await applicationsApi.submit(job.id, { ...values, cvId });
      setSubmission(result);
      notify(`Đã gửi hồ sơ ứng tuyển ${job.title}.`);
    } catch (failure) {
      setError(failure.message);
      notify(failure.message, { type: "error" });
      if (failure.status === 409) setAttempt((value) => value + 1);
    } finally {
      setBusy(false);
    }
  }
  if (submission)
    return (
      <div className="jd-submitted" role="status">
        <CheckCircle2 />
        <div>
          <strong>Đã gửi hồ sơ ứng tuyển</strong>
          <p>
            {submission.cvTitle} · {formatDateTime(submission.appliedAt)}
          </p>
          <span>Hồ sơ của bạn đã được lưu. Nhà tuyển dụng sẽ liên hệ khi phù hợp.</span>
        </div>
      </div>
    );
  if (!profile)
    return error ? (
      <div role="alert">
        {error}
        <button onClick={() => setAttempt((value) => value + 1)}>Thử lại</button>
      </div>
    ) : (
      <p role="status">Đang tải hồ sơ và CV…</p>
    );
  return (
    <form onSubmit={submit} aria-label="Hồ sơ ứng tuyển">
      <h3>CHỌN CV NỘP HỒ SƠ</h3>
      <div className="jd-cv-options">
        {profile.cvs.map((cv) => (
          <label className={cvId === cv.id ? "is-selected" : ""} key={cv.id}>
            <input
              type="radio"
              name="selectedCv"
              checked={cvId === cv.id}
              onChange={() => setCvId(cv.id)}
              disabled={busy}
            />
            <span>
              <strong>{cv.title}</strong>
              <small>{cv.isDefault ? "CV mặc định của bạn" : "CV đã lưu trong hồ sơ"}</small>
            </span>
            <FileText />
          </label>
        ))}
        <label className="jd-upload">
          <Upload />
          <span>
            <strong>Tải lên CV mới</strong>
            <small>Định dạng PDF, tối đa 5 MB</small>
          </span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={upload}
            disabled={busy}
            aria-label="Tải lên CV mới"
          />
        </label>
      </div>
      {!profile.cvs.length && <p>Hãy tải lên CV để hoàn tất hồ sơ ứng tuyển.</p>}
      <div className="jd-form-row">
        <label>
          Họ và tên ứng viên
          <input
            name="fullName"
            defaultValue={profile.profile.fullName}
            required
            maxLength={200}
            disabled={busy}
            autoComplete="name"
          />
        </label>
        <label>
          Số điện thoại liên lạc
          <input
            name="phone"
            type="tel"
            defaultValue={profile.phone || ""}
            required
            pattern="\+?[0-9 ()\-]{8,30}"
            maxLength={30}
            disabled={busy}
            autoComplete="tel"
          />
        </label>
      </div>
      <label>
        Thư giới thiệu ngắn <small>(Tùy chọn)</small>
        <textarea
          name="coverLetter"
          maxLength={4000}
          rows={4}
          placeholder="Chia sẻ kinh nghiệm và lý do bạn phù hợp với vị trí này…"
          disabled={busy}
        />
      </label>
      {error && (
        <p role="alert" className="jd-error">
          {error}
        </p>
      )}
      <div className="jd-form-bottom">
        <button className="jd-primary" disabled={busy || !cvId}>
          <Send />
          {busy ? "Đang xử lý…" : "Nộp hồ sơ ứng tuyển ngay"}
        </button>
        <span>
          <ShieldCheck />
          Hồ sơ chỉ gửi tới nhà tuyển dụng của vị trí này
        </span>
      </div>
    </form>
  );
}
