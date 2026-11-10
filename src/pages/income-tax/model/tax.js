import { convertSalary, brackets } from "../../../shared/lib/salary/salary.js";

export function progressiveTax(taxable, bands = brackets) {
  let lower = 0;
  return bands.map(({ limit, rate }) => {
    const income = Math.max(0, Math.min(taxable, limit) - lower);
    const row = { lower, limit, rate, income, tax: Math.round(income * rate) };
    lower = limit;
    return row;
  });
}
export function calculateIncomeTax(amount, options, donation = 0, pension = 0) {
  for (const value of [donation, pension]) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 1000000000)
      throw new Error("Khoản giảm trừ bổ sung phải là số nguyên không âm, tối đa 1 tỷ VND.");
  }
  const salary = convertSalary(amount, options);
  const pensionDeduction = Math.min(pension, 3000000);
  const extraDeduction = Math.min(salary.taxable, donation + pensionDeduction);
  const taxable = salary.taxable - extraDeduction;
  const taxes = progressiveTax(taxable);
  const tax = taxes.reduce((sum, row) => sum + row.tax, 0);
  const oldTaxable = Math.max(
    0,
    amount -
      options.allowance -
      salary.insurance -
      11000000 -
      options.dependents * 4400000 -
      donation -
      Math.min(pension, 1000000),
  );
  const oldBands = [5, 10, 18, 32, 52, 80, Infinity].map((limit, i) => ({
    limit: limit * 1000000,
    rate: [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35][i],
  }));
  const oldTax = progressiveTax(oldTaxable, oldBands).reduce((sum, row) => sum + row.tax, 0);
  return {
    ...salary,
    taxable,
    taxes,
    tax,
    net: amount - salary.insurance - tax,
    donation,
    pension,
    pensionDeduction,
    extraDeduction,
    oldTax,
    oldTaxable,
    saving: oldTax - tax,
  };
}
