// Resident Vietnamese employee, full-month salary, standard contribution rates.
// Sources and effective periods are linked in the calculator and docs/salary-calculator.md.
export const regions = [5310000, 4730000, 4140000, 3700000];
export const brackets = [
  { limit: 10000000, rate: 0.05 },
  { limit: 30000000, rate: 0.1 },
  { limit: 60000000, rate: 0.2 },
  { limit: 100000000, rate: 0.3 },
  { limit: Infinity, rate: 0.35 },
];
export const personalDeduction = 15500000;
export const dependentDeduction = 6200000;
export const maximumSalary = 1000000000;
export function calculateGross(gross, options) {
  const cap = 20 * (options.period === "first" ? 2340000 : 2530000);
  const base = options.insuranceMode === "custom" ? options.insuranceSalary : gross;
  const socialBase = Math.min(base, cap);
  const unemploymentBase = Math.min(base, 20 * regions[options.region]);
  const social = Math.round(socialBase * 0.08);
  const health = Math.round(socialBase * 0.015);
  const unemployment = Math.round(unemploymentBase * 0.01);
  const insurance = social + health + unemployment;
  const deduction = personalDeduction + options.dependents * dependentDeduction;
  const taxable = Math.max(0, gross - options.allowance - insurance - deduction);
  let lower = 0;
  const taxes = brackets.map(({ limit, rate }) => {
    const income = Math.max(0, Math.min(taxable, limit) - lower);
    const row = { lower, limit, rate, income, tax: Math.round(income * rate) };
    lower = limit;
    return row;
  });
  const tax = taxes.reduce((total, row) => total + row.tax, 0);
  const employer = {
    social: Math.round(socialBase * 0.175),
    health: Math.round(socialBase * 0.03),
    unemployment: Math.round(unemploymentBase * 0.01),
    union: options.includeUnion ? Math.round(socialBase * 0.02) : 0,
  };
  const employerInsurance = employer.social + employer.health + employer.unemployment;
  return {
    gross,
    net: gross - insurance - tax,
    social,
    health,
    unemployment,
    insurance,
    deduction,
    taxable,
    taxes,
    tax,
    employer,
    employerInsurance,
    employerCost: gross + employerInsurance + employer.union,
    base,
    socialBase,
    unemploymentBase,
    cap,
    options: { ...options },
  };
}
export function convertSalary(amount, options, direction = "gross") {
  if (
    !["gross", "net"].includes(direction) ||
    !["first", "second"].includes(options.period) ||
    !["gross", "custom"].includes(options.insuranceMode) ||
    !Number.isInteger(options.region) ||
    options.region < 0 ||
    options.region > 3
  )
    throw new Error("Vui lòng chọn kỳ tính, vùng và cách đóng bảo hiểm hợp lệ.");
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > maximumSalary)
    throw new Error("Thu nhập phải là số nguyên từ 1 đến 1.000.000.000 VND.");
  if (!Number.isInteger(options.dependents) || options.dependents < 0 || options.dependents > 50)
    throw new Error("Số người phụ thuộc phải là số nguyên từ 0 đến 50.");
  if (
    !Number.isSafeInteger(options.allowance) ||
    options.allowance < 0 ||
    options.allowance > maximumSalary
  )
    throw new Error("Khoản miễn thuế phải là số tiền hợp lệ, không âm.");
  if (
    options.insuranceMode === "custom" &&
    (!Number.isSafeInteger(options.insuranceSalary) ||
      options.insuranceSalary < regions[options.region] ||
      options.insuranceSalary > maximumSalary)
  )
    throw new Error("Lương đóng bảo hiểm phải từ mức tối thiểu vùng và không quá 1 tỷ VND.");
  const minimum = Math.max(
    regions[options.region],
    options.allowance,
    options.insuranceMode === "custom" ? options.insuranceSalary : 0,
  );
  if (direction === "gross") {
    if (amount < minimum)
      throw new Error(
        "Gross phải từ mức tối thiểu vùng và không thấp hơn lương đóng bảo hiểm hoặc khoản miễn thuế.",
      );
    return calculateGross(amount, options);
  }
  if (amount < calculateGross(minimum, options).net)
    throw new Error(
      "Net đã nhập thấp hơn mức có thể quy đổi với lương tối thiểu và thông tin bảo hiểm đã chọn.",
    );
  if (amount > calculateGross(maximumSalary, options).net)
    throw new Error("Gross quy đổi vượt giới hạn 1 tỷ VND. Vui lòng nhập Net thấp hơn.");
  let low = minimum,
    high = maximumSalary;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (calculateGross(middle, options).net < amount) low = middle;
    else high = middle;
  }
  // Whole-VND rounding can cause a one-VND step around contribution boundaries.
  return Array.from({ length: 11 }, (_, index) =>
    Math.min(maximumSalary, Math.max(minimum, high + index - 5)),
  )
    .map((gross) => calculateGross(gross, options))
    .sort((a, b) => Math.abs(a.net - amount) - Math.abs(b.net - amount) || a.gross - b.gross)[0];
}
