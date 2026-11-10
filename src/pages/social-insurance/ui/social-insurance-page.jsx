import { Table, TableScroll } from "@/shared/ui/table";
import { useToolScrollTop } from "@/shared/lib/use-tool-scroll-top";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  Trash2,
  Calculator,
  CheckCircle2,
  ShieldCheck,
  FileText,
  FolderOpen,
  Wallet,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerResources } from "@/widgets/career-resources";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { useCandidateSession } from "@/features/authenticate";
import { calculateSocialInsurance, coefficients } from "../model/social-insurance";
import "./social-insurance-page.css";

const money = (value) => Math.round(value).toLocaleString("vi-VN");
const initialPeriods = [
  { id: 1, from: "2019-01", to: "2021-12", salary: "5500000" },
  { id: 2, from: "2022-01", to: "2022-04", salary: "6000000" },
];
const initialOptions = {
  decisionMonth: "2026-10",
  reason: "wait",
  stopped: true,
  waitConfirmed: true,
};
const benefitReasons = [
  [
    "wait",
    "Sau 12 tháng không thuộc BHXH bắt buộc, không tham gia BHXH tự nguyện; còn thời gian đóng trước 01/07/2025 và chưa đủ 20 năm",
  ],
  ["retirement", "Đã đủ tuổi hưởng lương hưu nhưng chưa đủ 15 năm đóng BHXH"],
  ["emigration", "Ra nước ngoài để định cư"],
  ["illness", "Mắc ung thư, bại liệt, xơ gan mất bù, lao nặng hoặc AIDS"],
  ["disability", "Suy giảm khả năng lao động từ 81% trở lên hoặc khuyết tật đặc biệt nặng"],
];
const steps = [
  [
    "Tính thời gian từng thời kỳ",
    "Cộng số tháng đóng thực tế, tách trước 2014 và từ 2014 trở đi.",
    "Không tính các tháng gián đoạn",
  ],
  [
    "Tính mức lương bình quân",
    "Điều chỉnh lương theo hệ số từng năm rồi chia tổng cho số tháng đóng.",
    "Bình quân có trọng số theo tháng",
  ],
  [
    "Quy đổi & xử lý tháng lẻ",
    "Chuyển tháng lẻ trước 2014 sang sau 2014 nếu có cả hai thời kỳ.",
    "1–6 tháng = 0,5 năm; 7–11 = 1 năm",
  ],
  [
    "Áp dụng công thức nhận tiền",
    "Mỗi năm trước 2014 tính 1,5 tháng lương; từ 2014 tính 2 tháng.",
    "Dưới 1 năm: áp dụng công thức riêng",
  ],
];
const procedure = [
  [
    FolderOpen,
    "Chuẩn bị hồ sơ",
    "Kiểm tra quá trình đóng BHXH, đơn đề nghị và giấy tờ chứng minh điều kiện hưởng của bạn.",
  ],
  [
    FileText,
    "Nộp hồ sơ",
    "Nộp tại cơ quan BHXH hoặc qua dịch vụ công theo hướng dẫn cho trường hợp của bạn.",
  ],
  [
    ShieldCheck,
    "Giải quyết hồ sơ",
    "Cơ quan BHXH đối chiếu thời gian đóng, căn cứ tiền lương và điều kiện hưởng trước khi ban hành quyết định.",
  ],
  [
    Wallet,
    "Nhận tiền trợ cấp",
    "Nhận tiền theo phương thức đăng ký; đối chiếu mức hưởng và thời gian đóng đã giải quyết.",
  ],
];
export function SocialInsurancePage() {
  useToolScrollTop();
  const { account, loading } = useCandidateSession();
  const [periods, setPeriods] = useState(initialPeriods);
  const [options, setOptions] = useState(initialOptions);
  const [result, setResult] = useState(() =>
    calculateSocialInsurance(initialPeriods, initialOptions),
  );
  const [error, setError] = useState("");
  const stale =
    JSON.stringify(periods) !== JSON.stringify(result.periods) ||
    JSON.stringify(options) !== JSON.stringify(result.options);
  function patchPeriod(id, change) {
    setPeriods((current) =>
      current.map((period) => (period.id === id ? { ...period, ...change } : period)),
    );
  }
  function patchOptions(change) {
    setOptions((current) => ({ ...current, ...change }));
  }
  function calculate(event) {
    event.preventDefault();
    try {
      setResult(calculateSocialInsurance(periods, options));
      setError("");
    } catch (failure) {
      setError(failure.message);
    }
  }
  function addPeriod() {
    setPeriods((current) => [
      ...current,
      { id: Math.max(...current.map((period) => period.id)) + 1, from: "", to: "", salary: "" },
    ]);
  }
  const totalParts = [result.beforeYears * 1.5, result.afterYears * 2];
  return (
    <div className="social-insurance-page companies-page font-roboto">
      <title>Tính bảo hiểm xã hội một lần 2026 | Job Tốt</title>
      <AuthHeader userName={account?.fullName} loading={loading} />
      <main className="page-container company-container">
        <PageBreadcrumb
          parents={[{ to: "/tools", label: "Ti\u1ec7n \u00edch" }]}
          current="Tính BHXH một lần 2026"
        />
        <section className="bhxh-hero">
          <span>
            <Sparkles /> CHÍNH SÁCH ÁP DỤNG NĂM 2026
          </span>
          <h1>
            Công Cụ Tính <em>Bảo Hiểm Xã Hội (BHXH) 1 Lần</em> Chuẩn 2026
          </h1>
          <p>
            Ước tính khoản nhận từ quá trình đóng bảo hiểm, hệ số điều chỉnh tiền lương
            <br />
            và thời gian đóng trước / từ năm 2014.
          </p>
        </section>
        <div className="bhxh-calculator-grid">
          <form className="bhxh-card bhxh-form" onSubmit={calculate}>
            <div className="bhxh-card-heading">
              <h2>
                <span />
                Quá trình tham gia chi tiết
              </h2>
              <small>Hệ số điều chỉnh năm 2026</small>
            </div>
            <p className="bhxh-scope">
              Áp dụng cho người lao động Việt Nam đóng BHXH bắt buộc theo tiền lương do doanh nghiệp
              quyết định. Nhập mức lương làm căn cứ đóng, tách giai đoạn khi lương thay đổi; chỉ
              nhập thời gian chưa hưởng một lần.
            </p>
            <label className="bhxh-decision">
              Tháng dự kiến giải quyết (2026)
              <input
                type="month"
                aria-label="Tháng dự kiến giải quyết"
                min="2026-01"
                max="2026-12"
                required
                value={options.decisionMonth}
                onChange={(event) => patchOptions({ decisionMonth: event.target.value })}
              />
            </label>
            <div className="bhxh-periods">
              {periods.map((period, index) => (
                <fieldset key={period.id}>
                  <legend>Giai đoạn {index + 1}</legend>
                  <div className="bhxh-period-header">
                    <span>Tiền lương đóng BHXH hằng tháng</span>
                    {periods.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Xóa giai đoạn ${index + 1}`}
                        onClick={() =>
                          setPeriods((current) => current.filter((item) => item.id !== period.id))
                        }
                      >
                        <Trash2 />
                      </button>
                    )}
                  </div>
                  <div className="bhxh-period-fields">
                    <label>
                      Từ tháng/năm
                      <input
                        type="month"
                        aria-label={`Từ tháng giai đoạn ${index + 1}`}
                        min="1990-01"
                        max={options.decisionMonth}
                        required
                        value={period.from}
                        onChange={(event) => patchPeriod(period.id, { from: event.target.value })}
                      />
                    </label>
                    <label>
                      Đến tháng/năm
                      <input
                        type="month"
                        aria-label={`Đến tháng giai đoạn ${index + 1}`}
                        min="1990-01"
                        max={options.decisionMonth}
                        required
                        value={period.to}
                        onChange={(event) => patchPeriod(period.id, { to: event.target.value })}
                      />
                    </label>
                    <label>
                      Mức lương đóng (VND)
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Mức lương giai đoạn ${index + 1}`}
                        required
                        value={period.salary === "" ? "" : money(Number(period.salary))}
                        onChange={(event) => {
                          const value = event.target.value.replace(/[.,\s]/g, "");
                          if (/^\d{0,10}$/.test(value)) patchPeriod(period.id, { salary: value });
                        }}
                      />
                    </label>
                  </div>
                </fieldset>
              ))}
            </div>
            <button
              className="bhxh-add"
              type="button"
              disabled={periods.length >= 60}
              onClick={addPeriod}
            >
              <Plus />
              Thêm giai đoạn đóng BHXH mới
            </button>
            <fieldset className="bhxh-conditions">
              <legend>
                <Calculator />
                Điều kiện hưởng BHXH một lần
              </legend>
              {benefitReasons.map(([value, label]) => (
                <label className={options.reason === value ? "is-selected" : ""} key={value}>
                  <input
                    type="radio"
                    name="reason"
                    checked={options.reason === value}
                    onChange={() => patchOptions({ reason: value })}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <label className="bhxh-confirm">
              <input
                type="checkbox"
                checked={options.stopped}
                onChange={(event) => patchOptions({ stopped: event.target.checked })}
              />
              Tôi đã chấm dứt tham gia BHXH và xác nhận trường hợp đã chọn.
            </label>
            {options.reason === "wait" && (
              <label className="bhxh-confirm">
                <input
                  type="checkbox"
                  checked={options.waitConfirmed}
                  onChange={(event) => patchOptions({ waitConfirmed: event.target.checked })}
                />
                Đã đủ 12 tháng liên tục không thuộc BHXH bắt buộc và không tham gia BHXH tự nguyện
                trước tháng nộp hồ sơ.
              </label>
            )}
            {error && (
              <p className="bhxh-error" role="alert">
                {error}
              </p>
            )}
            <button className="bhxh-submit">
              <Calculator />
              TÍNH TIỀN BHXH 1 LẦN NGAY
            </button>
            <p className="bhxh-footnote">
              Kết quả tham khảo; điều kiện và số tiền chính thức được cơ quan BHXH xác nhận.
            </p>
          </form>
          <section className="bhxh-card bhxh-result" aria-label="Kết quả tính BHXH">
            <div className="bhxh-card-heading">
              <h2>Kết quả ước tính</h2>
              <span className="bhxh-status">
                <CheckCircle2 />
                Theo thông tin đã nhập
              </span>
            </div>
            {stale && (
              <p className="bhxh-stale" role="status">
                Thông tin đã thay đổi. Bấm tính để cập nhật kết quả.
              </p>
            )}
            <div className="bhxh-total">
              <span>Mức tiền BHXH một lần dự kiến</span>
              <strong aria-live="polite">
                {money(result.total)} <small>VND</small>
              </strong>
              <p>
                <CheckCircle2 />
                Hệ số điều chỉnh tiền lương hưởng năm 2026
              </p>
            </div>
            {!result.eligible && (
              <div className="bhxh-ineligible" role="status">
                <h3>Chưa đáp ứng điều kiện đã nhập</h3>
                <ul>
                  {result.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <p>Số tiền theo công thức nếu đủ điều kiện: {money(result.projected)} đ.</p>
              </div>
            )}
            <dl className="bhxh-breakdown">
              {[
                ["Mức bình quân tiền lương đã điều chỉnh", `${money(result.average)} đ/tháng`],
                [
                  "Tổng thời gian đóng thực tế",
                  `${Math.floor(result.totalMonths / 12)} năm ${result.totalMonths % 12} tháng (${result.totalMonths} tháng)`,
                ],
                ["Trước 2014", `${result.beforeMonths} tháng thực tế`],
                ["Từ 2014", `${result.afterMonths} tháng thực tế`],
                ["Tháng lẻ chuyển sang thời kỳ từ 2014", `${result.transferredMonths} tháng`],
                [
                  "Trước 2014 sau quy đổi (× 1,5)",
                  `${result.beforeYears} năm = ${totalParts[0]} tháng lương`,
                ],
                [
                  "Từ 2014 sau quy đổi (× 2)",
                  `${result.afterYears} năm = ${totalParts[1]} tháng lương`,
                ],
                [
                  "Công thức áp dụng",
                  result.underOneYear
                    ? "Dưới 1 năm: 22% tổng lương điều chỉnh, tối đa 2 tháng bình quân"
                    : `${result.wageMonths} tháng × lương bình quân`,
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {!result.underOneYear && (
              <div className="bhxh-distribution" aria-label="Tỷ trọng trước và sau năm 2014">
                {totalParts.map((part, i) => (
                  <span key={i} style={{ width: `${(part / result.wageMonths) * 100}%` }} />
                ))}
              </div>
            )}
            <div className="bhxh-distribution-labels">
              <span>Trước 2014 (1,5)</span>
              <span>Từ 2014 (2,0)</span>
            </div>
            <p className="bhxh-note">
              <TriangleAlert />
              Các giai đoạn đi qua nhiều năm dùng hệ số riêng từng năm. Lương bình quân được tính
              theo số tháng đóng, không lấy trung bình đơn giản giữa các giai đoạn.
            </p>
            <details className="bhxh-yearly">
              <summary>Xem chi tiết điều chỉnh từng năm</summary>
              <TableScroll label="Chi tiết BHXH theo năm" className="bhxh-table-scroll">
                <Table aria-label="Chi tiết BHXH theo năm">
                  <thead>
                    <tr>
                      <th>Năm</th>
                      <th>Tháng</th>
                      <th>Lương đóng</th>
                      <th>Hệ số</th>
                      <th>Tổng điều chỉnh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearly.map((row, index) => (
                      <tr key={index}>
                        <td>{row.year}</td>
                        <td>{row.months}</td>
                        <td>{money(row.salary)}</td>
                        <td>{row.coefficient.toFixed(2)}</td>
                        <td>{money(row.adjusted)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableScroll>
            </details>
          </section>
        </div>
        <section className="bhxh-explanation">
          <div className="bhxh-section-heading centered">
            <span>MINH BẠCH & CHÍNH XÁC</span>
            <h2>4 Bước Tính Tiền Trợ Cấp BHXH 1 Lần Theo Luật Định</h2>
            <p>Từ quá trình đóng thực tế đến mức bình quân và công thức hưởng.</p>
          </div>
          <div className="bhxh-four-grid">
            {steps.map(([title, description, note], i) => (
              <article className={`bhxh-card bhxh-tone-${i}`} key={title}>
                <span className="bhxh-step-number">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <small>{note}</small>
              </article>
            ))}
          </div>
        </section>
        <section className="bhxh-reference">
          <div className="bhxh-rounding">
            <div className="bhxh-section-heading">
              <span>QUY ĐỊNH PHÁP LUẬT</span>
              <h2>Quy Tắc Làm Tròn Tháng Lẻ</h2>
            </div>
            <div className="bhxh-card">
              {[
                ["Dưới 12 tháng đóng", "22% tổng lương đã điều chỉnh, tối đa 2 tháng bình quân"],
                ["Từ 1 đến 6 tháng lẻ", "Tính thêm 0,5 năm"],
                ["Từ 7 đến 11 tháng lẻ", "Tính thêm 1 năm"],
              ].map(([title, text], i) => (
                <div className={`bhxh-rounding-item bhxh-tone-${i}`} key={title}>
                  <span>{i + 1}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="bhxh-footnote">
              Khi có cả hai thời kỳ, phần tháng lẻ trước 2014 được chuyển sang từ 2014 trước khi làm
              tròn. Nếu chỉ đóng trước 2014, làm tròn tại thời kỳ đó.
            </p>
          </div>
          <div>
            <div className="bhxh-section-heading">
              <span>TRA CỨU HỆ SỐ</span>
              <h2>Bảng Hệ Số Điều Chỉnh Mới Nhất</h2>
              <p>Công văn 340/BHXH-CSXH • hưởng năm 2026</p>
            </div>
            <div className="bhxh-card bhxh-coefficient-table">
              <TableScroll label="Hệ số điều chỉnh BHXH" className="bhxh-table-scroll">
                <Table aria-label="Hệ số điều chỉnh BHXH">
                  <thead>
                    <tr>
                      <th>Năm đóng BHXH</th>
                      <th>Hệ số điều chỉnh</th>
                      <th>Năm đóng BHXH</th>
                      <th>Hệ số điều chỉnh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 17 }, (_, i) => {
                      const rows = [["Trước 1995", 5.81], ...Object.entries(coefficients)],
                        left = rows[i],
                        right = rows[i + 17];
                      return (
                        <tr key={i}>
                          <td>{left[0]}</td>
                          <td>{left[1].toFixed(2)}</td>
                          <td>{right?.[0] || "—"}</td>
                          <td>{right ? right[1].toFixed(2) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </TableScroll>
            </div>
          </div>
        </section>
        <section className="bhxh-comparison">
          <div className="bhxh-section-heading centered">
            <span>GÓC NHÌN TÀI CHÍNH & AN SINH</span>
            <h2>Nên Rút BHXH 1 Lần Hay Tiếp Tục Bảo Lưu Để Nhận Lương Hưu?</h2>
            <p>Cân nhắc nhu cầu hiện tại cùng kế hoạch an sinh dài hạn của bạn.</p>
          </div>
          <div className="bhxh-two-grid">
            <article className="bhxh-card">
              <h3>
                <ShieldCheck />
                Tiếp tục bảo lưu số BHXH
              </h3>
              <ul>
                <li>Giữ thời gian đã đóng để cộng nối khi tiếp tục tham gia.</li>
                <li>Có cơ hội đáp ứng điều kiện nhận lương hưu và chế độ BHYT khi nghỉ hưu.</li>
                <li>Chủ động xây dựng kế hoạch thu nhập lâu dài cùng các nguồn tiết kiệm khác.</li>
              </ul>
              <Link to="/tools">
                Xem các công cụ hỗ trợ tài chính <ArrowRight />
              </Link>
            </article>
            <article className="bhxh-card">
              <h3>
                <Wallet />
                Rút BHXH một lần
              </h3>
              <ul>
                <li>Nhận khoản tiền khi đủ điều kiện để giải quyết nhu cầu tài chính trước mắt.</li>
                <li>
                  Thời gian đã được giải quyết một lần không được cộng lại cho chế độ BHXH sau này.
                </li>
                <li>
                  Nên kiểm tra quyền hưởng, kế hoạch việc làm và phương án bảo lưu trước khi quyết
                  định.
                </li>
              </ul>
              <a href="https://dichvucong.baohiemxahoi.gov.vn/" target="_blank" rel="noreferrer">
                Tra cứu dịch vụ công BHXH <ArrowRight />
              </a>
            </article>
          </div>
        </section>
        <section className="bhxh-procedure">
          <div className="bhxh-section-heading centered">
            <span>HƯỚNG DẪN THỦ TỤC</span>
            <h2>Quy Trình 4 Bước Nhận Tiền BHXH 1 Lần</h2>
            <p>Đối chiếu yêu cầu hồ sơ theo điều kiện hưởng cụ thể của bạn.</p>
          </div>
          <div className="bhxh-four-grid">
            {procedure.map(([Icon, title, description], i) => (
              <article className="bhxh-card" key={title}>
                <span className="bhxh-icon">
                  <Icon />
                </span>
                <span className="bhxh-procedure-step">BƯỚC {i + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
        <nav className="bhxh-sources" aria-label="Nguồn quy định BHXH một lần">
          <a
            href="https://xaydungchinhsach.chinhphu.vn/he-so-dieu-chinh-tien-luong-thu-nhap-thang-da-dong-bao-hiem-xa-hoi-119260206103115775.htm"
            target="_blank"
            rel="noreferrer"
          >
            Hệ số điều chỉnh 2026 ↗
          </a>
          <a
            href="https://xaydungchinhsach.chinhphu.vn/chinh-phu-quy-dinh-chi-tiet-huong-bao-hiem-xa-hoi-mot-lan-119250628072850982.htm"
            target="_blank"
            rel="noreferrer"
          >
            Điều kiện và mức hưởng ↗
          </a>
          <a
            href="https://vanban.chinhphu.vn/?classid=1&docid=214189&orggroupid=2&pageid=27160"
            target="_blank"
            rel="noreferrer"
          >
            Nghị định 158/2025/NĐ-CP ↗
          </a>
        </nav>
        <CareerResources />
      </main>
      <AuthFooter />
    </div>
  );
}
