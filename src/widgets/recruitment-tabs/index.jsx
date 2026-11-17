import { SectionTabs } from "@/shared/ui/section-tabs";
import { matchPath, useLocation, useSearchParams } from "react-router-dom";
import { UsersRound, Heart, Bookmark, FileText, CalendarDays } from "lucide-react";

const tabs = [
  ["applications", "/employer/candidates", "Hồ sơ ứng tuyển", FileText],
  ["interviews", "/employer/interviews", "Lịch phỏng vấn & đánh giá", CalendarDays],
];

export function RecruitmentTabs() {
  const { pathname } = useLocation();
  return (
    <SectionTabs
      className="er-tabs"
      label="Quản lý CV"
      active={matchPath("/employer/interviews", pathname) ? "interviews" : "applications"}
      items={tabs.map(([value, to, label, icon]) => ({ value, to, label, icon }))}
    />
  );
}

const collections = [
  ["all", "Khám phá hồ sơ", UsersRound],
  ["interested", "Đang quan tâm", Heart],
  ["saved", "Đã lưu tài năng", Bookmark],
];

export function TalentDiscoveryTabs({ stats }) {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const isPool = Boolean(matchPath("/employer/talents", pathname));
  const collection = isPool ? "saved" : params.get("collection");
  const active = ["interested", "saved"].includes(collection) ? collection : "all";
  return (
    <SectionTabs
      className="td-collections"
      label="Tìm nhân tài"
      active={active}
      items={collections.map(([value, label, icon]) => {
        const next = new URLSearchParams(isPool ? "" : params);
        next.delete("page");
        if (value === "all") next.delete("collection");
        else next.set("collection", value);
        return {
          value,
          label,
          icon,
          to: `/employer/discover${next.size ? `?${next}` : ""}`,
          count: stats ? stats[value === "all" ? "discoverable" : value] : undefined,
        };
      })}
    />
  );
}
