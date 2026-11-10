import { formatDate } from "@/shared/lib/date-format";
import { mediaUrl } from "@/shared/lib/media-url";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Lightbulb,
  MapPin,
  MessageSquare,
  Monitor,
  Zap,
} from "lucide-react";
import "./interview-schedule.css";

const time = (value) =>
  new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
const fullDate = (value) =>
  formatDate(value, {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
function dayKey(value) {
  const day = new Date(value);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}
function httpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function InterviewScheduleCard({ interview, pending, onConfirm }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const start = new Date(interview.start).getTime();
  const end = new Date(interview.end).getTime();
  const confirmed = ["confirmed", "accepted"].includes(interview.status);
  const confirmable =
    !interview.status || ["pending", "proposed", "invited", "scheduled"].includes(interview.status);
  const urgent = confirmed && start - now < 86400000 && end > now;
  const remaining = Math.max(0, Math.ceil((start - now) / 60000));
  const ongoing = start <= now && end > now;
  const duration = Math.max(0, Math.round((end - start) / 60000));
  const onlineUrl = httpUrl(interview.meetingUrl);
  const online = Boolean(onlineUrl);
  return (
    <article
      id={`interview-${interview.id}`}
      className={`mj-schedule-card${urgent ? " is-urgent" : ""}${confirmable ? " is-pending" : ""}`}
    >
      {urgent && (
        <div className="mj-schedule-banner">
          <strong>
            <Zap />
            {ongoing ? "PHỎNG VẤN ĐANG DIỄN RA" : "DIỄN RA TRONG 24 GIỜ TỚI"}
          </strong>
          {!ongoing && (
            <span>
              <Clock3 />
              Còn {Math.floor(remaining / 60)} giờ {remaining % 60} phút
            </span>
          )}
        </div>
      )}
      {confirmable && (
        <div className="mj-schedule-banner mj-schedule-pending-banner">
          <strong>
            <CalendarCheck2 />
            CẦN XÁC NHẬN: Lịch phỏng vấn được đề xuất
          </strong>
        </div>
      )}
      <div className="mj-schedule-body">
        <div className="mj-schedule-heading">
          <Link
            className="mj-schedule-logo"
            to={`/companies/${interview.companyId}`}
            aria-label={`Trang công ty ${interview.companyName}`}
          >
            {interview.companyLogoUrl?.startsWith("/uploads/companies/") ||
            httpUrl(mediaUrl(interview.companyLogoUrl)) ? (
              <img src={mediaUrl(interview.companyLogoUrl)} alt="" />
            ) : (
              <Building2 />
            )}
          </Link>
          <div className="mj-schedule-identity">
            <h2>{interview.jobTitle}</h2>
            <p>
              <Link to={`/companies/${interview.companyId}`}>{interview.companyName}</Link>
              {interview.companyVerified && (
                <span className="mj-schedule-verified">
                  <BadgeCheck />
                  Doanh nghiệp xác thực
                </span>
              )}
            </p>
            <p className="mj-schedule-mode">
              {online ? <Monitor /> : <MapPin />}
              <span>
                {online ? "Phỏng vấn trực tuyến" : "Phỏng vấn trực tiếp"}
                {interview.location && <> · {interview.location}</>}
              </span>
            </p>
          </div>
          <div className="mj-schedule-state">
            <span className={confirmed ? "is-confirmed" : "is-waiting"}>
              {confirmed ? <CheckCircle2 /> : <Clock3 />}
              {confirmed
                ? "Đã xác nhận tham gia"
                : confirmable
                  ? "Chờ bạn xác nhận lịch"
                  : "Đã lên lịch"}
            </span>
            {interview.stageName && (
              <small>
                {interview.stageOrder > 0 && `Vòng ${interview.stageOrder} · `}
                {interview.stageName}
              </small>
            )}
          </div>
        </div>
        {confirmable && (
          <p className="mj-schedule-prompt">VUI LÒNG XÁC NHẬN KHUNG GIỜ PHÙ HỢP VỚI BẠN:</p>
        )}
        <div className={`mj-schedule-details${confirmable ? " mj-schedule-proposal" : ""}`}>
          <div>
            <small>
              <Clock3 />
              {confirmable ? "KHUNG GIỜ ĐƯỢC ĐỀ XUẤT" : "THỜI GIAN HẸN"}
            </small>
            <strong>
              {time(interview.start)} – {time(interview.end)} ({duration} phút)
            </strong>
            <p className={urgent ? "mj-schedule-date-urgent" : ""}>{fullDate(interview.start)}</p>
            {confirmable && (
              <button
                className="mj-schedule-confirm"
                disabled={pending || end <= now}
                onClick={() => onConfirm(interview.id)}
              >
                <CalendarCheck2 />
                {pending ? "Đang xác nhận…" : "Xác nhận tham gia"}
              </button>
            )}
          </div>
          <div>
            <small>
              {online ? <Monitor /> : <MapPin />}
              {online ? "HÌNH THỨC PHỎNG VẤN" : "ĐỊA ĐIỂM PHỎNG VẤN"}
            </small>
            <strong>
              {online ? "Phỏng vấn trực tuyến" : interview.location || "Chưa cập nhật địa điểm"}
            </strong>
            {interview.recruiterName && (
              <p>
                HR phụ trách: {interview.recruiterName}
                {interview.recruiterTitle && ` (${interview.recruiterTitle})`}
              </p>
            )}
          </div>
        </div>
        {interview.preparation && (
          <div className="mj-schedule-preparation">
            <Lightbulb />
            <p>
              <strong>Chuẩn bị phỏng vấn: </strong>
              {interview.preparation}
            </p>
          </div>
        )}
        <div className="mj-schedule-actions">
          {online && (
            <a
              className="mj-schedule-join"
              href={onlineUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Monitor />
              Tham gia phỏng vấn trực tuyến
            </a>
          )}
          {interview.recruiterEmail && (
            <a
              className="mj-schedule-contact"
              href={`/messages?hr=${encodeURIComponent(interview.recruiterEmail)}`}
            >
              <MessageSquare />
              Nhắn tin với HR
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function InterviewCalendar({
  month,
  events,
  selectedDate,
  onMonth,
  onDate,
  loading,
  error,
}) {
  const [today] = useState(() => dayKey(new Date()));
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(year, monthNumber - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, monthNumber, 0).getDate();
  const cells = Math.ceil((offset + days) / 7) * 7;
  const onlineCount = events.filter((event) => event.online).length;
  function changeMonth(step) {
    const next = new Date(year, monthNumber - 1 + step, 1);
    onMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  }
  return (
    <section
      className="mj-interview-calendar"
      aria-label="Lịch tháng phỏng vấn"
      aria-busy={loading}
    >
      <div className="mj-calendar-heading">
        <h2>
          <CalendarDays />
          Tháng {String(monthNumber).padStart(2, "0")}, {year}
        </h2>
        <div>
          <button
            aria-label="Tháng trước"
            disabled={month === "2000-01"}
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft />
          </button>
          <button
            aria-label="Tháng sau"
            disabled={month === "2099-12"}
            onClick={() => changeMonth(1)}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="mj-calendar-weekdays">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mj-calendar-days">
        {Array.from({ length: cells }, (_, index) => {
          const day = new Date(year, monthNumber - 1, index - offset + 1);
          const key = dayKey(day);
          const inMonth = day.getMonth() === monthNumber - 1;
          const appointments = events.filter((event) => dayKey(event.start) === key);
          const hasOnline = appointments.some((event) => event.online);
          const hasOnsite = appointments.some((event) => !event.online);
          return (
            <button
              key={key}
              disabled={!inMonth || appointments.length === 0 || loading || Boolean(error)}
              className={`${inMonth ? "" : "is-outside "}${hasOnline ? "has-online " : ""}${hasOnsite ? "has-onsite " : ""}${today === key ? "is-today " : ""}${day.getDay() === 0 ? "is-sunday" : ""}`}
              aria-label={`${fullDate(day)}, ${appointments.length} lịch phỏng vấn`}
              aria-pressed={selectedDate === key}
              title={
                appointments
                  .map((event) => `${time(event.start)} · ${event.jobTitle}`)
                  .join("\n") || fullDate(day)
              }
              onClick={() => onDate(selectedDate === key ? null : key)}
            >
              {day.getDate()}
              {appointments.length > 0 && <i />}
            </button>
          );
        })}
      </div>
      <div className="mj-calendar-legend">
        <span>
          <i className="is-online" />
          Trực tuyến ({onlineCount})
        </span>
        <span>
          <i className="is-onsite" />
          Trực tiếp ({events.length - onlineCount})
        </span>
        <span>
          <i />
          Hôm nay
        </span>
      </div>
      {loading && (
        <p className="mj-calendar-notice" role="status">
          Đang tải lịch…
        </p>
      )}
      {error && (
        <p className="mj-calendar-notice" role="alert">
          Không thể tải lịch tháng. Vui lòng thử lại.
        </p>
      )}
      {selectedDate && (
        <button className="mj-calendar-clear" onClick={() => onDate(null)}>
          Xem tất cả lịch phỏng vấn
        </button>
      )}
    </section>
  );
}
