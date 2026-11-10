import { mediaUrl } from "@/shared/lib/media-url";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Banknote, Clock3, MapPin } from "lucide-react";
import { formatJobSalary, postedAgo } from "../model/format";
import "./job-listing-card.css";
const experienceLabels = {
  none: "Không cần kinh nghiệm",
  "under-1": "Dưới 1 năm kinh nghiệm",
  "1-3": "1 – 3 năm kinh nghiệm",
  "3-5": "3 – 5 năm kinh nghiệm",
  "over-5": "Trên 5 năm kinh nghiệm",
};
const employmentLabels = {
  "full-time": "Toàn thời gian",
  "part-time": "Bán thời gian",
  internship: "Thực tập",
  remote: "Remote / Từ xa",
  flexible: "Hybrid linh hoạt",
};

export function JobListingCard({ job, action, now }) {
  const [failedLogo, setFailedLogo] = useState(false);
  const [nowAtMount] = useState(() => Date.now());
  const closed = job.isClosed || (job.expiresAt && new Date(job.expiresAt).getTime() <= nowAtMount);
  const tags = [
    ...new Set(
      [
        ...(job.benefits
          ?.split("|")
          .map((value) => value.trim())
          .filter(Boolean) || []),
        experienceLabels[job.experienceLevel],
        employmentLabels[job.employmentType],
      ].filter(Boolean),
    ),
  ];
  return (
    <article className="job-listing-card">
      <div className="job-listing-top">
        <Link
          className="job-listing-logo"
          to={`/companies/${encodeURIComponent(job.companyId)}`}
          aria-label={`Xem ${job.companyName || "doanh nghiệp"}`}
        >
          {job.companyLogoUrl && !failedLogo ? (
            <img
              src={mediaUrl(job.companyLogoUrl)}
              alt=""
              loading="lazy"
              onError={() => setFailedLogo(true)}
            />
          ) : (
            <span>
              {(job.companyName || "DN")
                .split(/\s+/)
                .slice(0, 2)
                .map((word) => word[0])
                .join("")}
            </span>
          )}
        </Link>
        <div className="job-listing-info">
          <h2>
            <Link to={`/jobs/${job.id}`}>{job.title}</Link>
          </h2>
          <Link
            className="job-listing-company"
            to={`/companies/${encodeURIComponent(job.companyId)}`}
          >
            {job.isVerified && <BadgeCheck />}
            {job.companyName || "Xem thông tin doanh nghiệp"}
          </Link>
          <div className="job-listing-facts">
            <strong>
              <Banknote />
              {formatJobSalary(job)}
            </strong>
            <span>
              <MapPin />
              {job.location}
            </span>
            {job.workSchedule && (
              <span>
                <Clock3 />
                {job.workSchedule}
              </span>
            )}
          </div>
          {tags.length > 0 && (
            <div className="job-listing-tags">
              {tags.slice(0, 4).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="job-listing-bottom">
        <span>
          <Clock3 />
          {postedAgo(job.createdAt, now)}
        </span>
        <div>
          {action}
          <Link
            className={closed ? "company-text-button" : "company-primary"}
            to={`/jobs/${job.id}${closed ? "" : "#job-application"}`}
          >
            {closed ? "Đã ngừng tuyển · Xem chi tiết" : "Ứng tuyển ngay"}{" "}
            <span aria-hidden="true">›</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
