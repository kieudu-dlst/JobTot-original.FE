import { formatDate } from "@/shared/lib/date-format";
import { mediaUrl } from "@/shared/lib/media-url";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageSquare,
  Monitor,
  SlidersHorizontal,
} from "lucide-react";
import { formatJobSalary } from "@/entities/job";
import "./applied-job-card.css";

import { applicationSteps as steps } from "@/shared/lib/application-status";
function httpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function AppliedJobCard({ job, application, loadedAt }) {
  const progress = application?.progress || { currentStep: 1, label: "Mới ứng tuyển" };
  const currentStep = Math.max(1, Math.min(5, progress.currentStep));
  const hiring = !job.isClosed && new Date(job.expiresAt).getTime() > loadedAt;
  const logoUrl =
    job.companyLogoUrl?.startsWith("/") && !job.companyLogoUrl.startsWith("//")
      ? job.companyLogoUrl
      : httpUrl(job.companyLogoUrl);
  return (
    <article className="mj-applied-card">
      <div className="mj-applied-heading">
        <Link
          className="mj-applied-logo"
          to={`/companies/${job.companyId}`}
          aria-label={`Trang công ty ${job.companyName}`}
        >
          {logoUrl ? <img src={mediaUrl(logoUrl)} alt="" /> : <Building2 />}
        </Link>
        <div className="mj-applied-identity">
          <div className="mj-applied-title">
            <h2>
              <Link to={application.detailUrl || `/jobs/${job.id}`}>{job.title}</Link>
            </h2>
            <span className={`mj-applied-status${progress.stopped ? " is-stopped" : ""}`}>
              <CheckCircle2 />
              {progress.label}
            </span>
          </div>
          <Link className="mj-applied-company" to={`/companies/${job.companyId}`}>
            {job.companyName}
          </Link>
          <p className="mj-applied-meta">
            <strong>{formatJobSalary(job)}</strong>
            <span>•</span>
            <span>
              <MapPin />
              {job.location}
            </span>
          </p>
          <p className="mj-applied-date">
            <Clock3 />
            Nộp ngày{" "}
            <time dateTime={application.appliedAt}>
              {formatDate(application.appliedAt, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </time>
          </p>
        </div>
        <span className={`mj-applied-hiring${hiring ? "" : " is-closed"}`}>
          <Building2 />
          {hiring ? "Đang diễn ra tin tuyển dụng" : "Đã ngừng tuyển"}
        </span>
      </div>
      <section
        className={`mj-application-progress${progress.stopped ? " is-stopped" : ""}`}
        aria-label={`Tiến trình ứng tuyển ${job.title}`}
      >
        <div className="mj-application-progress-heading">
          <h3>
            <SlidersHorizontal />
            Tiến trình tuyển dụng
          </h3>
          <span>{progress.label}</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={currentStep}
          aria-label="Tiến trình tuyển dụng"
          aria-valuetext={progress.label}
          className="mj-application-progress-track"
        >
          {steps.map((label, index) => (
            <div
              key={label}
              className={
                !progress.stopped && (progress.completed ? index < 4 : index + 1 < currentStep)
                  ? "is-done"
                  : !progress.completed && index + 1 === currentStep
                    ? "is-current"
                    : ""
              }
            >
              <i />
              <span>
                {index + 1}. {label}
              </span>
            </div>
          ))}
        </div>
      </section>
      <div className="mj-applied-actions">
        {application.recruiterEmail ? (
          <a href={`/messages?hr=${encodeURIComponent(application.recruiterEmail)}`}>
            <MessageSquare />
            Nhắn tin với HR
          </a>
        ) : (
          <Link to={application.detailUrl || `/jobs/${job.id}`}>
            <MessageSquare />
            Xem chi tiết công việc
          </Link>
        )}
      </div>
    </article>
  );
}

export function UpcomingInterviewCard({ interview, loading, error }) {
  const meetingUrl = httpUrl(interview?.meetingUrl);
  return (
    <section className="mj-upcoming-interview-card">
      <h2>
        <span>●</span>Lịch phỏng vấn sắp tới{interview && <small>Gần nhất</small>}
      </h2>
      {error ? (
        <p className="mj-side-empty">Không thể tải lịch phỏng vấn.</p>
      ) : loading ? (
        <p className="mj-side-empty" role="status">
          Đang tải lịch phỏng vấn…
        </p>
      ) : interview ? (
        <div className="mj-upcoming-interview-detail">
          <p className="mj-upcoming-interview-time">
            <CalendarDays />
            {formatDate(interview.start, {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
            {" · "}
            {new Date(interview.start).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <h3>
            <Link to={`/companies/${interview.companyId}`}>{interview.companyName}</Link>
          </h3>
          <p>Vị trí: {interview.jobTitle}</p>
          {meetingUrl ? (
            <a
              className="mj-upcoming-interview-mode"
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Monitor />
              Tham gia phỏng vấn trực tuyến
            </a>
          ) : (
            <p className="mj-upcoming-interview-mode">
              <MapPin />
              {interview.location || "Chưa cập nhật địa điểm"}
            </p>
          )}
          <Link className="mj-upcoming-interview-schedule" to="/my-jobs?tab=interviews">
            Xem lịch phỏng vấn
          </Link>
        </div>
      ) : (
        <p className="mj-side-empty">Chưa có lịch phỏng vấn sắp tới.</p>
      )}
    </section>
  );
}
