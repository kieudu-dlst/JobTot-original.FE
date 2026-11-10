export function formatJobSalary(job) {
  if (job.salaryMin == null && job.salaryMax == null) return "Lương thỏa thuận";
  const monthly = (job.salaryPeriod || "monthly") === "monthly";
  const unit = monthly ? " triệu/tháng" : job.salaryPeriod === "hourly" ? " đ/giờ" : " đ/ngày";
  const format = (value) => Number(monthly ? value / 1000000 : value).toLocaleString("vi-VN");
  const salary =
    job.salaryMin != null && job.salaryMax != null
      ? `${format(job.salaryMin)} – ${format(job.salaryMax)}`
      : job.salaryMin != null
        ? `Từ ${format(job.salaryMin)}`
        : `Đến ${format(job.salaryMax)}`;
  return `${salary}${unit}${job.salaryNote ? ` + ${job.salaryNote}` : ""}`;
}
export function postedAgo(createdAt, now) {
  const elapsed = Math.max(0, now - new Date(createdAt).getTime());
  if (!Number.isFinite(elapsed)) return "Đang tuyển";
  if (elapsed < 3600000) return "Mới đăng";
  if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)} giờ trước`;
  return `${Math.floor(elapsed / 86400000)} ngày trước`;
}
