import { SectionTabs } from "@/shared/ui/section-tabs";
import { UsersRound, Bookmark, FileText, CalendarDays } from "lucide-react";

const tabs = [
  ["discover", "/employer/discover", "Tìm nhân tài"],
  ["talents", "/employer/talents", "Danh sách tài năng"],
  ["applications", "/employer/candidates", "Quản lý ứng viên"],
  ["interviews", "/employer/interviews", "Lịch phỏng vấn & Đánh giá ứng viên"],
];

export function RecruitmentTabs({ active }) {
  const icons = [UsersRound, Bookmark, FileText, CalendarDays];
  return (
    <SectionTabs
      className="er-tabs"
      label="Quản lý tuyển dụng"
      active={active}
      items={tabs.map(([value, to, label], index) => ({ value, to, label, icon: icons[index] }))}
    />
  );
}
