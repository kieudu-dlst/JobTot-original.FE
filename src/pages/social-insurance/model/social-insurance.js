// Công văn 340/BHXH-CSXH ngày 03/02/2026, tiền lương do doanh nghiệp quyết định.
export const coefficients = Object.fromEntries(
  [
    4.91, 4.65, 4.5, 4.18, 4.01, 4.07, 4.09, 3.94, 3.81, 3.54, 3.27, 3.05, 2.81, 2.29, 2.14, 1.96,
    1.65, 1.51, 1.42, 1.36, 1.36, 1.32, 1.28, 1.23, 1.2, 1.16, 1.14, 1.11, 1.07, 1.03, 1, 1,
  ].map((value, index) => [1995 + index, value]),
);
export function coefficientFor(year) {
  if (!Number.isInteger(year) || year < 1990 || year > 2026)
    throw new Error("Năm đóng phải từ 1990 đến 2026.");
  return year < 1995 ? 5.81 : coefficients[year];
}
export function monthIndex(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw new Error("Vui lòng nhập tháng hợp lệ.");
  const [year, month] = value.split("-").map(Number);
  return year * 12 + month - 1;
}
export function roundedYears(months) {
  const remainder = months % 12;
  return Math.floor(months / 12) + (remainder === 0 ? 0 : remainder <= 6 ? 0.5 : 1);
}
export function calculateSocialInsurance(periods, options) {
  const decision = monthIndex(options.decisionMonth);
  if (!options.decisionMonth.startsWith("2026-"))
    throw new Error("Công cụ áp dụng hệ số hưởng năm 2026.");
  if (
    !["wait", "retirement", "emigration", "illness", "disability"].includes(options.reason) ||
    typeof options.stopped !== "boolean" ||
    typeof options.waitConfirmed !== "boolean"
  )
    throw new Error("Vui lòng chọn điều kiện hưởng hợp lệ.");
  if (!Array.isArray(periods) || periods.length < 1 || periods.length > 60)
    throw new Error("Nhập từ 1 đến 60 giai đoạn đóng.");
  const ranges = periods
    .map((period, index) => {
      const start = monthIndex(period.from),
        end = monthIndex(period.to),
        salary = Number(period.salary);
      if (start < monthIndex("1990-01") || end > decision || end < start)
        throw new Error(
          `Giai đoạn ${index + 1}: kiểm tra tháng bắt đầu/kết thúc, không sau tháng dự kiến hưởng.`,
        );
      if (!Number.isSafeInteger(salary) || salary <= 0 || salary > 1000000000)
        throw new Error(`Giai đoạn ${index + 1}: lương đóng phải là số nguyên từ 1 đến 1 tỷ VND.`);
      return { ...period, start, end, salary, index };
    })
    .sort((a, b) => a.start - b.start);
  for (let i = 1; i < ranges.length; i++)
    if (ranges[i].start <= ranges[i - 1].end)
      throw new Error("Các giai đoạn bị trùng tháng đóng. Hãy tách theo từng lần thay đổi lương.");
  let totalMonths = 0,
    beforeMonths = 0,
    adjustedSum = 0;
  const yearly = [];
  for (const period of ranges) {
    for (let cursor = period.start; cursor <= period.end; ) {
      const year = Math.floor(cursor / 12),
        end = Math.min(period.end, year * 12 + 11),
        months = end - cursor + 1;
      const coefficient = coefficientFor(year),
        adjusted = period.salary * coefficient * months;
      yearly.push({
        year,
        months,
        salary: period.salary,
        coefficient,
        adjusted,
        periodIndex: period.index,
      });
      totalMonths += months;
      adjustedSum += adjusted;
      if (year < 2014) beforeMonths += months;
      cursor = end + 1;
    }
  }
  const afterMonths = totalMonths - beforeMonths,
    average = adjustedSum / totalMonths;
  const transferredMonths = afterMonths > 0 ? beforeMonths % 12 : 0;
  const beforeYears = afterMonths > 0 ? Math.floor(beforeMonths / 12) : roundedYears(beforeMonths);
  const afterYears = roundedYears(afterMonths + transferredMonths);
  const wageMonths = beforeYears * 1.5 + afterYears * 2;
  // Under a year: contributions to the pension/survivor fund, capped at two adjusted average months.
  const projected = Math.round(
    totalMonths < 12 ? Math.min(adjustedSum * 0.22, average * 2) : average * wageMonths,
  );
  const reasons = [];
  if (!options.stopped) reasons.push("Chưa xác nhận đã chấm dứt tham gia BHXH.");
  if (options.reason === "wait") {
    if (!ranges.some((period) => period.start < monthIndex("2025-07")))
      reasons.push("Điều kiện nghỉ 12 tháng yêu cầu còn thời gian đóng trước 01/07/2025.");
    if (totalMonths >= 240)
      reasons.push("Điều kiện này chỉ áp dụng khi thời gian đóng chưa đủ 20 năm.");
    if (!options.waitConfirmed || decision - ranges.at(-1).end - 1 < 12)
      reasons.push(
        "Chưa đủ hoặc chưa xác nhận 12 tháng liên tục không thuộc BHXH bắt buộc và không tham gia BHXH tự nguyện.",
      );
  }
  if (options.reason === "retirement" && totalMonths >= 180)
    reasons.push("Trường hợp đủ tuổi hưu này yêu cầu chưa đủ 15 năm đóng BHXH.");
  const eligible = reasons.length === 0;
  return {
    options: { ...options },
    periods: periods.map((period) => ({ ...period })),
    yearly,
    totalMonths,
    beforeMonths,
    afterMonths,
    transferredMonths,
    beforeYears,
    afterYears,
    wageMonths,
    average,
    adjustedSum,
    projected,
    eligible,
    reasons,
    total: eligible ? projected : 0,
    underOneYear: totalMonths < 12,
  };
}
