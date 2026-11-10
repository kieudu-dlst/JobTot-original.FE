import { Table, TableScroll } from "@/shared/ui/table";
import { useToolScrollTop } from "@/shared/lib/use-tool-scroll-top";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  BriefcaseBusiness,
  FileText,
  Wallet,
  Sparkles,
  TriangleAlert,
  CalendarClock,
} from "lucide-react";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerResources } from "@/widgets/career-resources";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { useCandidateSession } from "@/features/authenticate";
import { calculateUnemployment, benefitDuration, regions } from "../model/unemployment";
import "./unemployment-page.css";

const money = (value) => Math.round(value).toLocaleString("vi-VN");
const initialInput = {
  averageSalary: 10000000,
  region: 0,
  totalMonths: 36,
  recentMonths: 12,
  shortContract: false,
  lawfulTermination: true,
  filedInTime: true,
  waitingCondition: true,
};
const sources = [
  [
    "Luật Việc làm 2025 • Điều 38–40",
    "https://xaydungchinhsach.chinhphu.vn/toan-van-luat-viec-lam-119250711173403835.htm",
  ],
  [
    "Nghị định 374/2025/NĐ-CP",
    "https://vanban.chinhphu.vn/?classid=1&docid=216493&pageid=27160&typegroupid=4",
  ],
  [
    "Lương tối thiểu vùng 2026",
    "https://xaydungchinhsach.chinhphu.vn/nghi-dinh-so-293-2025-nd-cp-quy-dinh-muc-luong-toi-thieu-doi-voi-nguoi-lao-dong-lam-viec-theo-hop-dong-lao-dong-119251110172808433.htm",
  ],
];
const calculationSteps = [
  [
    "Tính lương bình quân 6 tháng",
    "Lấy tổng lương đóng BHTN của 6 tháng có đóng gần nhất trước khi nghỉ việc, chia cho 6.",
    "MBQTL = tổng 6 tháng / 6",
  ],
  [
    "Nhân 60% và kiểm tra trần",
    "Mức hưởng mỗi tháng bằng 60% lương bình quân, giới hạn theo vùng đóng bảo hiểm.",
    "Mỗi tháng = min(60% × MBQTL, trần)",
  ],
  [
    "Tính số tháng được hưởng",
    "Từ 12 đến 36 tháng đóng: hưởng 3 tháng. Sau đó, mỗi 12 tháng đóng thêm được 1 tháng hưởng.",
    "Tối đa 12 tháng trợ cấp",
  ],
  [
    "Tổng tiền và tìm việc mới",
    "Nhân mức hưởng mỗi tháng với số tháng hưởng; thực hiện thông báo tìm kiếm việc làm hằng tháng.",
    "Tổng dự kiến = mức tháng × số tháng",
  ],
];
const processSteps = [
  [
    FileText,
    "Nhận giấy tờ nghỉ việc & xác nhận BHTN",
    "Chuẩn bị giấy tờ chấm dứt hợp đồng và thông tin quá trình đóng BHTN được xác nhận.",
    "Kiểm tra quá trình đóng trước khi nộp hồ sơ.",
  ],
  [
    ShieldCheck,
    "Nộp hồ sơ hưởng trợ cấp",
    "Nộp đủ hồ sơ tại tổ chức dịch vụ việc làm công theo hướng dẫn của địa phương.",
    "Trong 3 tháng kể từ ngày chấm dứt hợp đồng.",
  ],
  [
    BriefcaseBusiness,
    "Nhận quyết định hưởng BHTN",
    "Hồ sơ được xem xét theo điều kiện hưởng; thời điểm bắt đầu hưởng là ngày làm việc thứ 11 từ ngày nộp đủ hồ sơ.",
    "Giải quyết trong 15 ngày làm việc khi nhận đủ hồ sơ.",
  ],
  [
    Wallet,
    "Nhận trợ cấp & thông báo tìm việc",
    "Theo dõi quyết định, lịch chi trả và lịch thông báo tìm kiếm việc làm tại nơi hưởng trợ cấp.",
    "Thông báo tìm kiếm việc làm hằng tháng.",
  ],
];

