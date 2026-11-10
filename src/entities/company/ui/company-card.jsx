import { mediaUrl } from "@/shared/lib/media-url";
import {
  Building2,
  MapPin,
  Users,
  BadgeCheck,
  Heart,
  ArrowRight,
  BriefcaseBusiness,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const employeeSize = (company) =>
  company.sizeMin || company.sizeMax
    ? `${(company.sizeMin || company.sizeMax).toLocaleString("vi-VN")}${company.sizeMax && company.sizeMax !== company.sizeMin ? ` – ${company.sizeMax.toLocaleString("vi-VN")}` : company.sizeMax ? "" : "+"} nhân viên`
    : "Chưa cập nhật quy mô";

export function CompanyLogo({ company }) {
  const [failedUrl, setFailedUrl] = useState(null);
  return (
    <div className="company-logo">
      {company.logoUrl && failedUrl !== company.logoUrl ? (
        <img
          src={mediaUrl(company.logoUrl)}
          alt={`Logo ${company.name}`}
          loading="lazy"
          onError={() => setFailedUrl(company.logoUrl)}
        />
      ) : (
        <span>
          {company.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 3)
            .map((word) => word[0])
            .join("")
            .toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function CompanyCard({ company, featured = false, followed, pending, onFollow, onJobs }) {
  const hiringTitles = Array.isArray(company.hiringTitles) ? company.hiringTitles : [];
  const openJobCount = Number.isFinite(company.openJobCount) ? company.openJobCount : null;
  return (
    <article className={`company-card ${featured ? "company-card-featured" : ""}`}>
      {featured && (
        <div className="company-cover">
          {company.coverUrl ? (
            <img src={mediaUrl(company.coverUrl)} alt="" loading="lazy" />
          ) : (
            <div className="company-cover-fallback">
              <Building2 />
              <span>Khám phá môi trường làm việc</span>
            </div>
          )}
          <span className="company-cover-badge">
            <BadgeCheck />
            Doanh nghiệp xác thực
          </span>
        </div>
      )}
      <div className="company-card-body">
        <CompanyLogo company={company} />
        <div className="company-card-content">
          <div className="company-badges">
            {company.isVerified && (
              <span>
                <BadgeCheck />
                Đã xác thực doanh nghiệp
              </span>
            )}
            {company.industry && <span className="company-industry">{company.industry}</span>}
          </div>
          <h3>
            <Link to={`/companies/${encodeURIComponent(company.id)}`}>{company.name}</Link>
          </h3>
          <p className="company-location">
            <MapPin />
            {[company.address, company.province].filter(Boolean).join(", ") ||
              "Chưa cập nhật địa điểm"}
          </p>
          {featured && (
            <p className="company-size">
              <Users />
              {employeeSize(company)}
            </p>
          )}
          <p className="company-jobs-count">
            <BriefcaseBusiness />
            {openJobCount === null
              ? "Chưa cập nhật số việc làm"
              : `${openJobCount} việc làm đang mở`}
          </p>
          <div className="company-tags">
            {hiringTitles.length > 0 ? (
              <>
                <span className="company-tags-label">Đang tuyển:</span>
                {hiringTitles.map((title) => (
                  <span key={title}>{title}</span>
                ))}
              </>
            ) : (
              <span className="company-tags-label">
                {company.industry || "Khám phá doanh nghiệp"}
              </span>
            )}
          </div>
        </div>
        <div className="company-card-actions">
          <button
            type="button"
            className={`company-follow ${followed ? "is-followed" : ""}`}
            aria-label={`${followed ? "Bỏ theo dõi" : "Theo dõi"} ${company.name}`}
            aria-pressed={followed}
            disabled={pending}
            onClick={() => onFollow(company)}
          >
            <Heart fill={followed ? "currentColor" : "none"} />
          </button>
          <button type="button" className="company-primary" onClick={() => onJobs(company)}>
            {openJobCount === null ? "Xem việc làm" : `Xem ${openJobCount} việc làm`}
            <ArrowRight />
          </button>
        </div>
      </div>
    </article>
  );
}
