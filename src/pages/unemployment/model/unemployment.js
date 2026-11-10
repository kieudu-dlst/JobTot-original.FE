import { regions } from "../../../shared/lib/salary/salary.js";

export { regions };
export function benefitDuration(months) {
  return months < 12 ? 0 : Math.min(12, 3 + Math.floor(Math.max(0, months - 36) / 12));
}

export function calculateUnemployment(input) {
  const {
    averageSalary,
    region,
    totalMonths,
    recentMonths,
    shortContract,
    lawfulTermination,
    filedInTime,
    waitingCondition,
  } = input;
  if (!Number.isSafeInteger(averageSalary) || averageSalary <= 0 || averageSalary > 1000000000)
    throw new Error("Lương bình quân phải là số nguyên từ 1 đến 1.000.000.000 VND.");
  if (!Number.isInteger(region) || region < 0 || region > 3)
    throw new Error("Vui lòng chọn vùng đóng BHTN hợp lệ.");
  if (!Number.isInteger(totalMonths) || totalMonths < 0 || totalMonths > 720)
    throw new Error("Thời gian đóng chưa hưởng phải là số nguyên từ 0 đến 720 tháng.");
  const windowMonths = shortContract ? 36 : 24;
  if (
    !Number.isInteger(recentMonths) ||
    recentMonths < 0 ||
    recentMonths > Math.min(windowMonths, totalMonths)
  )
    throw new Error(
      `Số tháng đóng gần đây phải từ 0 đến ${Math.min(windowMonths, totalMonths)} tháng, không vượt thời gian đóng chưa hưởng.`,
    );
  if (
    [shortContract, lawfulTermination, filedInTime, waitingCondition].some(
      (value) => typeof value !== "boolean",
    )
  )
    throw new Error("Vui lòng xác nhận các điều kiện hưởng.");
  const reasons = [];
  if (!lawfulTermination)
    reasons.push("Chưa xác nhận chấm dứt hợp đồng hợp pháp và chưa đủ điều kiện hưởng lương hưu.");
  if (recentMonths < 12)
    reasons.push(`Chưa đóng đủ 12 tháng BHTN trong ${windowMonths} tháng trước khi nghỉ việc.`);
  if (!filedInTime)
    reasons.push("Chưa xác nhận nộp đủ hồ sơ trong 3 tháng từ ngày chấm dứt hợp đồng.");
  if (!waitingCondition)
    reasons.push("Chưa xác nhận điều kiện trong 10 ngày làm việc kể từ khi nộp đủ hồ sơ.");
  const eligible = reasons.length === 0;
  const cap = 5 * regions[region];
  const uncappedMonthly = Math.round(averageSalary * 0.6);
  const projectedMonthly = Math.min(uncappedMonthly, cap);
  const projectedDuration = benefitDuration(totalMonths);
  const monthly = eligible ? projectedMonthly : 0;
  const duration = eligible ? projectedDuration : 0;
  return {
    input: { ...input },
    windowMonths,
    eligible,
    reasons,
    cap,
    uncappedMonthly,
    projectedMonthly,
    projectedDuration,
    monthly,
    duration,
    total: monthly * duration,
    capped: uncappedMonthly > cap,
  };
}