export function UnemploymentPage() {
  useToolScrollTop();
  const { account, loading } = useCandidateSession();
  const [salary, setSalary] = useState("10000000");
  const [years, setYears] = useState(3);
  const [months, setMonths] = useState(0);
  const [options, setOptions] = useState(initialInput);
  const [result, setResult] = useState(() => calculateUnemployment(initialInput));
  const [error, setError] = useState("");
  const input = {
    ...options,
    averageSalary: Number(salary),
    totalMonths: Number(years) * 12 + Number(months),
  };
  const stale = JSON.stringify(input) !== JSON.stringify(result.input);
  function patch(value) {
    setOptions((previous) => ({ ...previous, ...value }));
  }
  function calculate(event) {
    event.preventDefault();
    try {
      if (
        years === "" ||
        months === "" ||
        !Number.isInteger(Number(years)) ||
        !Number.isInteger(Number(months)) ||
        Number(years) < 0 ||
        Number(months) < 0 ||
        Number(months) > 11
      )
        throw new Error("Nhập số năm không âm và số tháng lẻ từ 0 đến 11.");
      setResult(calculateUnemployment(input));
      setError("");
    } catch (failure) {
      setError(failure.message);
    }
  }
  return (
    <div className="unemployment-page companies-page font-roboto">
      <title>Tính mức hưởng bảo hiểm thất nghiệp 2026 | Job Tốt</title>
      <AuthHeader userName={account?.fullName} loading={loading} />
      <main className="page-container company-container">
        <PageBreadcrumb
          parents={[{ to: "/tools", label: "Ti\u1ec7n \u00edch" }]}
          current="Tính bảo hiểm thất nghiệp 2026"
        />
        <section className="bhtn-hero">
          <span>
            <Sparkles /> CHÍNH SÁCH ÁP DỤNG NĂM 2026
          </span>
          <h1>
            Công Cụ Tính Mức Hưởng{" "}
            <em>
              Bảo Hiểm Thất Nghiệp
              <br />
              (BHTN)
            </em>{" "}
            Chuẩn 2026
          </h1>
          <p>
            Ước tính trợ cấp thất nghiệp hằng tháng, thời gian hưởng và tổng tiền dự kiến.
            <br />
            Chủ động chuẩn bị hồ sơ và tìm cơ hội việc làm mới.
          </p>
        </section>
        <div className="bhtn-calculator-grid">
          <form className="bhtn-card bhtn-form" onSubmit={calculate}>
            <div className="bhtn-card-heading">
              <span className="bhtn-icon">
                <Calculator />
              </span>
              <div>
                <h2>Thiết Lập Thông Tin Hưởng BHTN</h2>
                <p>Nhập dữ liệu đóng bảo hiểm của bạn để tính dự kiến.</p>
              </div>
              <span className="bhtn-private">Chỉ tính trên máy</span>
            </div>
            <fieldset className="bhtn-regions">
              <legend>1. Chọn vùng đóng BHTN ở tháng cuối (2026)</legend>
              <div>
                {regions.map((minimum, index) => (
                  <label key={minimum} className={options.region === index ? "is-selected" : ""}>
                    <input
                      type="radio"
                      name="region"
                      checked={options.region === index}
                      onChange={() => patch({ region: index })}
                    />
                    <span>
                      <strong>Vùng {["I", "II", "III", "IV"][index]}</strong>
                      <small>LTT: {money(minimum)} đ</small>
                      <small>Trần: {money(minimum * 5)} đ</small>
                    </span>
                  </label>
                ))}
              </div>
              <p>
                Trần hưởng bằng 5 lần lương tối thiểu vùng. Công cụ dùng mức vùng có hiệu lực từ
                01/01/2026.
              </p>
            </fieldset>
            <label className="bhtn-field">
              2. Lương bình quân 6 tháng đóng BHTN gần nhất
              <span className="bhtn-money">
                <input
                  aria-label="Lương bình quân 6 tháng"
                  type="text"
                  inputMode="numeric"
                  required
                  value={salary === "" ? "" : money(Number(salary))}
                  onChange={(event) => {
                    const value = event.target.value.replace(/[.,\s]/g, "");
                    if (/^\d{0,10}$/.test(value)) setSalary(value);
                  }}
                />
                <span>VND</span>
              </span>
            </label>
            <div className="bhtn-presets">
              {[6000000, 8000000, 10000000, 15000000, 20000000, 30000000].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={Number(salary) === value}
                  onClick={() => setSalary(String(value))}
                >
                  {money(value)}
                </button>
              ))}
            </div>
            <fieldset className="bhtn-duration">
              <legend>3. Thời gian đóng BHTN chưa hưởng</legend>
              <div>
                <label>
                  Số năm
                  <input
                    aria-label="Số năm đóng chưa hưởng"
                    type="number"
                    required
                    min="0"
                    max="60"
                    step="1"
                    value={years}
                    onChange={(event) => setYears(event.target.value)}
                  />
                </label>
                <label>
                  Tháng lẻ
                  <input
                    aria-label="Tháng lẻ đóng chưa hưởng"
                    type="number"
                    required
                    min="0"
                    max="11"
                    step="1"
                    value={months}
                    onChange={(event) => setMonths(event.target.value)}
                  />
                </label>
              </div>
              <div className="bhtn-duration-presets">
                {[12, 36, 60, 144].map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={input.totalMonths === value}
                    onClick={() => {
                      setYears(value / 12);
                      setMonths(0);
                    }}
                  >
                    {" "}
                    {value} tháng
                  </button>
                ))}
              </div>
              <p className="bhtn-note">
                <CheckCircle2 />
                Chỉ tính thời gian đóng còn được xác nhận để xét lần hưởng này; không nhập lại thời
                gian đã hưởng trước đó.
              </p>
            </fieldset>
            <fieldset className="bhtn-conditions">
              <legend>4. Kiểm tra điều kiện hưởng</legend>
              <label className="bhtn-contract">
                <input
                  type="checkbox"
                  checked={options.shortContract}
                  onChange={(event) => patch({ shortContract: event.target.checked })}
                />
                Hợp đồng từ đủ 1 tháng đến dưới 12 tháng
              </label>
              <label className="bhtn-field bhtn-recent">
                Số tháng đóng trong {options.shortContract ? 36 : 24} tháng trước khi nghỉ việc
                <input
                  aria-label="Số tháng đóng gần đây"
                  type="number"
                  required
                  min="0"
                  max={options.shortContract ? 36 : 24}
                  step="1"
                  value={options.recentMonths}
                  onChange={(event) =>
                    patch({
                      recentMonths: event.target.value === "" ? "" : Number(event.target.value),
                    })
                  }
                />
              </label>
              <div className="bhtn-checks">
                {[
                  [
                    "lawfulTermination",
                    "Chấm dứt hợp đồng đúng luật, chưa đủ điều kiện hưởng lương hưu",
                  ],
                  ["filedInTime", "Nộp đủ hồ sơ trong 3 tháng từ ngày chấm dứt hợp đồng"],
                  [
                    "waitingCondition",
                    "Trong 10 ngày làm việc từ khi nộp đủ hồ sơ, không có việc làm thuộc BHXH bắt buộc và không thuộc trường hợp loại trừ",
                  ],
                ].map(([key, label]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={options[key]}
                      onChange={(event) => patch({ [key]: event.target.checked })}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <p>
                Các trường hợp loại trừ: nghĩa vụ quân sự/công an/dân quân thường trực, học trên 12
                tháng, cơ sở giáo dục hoặc cai nghiện bắt buộc, tạm giam/phạt tù, định cư nước ngoài
                hoặc chết.
              </p>
            </fieldset>
            {error && (
              <p className="bhtn-error" role="alert">
                {error}
              </p>
            )}
            <button className="bhtn-submit">
              <Calculator /> TÍNH MỨC HƯỞNG BHTN NGAY
            </button>
          </form>
          <div className="bhtn-result-column">
            <section className="bhtn-card bhtn-result" aria-label="Kết quả tính BHTN">
              <div className="bhtn-result-status">
                <CheckCircle2 />
                {result.eligible
                  ? "Theo điều kiện bạn đã xác nhận"
                  : "Chưa đáp ứng điều kiện đã nhập"}
              </div>
              {stale && (
                <p className="bhtn-stale" role="status">
                  Thông tin đã thay đổi. Bấm tính để cập nhật kết quả.
                </p>
              )}
              <div className="bhtn-total">
                <h2>TỔNG TRỢ CẤP DỰ KIẾN TOÀN BỘ ĐỢT</h2>
                <strong aria-live="polite">
                  {money(result.total)} <small>VND</small>
                </strong>
                <p>Ước tính nếu hưởng đủ số tháng và tiếp tục đáp ứng điều kiện.</p>
              </div>
              <div className="bhtn-result-stats">
                <article>
                  <span>Trợ cấp mỗi tháng (60%)</span>
                  <strong>{money(result.monthly)} đ</strong>
                  <small>Trần vùng: {money(result.cap)} đ</small>
                </article>
                <article>
                  <span>Thời gian hưởng trợ cấp</span>
                  <strong>{result.duration} tháng</strong>
                  <small>Tối đa 12 tháng</small>
                </article>
              </div>
              <p className="bhtn-formula">
                Mức tháng = min(60% × {money(result.input.averageSalary)}, {money(result.cap)})
                {result.capped && <span>Đã áp dụng trần hưởng vùng.</span>}
              </p>
              {!result.eligible && (
                <div className="bhtn-ineligible" role="status">
                  <h3>Cần kiểm tra lại điều kiện</h3>
                  <ul>
                    {result.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  <p>
                    Mức theo công thức khi đủ điều kiện: {money(result.projectedMonthly)} đ/tháng ×{" "}
                    {result.projectedDuration} tháng. Đây chưa phải khoản được xác nhận hưởng.
                  </p>
                </div>
              )}
              <h3>QUYỀN LỢI ĐI KÈM & TRÁCH NHIỆM</h3>
              <ul className="bhtn-benefits">
                <li>
                  <ShieldCheck />
                  <div>
                    <strong>Bảo hiểm y tế trong thời gian hưởng</strong>
                    <p>Quỹ BHTN đóng BHYT theo quy định trong thời gian hưởng trợ cấp.</p>
                  </div>
                </li>
                <li>
                  <GraduationCap />
                  <div>
                    <strong>Hỗ trợ đào tạo, nâng cao kỹ năng</strong>
                    <p>
                      Học phí và tiền ăn được hỗ trợ theo điều kiện và quyết định của cơ quan có
                      thẩm quyền.
                    </p>
                  </div>
                </li>
                <li>
                  <BriefcaseBusiness />
                  <div>
                    <strong>Tư vấn & giới thiệu việc làm</strong>
                    <p>Thực hiện thông báo tìm kiếm việc làm hằng tháng tại nơi hưởng trợ cấp.</p>
                  </div>
                </li>
              </ul>
              <Link className="bhtn-submit" to="/jobs">
                Tìm việc làm mới cùng Job Tốt <ArrowRight />
              </Link>
            </section>
            <p className="bhtn-result-footnote">
              <ShieldCheck />
              Công cụ tham khảo cho hồ sơ năm 2026; kết quả chính thức do cơ quan có thẩm quyền
              quyết định. Dữ liệu không gửi lên máy chủ.
            </p>
          </div>
        </div>
        <section className="bhtn-explanation">
          <div className="bhtn-section-heading centered">
            <span>CÔNG THỨC & NGUYÊN TẮC TÍNH</span>
            <h2>4 Bước Xác Định Mức Hưởng BHTN Của Người Lao Động</h2>
            <p>Từng bước từ tiền lương đóng bảo hiểm đến tổng trợ cấp dự kiến.</p>
          </div>
          <div className="bhtn-four-grid">
            {calculationSteps.map(([title, description, formula], i) => (
              <article className="bhtn-card" key={title}>
                <span className="bhtn-step-number">{i + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <small>{formula}</small>
              </article>
            ))}
          </div>
        </section>
        <section className="bhtn-reference">
          <div className="bhtn-section-heading">
            <span>TRA CỨU DỮ LIỆU PHÁP ĐỊNH</span>
            <h2>Bảng Tra Cứu Trần Mức Hưởng & Quy Đổi Thời Gian 2026</h2>
          </div>
          <div className="bhtn-reference-grid">
            <article className="bhtn-card">
              <h3>
                <BriefcaseBusiness />
                Mức trần BHTN theo vùng
              </h3>
              <p>Áp dụng mức lương tối thiểu tháng năm 2026.</p>
              <TableScroll label="Mức trần bảo hiểm thất nghiệp" className="bhtn-table-scroll">
                <Table aria-label="Mức trần bảo hiểm thất nghiệp">
                  <thead>
                    <tr>
                      <th>Khu vực vùng</th>
                      <th>Lương tối thiểu</th>
                      <th>Trần hưởng BHTN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regions.map((minimum, i) => (
                      <tr key={minimum} className={result.input.region === i ? "highlight" : ""}>
                        <td>Vùng {["I", "II", "III", "IV"][i]}</td>
                        <td>{money(minimum)} đ</td>
                        <td>{money(minimum * 5)} đ/tháng</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableScroll>
              <p className="bhtn-note">
                <CheckCircle2 />
                Chọn vùng theo địa bàn đóng BHTN, đối chiếu phụ lục Nghị định 293/2025/NĐ-CP.
              </p>
            </article>
            <article className="bhtn-card">
              <h3>
                <CalendarClock />
                Quy đổi thời gian đóng & số tháng hưởng
              </h3>
              <p>Tính trên thời gian đóng chưa hưởng được xác nhận.</p>
              <TableScroll label="Thời gian hưởng trợ cấp" className="bhtn-table-scroll">
                <Table aria-label="Thời gian hưởng trợ cấp">
                  <thead>
                    <tr>
                      <th>Thời gian đóng BHTN</th>
                      <th>Số tháng hưởng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [0, "Dưới 12 tháng"],
                      [12, "Từ 12 đến 36 tháng"],
                      [48, "Từ 48 đến 59 tháng"],
                      [60, "Từ 60 đến 71 tháng"],
                      [72, "Từ 72 đến 83 tháng"],
                      [84, "Từ 84 đến 95 tháng"],
                      [132, "Từ 132 đến 143 tháng"],
                      [144, "Từ 144 tháng trở lên"],
                    ].map(([months, label]) => (
                      <tr key={label}>
                        <td>{label}</td>
                        <td className="bhtn-orange">{benefitDuration(months)} tháng</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableScroll>
              <p className="bhtn-note">
                <CheckCircle2 />
                37–47 tháng vẫn hưởng 3 tháng; cứ đủ thêm 12 tháng mới tăng 1 tháng hưởng.
              </p>
            </article>
          </div>
        </section>
        <section className="bhtn-process">
          <div className="bhtn-section-heading">
            <span>HƯỚNG DẪN THỦ TỤC THỰC TẾ</span>
            <h2>Quy Trình 4 Bước Nộp Hồ Sơ Hưởng BHTN</h2>
            <p>Nộp hồ sơ trong 3 tháng từ ngày chấm dứt hợp đồng.</p>
          </div>
          <div className="bhtn-four-grid">
            {processSteps.map(([Icon, title, description, note], i) => (
              <article className={`bhtn-card bhtn-process-${i}`} key={title}>
                <div className="bhtn-process-top">
                  <span className="bhtn-icon">
                    <Icon />
                  </span>
                  <span>BƯỚC {i + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <small>{note}</small>
              </article>
            ))}
          </div>
        </section>
        <section className="bhtn-faq" aria-label="Lưu ý về bảo hiểm thất nghiệp">
          {[
            [
              TriangleAlert,
              "Quá hạn 3 tháng có được hưởng?",
              "Không đáp ứng thời hạn hồ sơ cho lần nghỉ việc này. Liên hệ tổ chức dịch vụ việc làm công để kiểm tra thời gian đóng còn được ghi nhận cho lần xét sau.",
            ],
            [
              BriefcaseBusiness,
              "Thông báo tìm kiếm việc làm",
              "Theo dõi lịch hẹn trong quyết định hưởng. Khi có việc làm hoặc thay đổi tình trạng, thông báo kịp thời cho nơi giải quyết hồ sơ.",
            ],
            [
              GraduationCap,
              "Hỗ trợ học nghề & nâng cao kỹ năng",
              "Đề nghị tổ chức dịch vụ việc làm công hướng dẫn điều kiện, hồ sơ và khóa đào tạo được hỗ trợ.",
            ],
          ].map(([Icon, title, description]) => (
            <article className="bhtn-card" key={title}>
              <h3>
                <Icon />
                {title}
              </h3>
              <p>{description}</p>
            </article>
          ))}
        </section>
        <nav className="bhtn-sources" aria-label="Nguồn quy định BHTN">
          {sources.map(([title, href]) => (
            <a key={title} href={href} target="_blank" rel="noreferrer">
              {title} ↗
            </a>
          ))}
        </nav>
        <CareerResources />
      </main>
      <AuthFooter />
    </div>
  );
}
