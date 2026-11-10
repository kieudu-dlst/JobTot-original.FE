import { MoneyInput } from "@/shared/ui/salary-calculator/money-input";
import { SummaryRows as Rows } from "@/shared/ui/salary-calculator/summary-rows";
import { Select } from "@/shared/ui/select";
import { Table, TableScroll } from "@/shared/ui/table";
import { useToolScrollTop } from "@/shared/lib/use-tool-scroll-top";
import { useState } from "react";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ShieldCheck,
  Users,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerResources } from "@/widgets/career-resources";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { useCandidateSession } from "@/features/authenticate";
import { regions, personalDeduction, dependentDeduction } from "@/shared/lib/salary/salary";
import { calculateIncomeTax } from "../model/tax";
import "@/shared/ui/salary-calculator/salary-calculator.css";
import "./income-tax-page.css";
const money = (value) => Math.round(value).toLocaleString("vi-VN");
const initialOptions = {
  period: "second",
  region: 0,
  insuranceMode: "gross",
  insuranceSalary: 30000000,
  dependents: 1,
  allowance: 0,
  includeUnion: false,
};
const sources = [
  [
    "Chính sách thuế 2025",
    "https://xaydungchinhsach.chinhphu.vn/huong-dan-quyet-toan-thue-thu-nhap-ca-nhan-doi-voi-thu-nhap-tu-tien-luong-tien-cong-119260306092819051.htm",
  ],
  [
    "Biểu thuế 5 bậc",
    "https://xaydungchinhsach.chinhphu.vn/quy-dinh-moi-ve-khau-tru-thue-thu-nhap-ca-nhan-119260703150410707.htm",
  ],
  [
    "Giảm trừ gia cảnh",
    "https://xaydungchinhsach.chinhphu.vn/quy-dinh-giam-tru-gia-canh-119260703144038062.htm",
  ],
  [
    "Lương tối thiểu vùng",
    "https://xaydungchinhsach.chinhphu.vn/nghi-dinh-so-293-2025-nd-cp-quy-dinh-muc-luong-toi-thieu-doi-voi-nguoi-lao-dong-lam-viec-theo-hop-dong-lao-dong-119251110172808433.htm",
  ],
  [
    "Mức tham chiếu từ 07/2026",
    "https://baohiemxahoi.gov.vn/tintuc/pages/linh-vuc-bao-hiem-y-te.aspx?CateID=0&ItemID=26780",
  ],
  [
    "Tỷ lệ bảo hiểm",
    "https://baohiemxahoi.gov.vn/tintuc/Pages/tin-tuc-su-kien.aspx?CateID=0&ItemID=24900",
  ],
];
export function IncomeTaxPage() {
  useToolScrollTop();
  const { account, loading } = useCandidateSession();
  const [amount, setAmount] = useState("30000000");
  const [options, setOptions] = useState(initialOptions);
  const [allowance, setAllowance] = useState("0");
  const [insuranceSalary, setInsuranceSalary] = useState("30000000");
  const [donation, setDonation] = useState("0");
  const [pension, setPension] = useState("0");
  const [error, setError] = useState("");
  const [result, setResult] = useState(() => calculateIncomeTax(30000000, initialOptions));
  function patch(value) {
    setOptions((current) => ({ ...current, ...value }));
  }
  const current = {
    ...options,
    allowance: Number(allowance),
    insuranceSalary: Number(insuranceSalary),
  };
  const stale =
    result.gross !== Number(amount) ||
    JSON.stringify(result.options) !== JSON.stringify(current) ||
    result.donation !== Number(donation) ||
    result.pension !== Number(pension);
  function calculate(event) {
    event.preventDefault();
    try {
      setResult(calculateIncomeTax(Number(amount), current, Number(donation), Number(pension)));
      setError("");
    } catch (failure) {
      setError(failure.message);
    }
  }
  const active = result.taxes.findLastIndex((row) => row.income > 0);
  return (
    <div className="income-tax-page salary-page companies-page font-roboto">
      <title>Tính thuế thu nhập cá nhân 2026 | Job Tốt</title>
      <AuthHeader userName={account?.fullName} loading={loading} />
      <main className="page-container company-container">
        <PageBreadcrumb
          parents={[{ to: "/tools", label: "Ti\u1ec7n \u00edch" }]}
          current="Tính thuế thu nhập cá nhân 2026"
        />
        <section className="salary-hero">
          <span>
            <Sparkles /> CHÍNH SÁCH THUẾ • KỲ TÍNH 2026
          </span>
          <h1>
            Công Cụ Tính Thuế Thu Nhập Cá Nhân
            <br />
            <em>Mới Nhất 2026</em>
          </h1>
          <p>
            Giảm trừ bản thân <strong>15.500.000 đ/tháng</strong>, mỗi người phụ thuộc{" "}
            <strong>6.200.000 đ/tháng</strong>.<br />
            Tính thuế từ tiền lương theo biểu thuế lũy tiến 5 bậc.
          </p>
          <div>
            <span>
              <CheckCircle2 />4 vùng lương tối thiểu
            </span>
            <span>
              <CheckCircle2 />
              Giảm trừ gia cảnh 15,5 / 6,2 triệu
            </span>
            <span>
              <CheckCircle2 />
              Bảng tính từng bậc thuế
            </span>
          </div>
        </section>
        <div className="salary-calculator-grid">
          <form className="salary-form salary-box" onSubmit={calculate}>
            <MoneyInput
              label="Tổng thu nhập trước thuế (Lương Gross)"
              value={amount}
              onChange={setAmount}
              required
            />
            <div className="salary-presets">
              {[15000000, 25000000, 30000000, 50000000].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={Number(amount) === value}
                  onClick={() => setAmount(String(value))}
                >
                  {money(value)}
                </button>
              ))}
            </div>
            <label className="salary-field">
              Kỳ tính lương
              <Select
                value={options.period}
                onChange={(event) => patch({ period: event.target.value })}
              >
                <option value="first">Tháng 01–06/2026 • Mức tham chiếu 2,34 triệu</option>
                <option value="second">Tháng 07–12/2026 • Mức tham chiếu 2,53 triệu</option>
              </Select>
            </label>
            <fieldset className="salary-insurance">
              <legend>Mức đóng Bảo hiểm Xã hội</legend>
              {[
                ["gross", "Trên lương Gross", "Theo thu nhập đã nhập"],
                ["custom", "Mức thỏa thuận khác", "Nhập lương làm căn cứ đóng"],
              ].map(([value, label, description]) => (
                <label
                  key={value}
                  className={options.insuranceMode === value ? "salary-selected" : ""}
                >
                  <input
                    type="radio"
                    name="insurance"
                    value={value}
                    checked={options.insuranceMode === value}
                    onChange={() => patch({ insuranceMode: value })}
                  />
                  <span>
                    {label}
                    <small>{description}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            {options.insuranceMode === "custom" && (
              <MoneyInput
                label="Lương làm căn cứ đóng bảo hiểm"
                value={insuranceSalary}
                onChange={setInsuranceSalary}
                required
              />
            )}
            <fieldset className="salary-regions">
              <legend>Vùng áp dụng lương tối thiểu</legend>
              <div>
                {regions.map((value, index) => (
                  <label key={value} className={options.region === index ? "salary-selected" : ""}>
                    <input
                      type="radio"
                      name="region"
                      value={index}
                      checked={options.region === index}
                      onChange={() => patch({ region: index })}
                    />
                    <span>
                      Vùng {index + 1}
                      <strong>{money(value)} đ/tháng</strong>
                    </span>
                  </label>
                ))}
              </div>
              <small>Chọn theo địa bàn nơi làm việc trong Nghị định 293/2025/NĐ-CP.</small>
            </fieldset>
            <div className="salary-deductions">
              <div>
                <span>Giảm trừ bản thân</span>
                <strong>{money(personalDeduction)} đ/tháng</strong>
                <small>Áp dụng kỳ tính thuế 2026</small>
              </div>
              <label>
                Người phụ thuộc
                <input
                  type="number"
                  aria-label="Người phụ thuộc"
                  min="0"
                  max="50"
                  step="1"
                  value={options.dependents}
                  onChange={(event) =>
                    patch({
                      dependents: event.target.value === "" ? "" : Number(event.target.value),
                    })
                  }
                />
                <small>{money(dependentDeduction)} đ/người/tháng</small>
              </label>
            </div>
            <MoneyInput
              label="Khoản thu nhập miễn thuế"
              value={allowance}
              onChange={setAllowance}
              hint="Đã nằm trong Gross. Chỉ nhập khoản đáp ứng điều kiện miễn thuế; không mặc định mọi phụ cấp đều được miễn."
            />{" "}
            <MoneyInput
              label="Đóng góp từ thiện, nhân đạo và khuyến học"
              value={donation}
              onChange={setDonation}
              hint="Chỉ nhập khoản đủ điều kiện giảm trừ và có chứng từ hợp lệ."
            />
            <MoneyInput
              label="Bảo hiểm hưu trí bổ sung, tự nguyện"
              value={pension}
              onChange={setPension}
              hint="Giảm trừ tối đa 3.000.000 đ/tháng đối với khoản đủ điều kiện."
            />
            {error && (
              <p className="salary-error" role="alert">
                {error}
              </p>
            )}
            <button className="salary-submit">
              <Calculator /> Tính thuế thu nhập cá nhân ngay <ArrowRight />
            </button>
          </form>
          <section className="salary-result salary-box" aria-label="Kết quả tính thuế">
            <div className="salary-result-label">
              <span>KẾT QUẢ TÍNH TOÁN DỰ KIẾN</span>
              <span>
                <CheckCircle2 /> Tham khảo
              </span>
            </div>
            {stale && (
              <p className="salary-stale" role="status">
                Thông tin đã thay đổi. Bấm tính thuế để cập nhật kết quả.
              </p>
            )}
            <h2>Thuế TNCN tạm tính phải nộp</h2>
            <p className="salary-main-value" aria-live="polite">
              {money(result.tax)} <small>VND / tháng</small>
            </p>
            <p className="tax-effective">
              Thuế suất hiệu dụng:{" "}
              <strong>{((result.tax / result.gross) * 100).toFixed(2)}%</strong> trên tổng thu nhập
            </p>
            <div className="tax-distribution">
              <div>
                <strong>Cơ cấu thu nhập</strong>
                <span className="salary-green">Thực nhận {money(result.net)} đ</span>
              </div>
              <div className="salary-distribution">
                {[result.net, result.insurance, result.tax].map((value, i) => (
                  <span key={i} style={{ width: `${(value / result.gross) * 100}%` }} />
                ))}
              </div>
              <div className="salary-distribution-labels">
                {["Thực nhận", "Bảo hiểm", "Thuế TNCN"].map((label) => (
                  <span key={label}>
                    <i />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <Rows
              rows={[
                ["Tổng thu nhập Gross", `${money(result.gross)} đ`],
                ["Khoản miễn thuế", `− ${money(result.options.allowance)} đ`],
                ["Bảo hiểm bắt buộc", `− ${money(result.insurance)} đ`],
                ["Giảm trừ bản thân", `− ${money(personalDeduction)} đ`],
                [
                  "Giảm trừ người phụ thuộc",
                  `− ${money(result.options.dependents * dependentDeduction)} đ`,
                ],
                ["Giảm trừ bổ sung được áp dụng", `− ${money(result.extraDeduction)} đ`],
                [
                  "Tổng các khoản loại trừ / giảm trừ",
                  `${money(result.gross - result.taxable)} đ`,
                  "salary-blue",
                ],
                ["Thu nhập tính thuế (TNTT)", `${money(result.taxable)} đ`, "salary-orange"],
              ]}
            />
            <p className="salary-scope">
              Ước tính theo tháng cho người lao động Việt Nam cư trú, hợp đồng từ 3 tháng, làm đủ
              tháng. Khoản miễn thuế đã nằm trong Gross; kết quả không thay thế quyết toán thuế năm.
            </p>
          </section>
        </div>
        <section className="tax-explanation">
          <div className="tax-section-title">
            <span>MINH BẠCH • RÕ RÀNG</span>
            <h2>Bảng Giải Trình 4 Bước Tính Thuế Minh Bạch</h2>
            <p>Cùng dữ liệu đầu vào, theo từng khoản giảm trừ và từng bậc thuế.</p>
          </div>
          <div className="tax-four-steps">
            {[
              [
                "Tổng thu nhập chịu thuế",
                "Gross trừ các khoản thu nhập miễn thuế",
                result.gross - result.options.allowance,
              ],
              [
                "Xác định các khoản giảm trừ",
                "Bảo hiểm + gia cảnh + giảm trừ bổ sung",
                result.insurance + result.deduction + result.extraDeduction,
              ],
              [
                "Thu nhập tính thuế (TNTT)",
                "Thu nhập sau giảm trừ, tối thiểu bằng 0",
                result.taxable,
              ],
              ["Tính thuế lũy tiến từng phần", "Cộng số thuế của các bậc có thu nhập", result.tax],
            ].map(([title, description, value], i) => (
              <article key={title}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <strong>{money(value)} VND</strong>
              </article>
            ))}
          </div>
          <div className="salary-box">
            <h3>Biểu thuế lũy tiến từng phần 5 bậc (2026)</h3>
            <TableScroll label="Biểu thuế thu nhập cá nhân" className="salary-tax-table">
              <Table aria-label="Biểu thuế thu nhập cá nhân">
                <thead>
                  <tr>
                    <th>Bậc thuế</th>
                    <th>Thu nhập tính thuế / tháng</th>
                    <th>Thuế suất</th>
                    <th>Phần thu nhập tính thuế</th>
                    <th>Số thuế từng bậc</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {result.taxes.map((row, i) => (
                    <tr key={i} className={i === active ? "tax-active-row" : ""}>
                      <td>Bậc {i + 1}</td>
                      <td>
                        {row.limit === Infinity
                          ? "Trên 100 triệu"
                          : `${row.lower ? `Trên ${row.lower / 1000000}` : "Đến"} ${row.lower ? "đến " : ""}${row.limit / 1000000} triệu`}
                      </td>
                      <td>{row.rate * 100}%</td>
                      <td>{money(row.income)} đ</td>
                      <td>{money(row.tax)} đ</td>
                      <td>
                        {i === active
                          ? "Mức đang áp dụng"
                          : row.income > 0
                            ? "Đã tính đủ bậc"
                            : "Chưa phát sinh"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan="4">Tổng thuế TNCN phải nộp dự kiến</th>
                    <td colSpan="2">{money(result.tax)} VND</td>
                  </tr>
                </tfoot>
              </Table>
            </TableScroll>
            <p className="tax-formula">
              Công thức: TNTT = max(0, Gross − miễn thuế − bảo hiểm − giảm trừ gia cảnh − giảm trừ
              bổ sung). Thuế = tổng (thu nhập trong từng bậc × thuế suất).
            </p>
          </div>
        </section>
        <section className="tax-comparison">
          <span>CẢI CÁCH CHÍNH SÁCH</span>
          <h2>So Sánh Biểu Thuế 7 Bậc Cũ vs 5 Bậc Mới 2026</h2>
          <p>
            Minh họa cùng thu nhập và bảo hiểm hiện tại; thay biểu thuế, giảm trừ gia cảnh và giới
            hạn hưu trí. Không dùng để quyết toán năm 2025.
          </p>
          <div className="salary-step-grid">
            {[
              [
                "Biểu thuế 7 bậc • Chính sách 2025",
                11000000,
                4400000,
                result.oldTaxable,
                result.oldTax,
              ],
              [
                "Biểu thuế 5 bậc • Kỳ tính 2026",
                personalDeduction,
                dependentDeduction,
                result.taxable,
                result.tax,
              ],
            ].map(([title, self, child, taxable, tax], i) => (
              <article className={`salary-box tax-comparison-${i}`} key={title}>
                <h3>{title}</h3>
                <Rows
                  rows={[
                    ["Mức giảm trừ bản thân", `${money(self)} đ/tháng`],
                    ["Mỗi người phụ thuộc", `${money(child)} đ/tháng`],
                    ["Thu nhập tính thuế", `${money(taxable)} đ`],
                    [
                      "Thuế trên dữ liệu đã nhập",
                      `${money(tax)} VND`,
                      i ? "salary-green" : "salary-orange",
                    ],
                  ]}
                />
                {i === 1 && (
                  <p className="tax-saving">
                    Chênh lệch thuế: <strong>{money(result.saving)} VND / tháng</strong>
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
        <section className="salary-guides">
          <h2>Cẩm Nang Tiền Lương & Thuế 2026</h2>
          <p>Các thông số và văn bản dùng cho công cụ.</p>
          <div>
            {[
              [
                Calculator,
                "Lương tối thiểu vùng",
                "Vùng I: 5,31 triệu; II: 4,73 triệu; III: 4,14 triệu; IV: 3,7 triệu/tháng.",
              ],
              [
                ShieldCheck,
                "Bảo hiểm có trần đóng",
                "BHXH/BHYT: 20 lần mức tham chiếu. BHTN: 20 lần lương tối thiểu vùng.",
              ],
              [
                Users,
                "Giảm trừ gia cảnh",
                "Bản thân 15,5 triệu/tháng; mỗi người phụ thuộc 6,2 triệu/tháng đủ điều kiện.",
              ],
              [
                ReceiptText,
                "Biểu thuế 5 bậc",
                "Các mức thuế suất 5%, 10%, 20%, 30% và 35% theo phần thu nhập tính thuế.",
              ],
            ].map(([Icon, title, description]) => (
              <article key={title}>
                <Icon />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <nav aria-label="Nguồn quy định tính lương">
            {sources.map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer">
                {label} ↗
              </a>
            ))}
          </nav>
        </section>
        <CareerResources />
      </main>
      <AuthFooter />
    </div>
  );
}
