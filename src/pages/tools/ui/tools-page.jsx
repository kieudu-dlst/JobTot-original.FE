import { useToolScrollTop } from "@/shared/lib/use-tool-scroll-top";
import { Link } from "react-router-dom";
import {
  Calculator,
  ReceiptText,
  ShieldCheck,
  ChartNoAxesCombined,
  FileText,
  BookOpen,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { CareerResources } from "@/widgets/career-resources";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { ServiceNotice } from "@/shared/ui/service-notice";
import { useCandidateSession } from "@/features/authenticate";
import "./tools-page.css";

const tools = [
  {
    icon: Calculator,
    tone: "orange",
    badge: "Gross – Net",
    title: "Tính Lương Gross – Net",
    description:
      "Tham khảo thu nhập thực nhận từ mức lương Gross và các khoản khấu trừ. Chủ động chuẩn bị khi trao đổi mức lương với nhà tuyển dụng.",
    features: ["Phân biệt lương Gross và lương Net", "Tìm hiểu các khoản khấu trừ trên bảng lương"],
    action: "Sử dụng công cụ",
  },
  {
    icon: ReceiptText,
    tone: "blue",
    badge: "Thu nhập cá nhân",
    title: "Tính Thuế Thu Nhập Cá Nhân (TNCN)",
    description:
      "Tìm hiểu cách tính thuế thu nhập cá nhân, các khoản giảm trừ và thông tin cần chuẩn bị để tham khảo nghĩa vụ thuế.",
    features: [
      "Tìm hiểu giảm trừ và người phụ thuộc",
      "Tham khảo thuế trên thu nhập từ tiền lương",
    ],
    action: "Tính thuế TNCN ngay",
  },
  {
    icon: ShieldCheck,
    tone: "green",
    badge: "Quyền lợi lao động",
    title: "Tính Bảo Hiểm Xã Hội Một Lần",
    description:
      "Tìm hiểu thông tin về bảo hiểm xã hội một lần dựa trên quá trình tham gia, thời gian đóng và mức tiền lương đóng bảo hiểm.",
    features: ["Chuẩn bị thông tin quá trình đóng BHXH", "Tìm hiểu hồ sơ và thủ tục liên quan"],
    action: "Ước tính BHXH 1 lần",
  },
  {
    icon: ChartNoAxesCombined,
    tone: "purple",
    badge: "Trợ cấp thất nghiệp",
    title: "Tính Mức Hưởng Bảo Hiểm Thất Nghiệp",
    description:
      "Tìm hiểu điều kiện, thời gian và mức trợ cấp thất nghiệp để chuẩn bị kế hoạch tài chính trong giai đoạn chuyển việc.",
    features: ["Tìm hiểu thời gian đóng bảo hiểm", "Chuẩn bị hồ sơ đề nghị hưởng trợ cấp"],
    action: "Kiểm tra mức trợ cấp",
  },
];
const toolLinks = {
  orange: "/tools/gross-net",
  blue: "/tools/income-tax",
  green: "/tools/social-insurance",
  purple: "/tools/unemployment-insurance",
};
const resources = [
  [Calculator, "4", "Nhóm tiện ích tài chính", "orange"],
  [FileText, "CV Studio", "Mẫu CV chỉnh sửa trực tuyến", "blue"],
  [BookOpen, "Cẩm nang", "Kiến thức nghề nghiệp", "purple"],
  [ShieldCheck, "Miễn phí", "Truy cập tài nguyên ứng viên", "green"],
];
export function ToolsPage() {
  useToolScrollTop();
  const { account, loading } = useCandidateSession();
  return (
    <div className="tools-page companies-page font-roboto">
      <title>Kho tiện ích & Công cụ hỗ trợ ứng viên | Job Tốt</title>
      <AuthHeader userName={account?.fullName} loading={loading} />
      <main className="page-container company-container">
        <PageBreadcrumb current="Tiện ích" />
        <section className="tools-hub-hero">
          <span className="tools-hub-eyebrow">
            <Sparkles /> BỘ CÔNG CỤ & CẨM NANG NGHỀ NGHIỆP 2026
          </span>
          <h1>Trung Tâm Tài Nguyên & Công Cụ Hỗ Trợ Ứng Viên Toàn Diện</h1>
          <p>
            Khám phá các tiện ích về lương, thuế và bảo hiểm, mẫu CV chuyên nghiệp cùng cẩm nang
            phỏng vấn. Chuẩn bị hành trang để tự tin bước vào cơ hội nghề nghiệp tiếp theo.
          </p>
          <div className="tools-hub-stats">
            {resources.map(([Icon, value, label, tone]) => (
              <div key={label} className={`tools-tone-${tone}`}>
                <span className="tools-hub-icon">
                  <Icon />
                </span>
                <div>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="tools-hub-finance" aria-labelledby="tools-finance-title">
          <div className="tools-hub-section-heading">
            <div>
              <span className="tools-hub-eyebrow">
                <ReceiptText /> BỘ TIỆN ÍCH TÀI CHÍNH & QUYỀN LỢI LAO ĐỘNG
              </span>
              <h2 id="tools-finance-title">Công Cụ Tính Lương & Bảo Hiểm Xã Hội</h2>
            </div>
            <p>
              <ShieldCheck /> Chủ động tìm hiểu thu nhập và quyền lợi của bạn
            </p>
          </div>
          <div className="tools-hub-grid">
            {tools.map(({ icon: Icon, ...tool }) => (
              <article key={tool.title} className={`tools-hub-card tools-tone-${tool.tone}`}>
                <div className="tools-hub-card-top">
                  <span className="tools-hub-icon">
                    <Icon />
                  </span>
                  <span className="tools-hub-badge">{tool.badge}</span>
                </div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <ul>
                  {tool.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle2 />
                      {feature}
                    </li>
                  ))}
                </ul>
                {toolLinks[tool.tone] ? (
                  <Link to={toolLinks[tool.tone]} className="tools-hub-action">
                    {tool.action}
                    <ArrowRight />
                  </Link>
                ) : (
                  <ServiceNotice title={tool.title}>
                    <button className="tools-hub-action">
                      {tool.action}
                      <ArrowRight />
                    </button>
                  </ServiceNotice>
                )}
              </article>
            ))}
            <article className="tools-hub-cv-card">
              <span>
                <Sparkles /> JOB TỐT CV STUDIO
              </span>
              <h3>Tạo Hồ Sơ Ứng Tuyển Chuyên Nghiệp</h3>
              <p>
                Chọn mẫu CV phù hợp, chỉnh sửa nội dung, màu sắc và bố cục theo phong cách riêng.
                Lưu CV theo tài khoản và xuất PDF khi sẵn sàng ứng tuyển.
              </p>
              <div>
                <span>
                  <FileText />
                </span>
                Chỉnh sửa trực tiếp • Tự lưu nội dung
                <br />
                Bố cục một cột, hai cột, sidebar và Bento
              </div>
              <Link to="/cv-templates">
                Mở trình tạo CV miễn phí <ExternalLink />
              </Link>
            </article>
          </div>
        </section>
        <CareerResources />
      </main>
      <AuthFooter />
    </div>
  );
}
