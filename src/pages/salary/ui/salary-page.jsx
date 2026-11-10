import { MoneyInput } from "@/shared/ui/salary-calculator/money-input";
import { SummaryRows as Rows } from "@/shared/ui/salary-calculator/summary-rows";
import { Select } from "@/shared/ui/select";
import { Table, TableScroll } from "@/shared/ui/table";
import { useToolScrollTop } from "@/shared/lib/use-tool-scroll-top";
import { useState } from "react";
import {
  ArrowRight,
  ArrowLeftRight,
  Calculator,
  CheckCircle2,
  ShieldCheck,
  Users,
  ReceiptText,
  Building2,
  Sparkles,
} from "lucide-react";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerResources } from "@/widgets/career-resources";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { useCandidateSession } from "@/features/authenticate";
import { convertSalary, regions, personalDeduction, dependentDeduction } from "../model/salary";
import "./salary-page.css";

const money = (value) => Math.round(value).toLocaleString("vi-VN");
const initialOptions = {
  period: "second",
  region: 0,
  insuranceMode: "gross",
  insuranceSalary: 30000000,
  dependents: 1,
  allowance: 730000,
  includeUnion: true,
};
const sources = [
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
export function SalaryPage() {
  useToolScrollTop();
  const { account, loading } = useCandidateSession();
  const [direction, setDirection] = useState("gross");
  const [amount, setAmount] = useState("30000000");
  const [options, setOptions] = useState(initialOptions);
  const [allowance, setAllowance] = useState("730000");
  const [insuranceSalary, setInsuranceSalary] = useState("30000000");
  const [result, setResult] = useState(() => ({
    ...convertSalary(30000000, initialOptions),
    direction: "gross",
    amount: 30000000,
  }));
  const [error, setError] = useState("");
  function patch(value) {
    setOptions((current) => ({ ...current, ...value }));
  }
  const current = {
    ...options,
    allowance: Number(allowance),
    insuranceSalary: Number(insuranceSalary),
  };
  const stale =
    result.direction !== direction ||
    result.amount !== Number(amount) ||
    JSON.stringify(result.options) !== JSON.stringify(current);
  function calculate(event) {
    event.preventDefault();
    try {
      setResult({
        ...convertSalary(Number(amount), current, direction),
        direction,
        amount: Number(amount),
      });
      setError("");
    } catch (failure) {
      setError(failure.message);
    }
  }
  const percentages = [result.net, result.insurance, result.tax].map(
    (value) => (value / result.gross) * 100,
  );
  return (
    <div
      className="salary-page companies-page font-roboto"
      data-salary-direction={result.direction}
    >
      <title>Tính lương Gross sang Net & Net sang Gross 2026 | Job Tốt</title>
      <AuthHeader userName={account?.fullName} loading={loading} />
      <main className="page-container company-container">
        <PageBreadcrumb
          parents={[{ to: "/tools", label: "Ti\u1ec7n \u00edch" }]}
          current="Tính lương Gross – Net 2026"
        />
        <section className="salary-hero">
          <span>
            <Sparkles /> CHÍNH SÁCH TIỀN LƯƠNG • KỲ TÍNH THUẾ 2026
          </span>
          <h1>
            Công Cụ Tính Lương <em>Gross sang Net</em> & Net sang Gross 2026
          </h1>
          <p>
            Giảm trừ bản thân <strong>15,5 triệu/tháng</strong>, mỗi người phụ thuộc{" "}
            <strong>6,2 triệu/tháng</strong>. Biểu thuế lũy tiến 5 bậc và các khoản bảo hiểm có tính
            trần đóng.
          </p>
          <div>
            <span>
              <CheckCircle2 />4 vùng lương tối thiểu
            </span>
            <span>
              <CheckCircle2 />
              Lựa chọn kỳ đóng bảo hiểm
            </span>
            <span>
              <CheckCircle2 />
              Bảng giải trình từng khoản
            </span>
          </div>
        </section>
        <div className="salary-calculator-grid">
          <form className="salary-form salary-box" onSubmit={calculate}>
            <div className="salary-direction">
              {[
                ["gross", "Lương GROSS sang NET"],
                ["net", "Lương NET sang GROSS"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={direction === value}
                  onClick={() => {
                    setDirection(value);
                    setError("");
                  }}
                >
                  <ArrowLeftRight />
                  {label}
                </button>
              ))}
            </div>
            <MoneyInput
              label={
                direction === "gross"
                  ? "Thu nhập hàng tháng (Lương GROSS)"
                  : "Thu nhập thực nhận (Lương NET)"
              }
              value={amount}
              onChange={setAmount}
              required
            />
            <div className="salary-presets">
              {[15000000, 20000000, 30000000, 50000000].map((value) => (
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
            />
            <label className="salary-union">
              <input
                type="checkbox"
                checked={options.includeUnion}
                onChange={(event) => patch({ includeUnion: event.target.checked })}
              />
              Tính thêm kinh phí công đoàn 2% vào chi phí doanh nghiệp
            </label>
            {error && (
              <p className="salary-error" role="alert">
                {error}
              </p>
            )}
            <button className="salary-submit">
              <Calculator /> QUY ĐỔI LƯƠNG NGAY <ArrowRight />
            </button>
          </form>
          <section className="salary-result salary-box" aria-label="Kết quả quy đổi">
            <div className="salary-result-label">
              <span>
                KẾT QUẢ TÍNH TOÁN • {result.options.period === "first" ? "01–06" : "07–12"}/2026
              </span>
              <span>
                <CheckCircle2 /> Tham khảo
              </span>
            </div>
            {stale && (
              <p className="salary-stale" role="status">
                Thông tin đã thay đổi. Bấm “Quy đổi lương ngay” để cập nhật kết quả.
              </p>
            )}
            <h2>
              {result.direction === "net"
                ? "LƯƠNG TRƯỚC KHẤU TRỪ (GROSS)"
                : "LƯƠNG THỰC NHẬN (NET)"}
            </h2>
            <p className="salary-main-value" aria-live="polite">
              {money(result.direction === "net" ? result.gross : result.net)} <small>VND</small>
            </p>
            <div
              className="salary-distribution"
              aria-label="Tỷ trọng lương thực nhận, bảo hiểm và thuế"
            >
              {percentages.map((value, index) => (
                <span key={index} style={{ width: `${value}%` }} />
              ))}
            </div>
            <div className="salary-distribution-labels">
              {["Thực nhận", "Bảo hiểm", "Thuế TNCN"].map((label, index) => (
                <span key={label}>
                  <i />
                  {label} ({percentages[index].toFixed(1)}%)
                </span>
              ))}
            </div>
            <div className="salary-result-cards">
              <article>
                <ShieldCheck />
                <h3>Tổng bảo hiểm</h3>
                <strong className="salary-blue">− {money(result.insurance)} đ</strong>
                <small>BHXH, BHYT, BHTN</small>
              </article>
              <article>
                <Users />
                <h3>Giảm trừ gia cảnh</h3>
                <strong className="salary-green">{money(result.deduction)} đ</strong>
                <small>Bản thân + {result.options.dependents} người phụ thuộc</small>
              </article>
              <article>
                <ReceiptText />
                <h3>Thuế TNCN tạm tính</h3>
                <strong className="salary-orange">− {money(result.tax)} đ</strong>
                <small>Biểu thuế lũy tiến 5 bậc</small>
              </article>
            </div>
            <div className="salary-employer-total">
              <Building2 />
              <div>
                <strong>Tổng chi phí doanh nghiệp</strong>
                <small>
                  Gross + bảo hiểm{result.options.includeUnion ? " + kinh phí công đoàn" : ""}
                </small>
              </div>
              <strong>{money(result.employerCost)} đ</strong>
            </div>
            <Rows
              rows={[
                ["Lương Gross", `${money(result.gross)} đ`],
                ["Lương thực nhận (Net)", `${money(result.net)} đ`, "salary-green"],
              ]}
            />
            <p className="salary-scope">
              Ước tính cho người lao động Việt Nam cư trú, hợp đồng từ 3 tháng, làm việc đủ tháng
              với tỷ lệ bảo hiểm thông thường. Chưa tính đoàn phí cá nhân, khoản giảm trừ khác hoặc
              trường hợp miễn/giảm đóng đặc thù.
            </p>
          </section>
        </div>
        <section className="salary-explanation salary-box">
          <div className="salary-explanation-heading">
            <div>
              <h2>Bảng Giải Trình Chi Tiết Các Bước Tính Lương</h2>
              <p>Số liệu theo kết quả quy đổi gần nhất; đơn vị VND/tháng.</p>
            </div>
            <span>
              <CheckCircle2 /> Chi tiết từng khoản
            </span>
          </div>
          <div className="salary-step-grid">
            <article>
              <h3>Bước 1: Các khoản bảo hiểm bắt buộc</h3>
              <Rows
                rows={[
                  ["Lương làm căn cứ đóng", `${money(result.base)} đ`],
                  ["Căn cứ BHXH/BHYT sau áp trần", `${money(result.socialBase)} đ`],
                  ["Căn cứ BHTN sau áp trần", `${money(result.unemploymentBase)} đ`],
                  ["BHXH – 8%", `− ${money(result.social)} đ`, "salary-blue"],
                  ["BHYT – 1,5%", `− ${money(result.health)} đ`, "salary-blue"],
                  ["BHTN – 1%", `− ${money(result.unemployment)} đ`, "salary-blue"],
                  ["Tổng khấu trừ bảo hiểm", `− ${money(result.insurance)} đ`, "salary-blue"],
                ]}
              />
            </article>
            <article>
              <h3>Bước 2: Xác định thu nhập tính thuế</h3>
              <Rows
                rows={[
                  ["Tổng thu nhập Gross", `${money(result.gross)} đ`],
                  ["Khoản miễn thuế", `− ${money(result.options.allowance)} đ`, "salary-green"],
                  ["Bảo hiểm người lao động", `− ${money(result.insurance)} đ`],
                  ["Giảm trừ bản thân", `− ${money(personalDeduction)} đ`, "salary-green"],
                  [
                    "Giảm trừ người phụ thuộc",
                    `− ${money(result.options.dependents * dependentDeduction)} đ`,
                    "salary-green",
                  ],
                  ["Thu nhập tính thuế", `${money(result.taxable)} đ`, "salary-orange"],
                ]}
              />
            </article>
          </div>
          <h3>Bước 3: Biểu thuế lũy tiến từng phần TNCN (5 bậc)</h3>
          <TableScroll label="Bảng chi tiết tính lương" className="salary-tax-table">
            <Table aria-label="Bảng chi tiết tính lương">
              <thead>
                <tr>
                  <th>Bậc thuế</th>
                  <th>Khoảng thu nhập tính thuế/tháng</th>
                  <th>Thuế suất</th>
                  <th>Thu nhập trong bậc</th>
                  <th>Thuế phải nộp</th>
                </tr>
              </thead>
              <tbody>
                {result.taxes.map((row, index) => (
                  <tr key={index}>
                    <td>Bậc {index + 1}</td>
                    <td>
                      {row.limit === Infinity
                        ? "Trên 100 triệu"
                        : row.lower
                          ? `Trên ${row.lower / 1000000} đến ${row.limit / 1000000} triệu`
                          : "Đến 10 triệu"}
                    </td>
                    <td className="salary-orange">{row.rate * 100}%</td>
                    <td>{money(row.income)} đ</td>
                    <td className="salary-blue">{money(row.tax)} đ</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="4">Tổng thuế TNCN người lao động phải nộp</th>
                  <td>{money(result.tax)} đ</td>
                </tr>
              </tfoot>
            </Table>
          </TableScroll>
          <article className="salary-employer-step">
            <h3>Bước 4: Phần đóng của người sử dụng lao động</h3>
            <p>
              Bảo hiểm thông thường 21,5%, áp dụng các trần tương ứng; kinh phí công đoàn tính
              riêng.
            </p>
            <div>
              {[
                ["BHXH & TNLĐ–BNN (17,5%)", result.employer.social],
                ["BHYT (3%)", result.employer.health],
                ["BHTN (1%)", result.employer.unemployment],
                ["Kinh phí công đoàn (2%)", result.employer.union],
              ].map(([label, value]) => (
                <span key={label}>
                  {label}
                  <strong>{money(value)} đ</strong>
                </span>
              ))}
            </div>
          </article>
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
