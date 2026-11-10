import { CalendarDays, MapPin, BriefcaseBusiness } from "lucide-react";
import { useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { mediaUrl } from "@/shared/lib/media-url";
import { applicationStatuses } from "@/shared/lib/application-status";
import "@/shared/ui/candidate-detail.css";

export function ApplicantDetail({ item, close, open }) {
  const trigger = useRef(document.activeElement);
  const profile = item.profile;
  return (
    <Dialog
      open
      onOpenChange={(value) => {
        if (!value) close();
      }}
    >
      <DialogContent
        className="td-detail er-applicant-detail font-roboto"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus();
        }}
      >
        <div className="td-detail-hero">
          {profile.avatarUrl ? (
            <img className="er-avatar" src={mediaUrl(profile.avatarUrl)} alt="" />
          ) : (
            <span className="er-avatar er-avatar-fallback">{profile.name?.[0]}</span>
          )}
          <div>
            <DialogTitle>{profile.name}</DialogTitle>
            <DialogDescription>{profile.headline || "Hồ sơ ứng viên"}</DialogDescription>
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
          </div>
        </div>
        <div className="td-detail-toolbar">
          {item.applicationStatus && (
            <span className="er-status">
              {applicationStatuses[item.applicationStatus] || item.applicationStatus}
            </span>
          )}
          {item.campaignId && (
            <button className="er-outline" onClick={() => open({ type: "schedule", item })}>
              <CalendarDays />
              Lên lịch phỏng vấn
            </button>
          )}
        </div>
        <div className="td-detail-body">
          <section>
            <h3>Thông tin ứng tuyển</h3>
            <dl className="td-preferences">
              {[
                ["Chiến dịch", item.campaign],
                ["Vòng hiện tại", item.stage],
                ["Nguồn hồ sơ", item.source],
                ["Email", profile.email],
                ["Điện thoại", profile.phone],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
          </section>
          <section>
            <h3>Giới thiệu chuyên môn</h3>
            <p className="td-long-text">{profile.summary || "Chưa cập nhật."}</p>
          </section>
          <section>
            <h3>Kỹ năng</h3>
            <div className="td-skills">
              {profile.skills?.map((skill, index) => (
                <span key={`${skill}-${index}`}>{skill}</span>
              ))}
              {!profile.skills?.length && <p>Chưa cập nhật.</p>}
            </div>
          </section>
          <section>
            <h3>Mong muốn nghề nghiệp</h3>
            <dl className="td-preferences">
              {[
                ["Vị trí", profile.desiredPosition],
                ["Địa điểm", profile.desiredLocation],
                ["Hình thức làm việc", profile.workType],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "Chưa cập nhật"}</dd>
                </div>
              ))}
            </dl>
          </section>
          {[
            ["Kinh nghiệm làm việc", "experiences"],
            ["Học vấn", "education"],
            ["Dự án", "projects"],
            ["Chứng chỉ", "certificates"],
          ].map(([title, key]) => (
            <section key={key}>
              <h3>{title}</h3>
              <div className="td-experience-list">
                {profile[key]?.length ? (
                  profile[key].map((entry, index) => (
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
                  ))
                ) : (
                  <p>Chưa cập nhật.</p>
                )}
              </div>
            </section>
          ))}
          {item.notes && (
            <section>
              <h3>Ghi chú tuyển dụng</h3>
              <p className="td-long-text">{item.notes}</p>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
