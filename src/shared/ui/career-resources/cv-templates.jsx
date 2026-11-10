import {
  ArrowDownToLine,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  FileCheck2,
  FileText,
  LayoutTemplate,
  Palette,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./cv-templates.css";

const benefits = [
  {
    icon: LayoutTemplate,
    title: "Đa dạng ngành nghề",
    description: "Hơn 100 mẫu CV được thiết kế cho nhiều lĩnh vực và cấp bậc.",
    tone: "violet",
  },
  {
    icon: WandSparkles,
    title: "Tùy chỉnh dễ dàng",
    description: "Đổi màu sắc, font chữ và bố cục để CV mang dấu ấn riêng.",
    tone: "coral",
  },
  {
    icon: ArrowDownToLine,
    title: "Tải xuống linh hoạt",
    description: "Xuất hồ sơ PDF chất lượng cao, sẵn sàng gửi nhà tuyển dụng.",
    tone: "mint",
  },
];

const features = [
  {
    icon: FileText,
    title: "Tạo CV Online",
    description: "Hoàn thiện hồ sơ chuyên nghiệp chỉ với vài bước đơn giản.",
    tone: "coral",
  },
  {
    icon: Palette,
    title: "Chỉnh sửa chuyên sâu",
    description: "Tự do thay đổi bố cục, màu sắc và kiểu chữ theo ý muốn.",
    tone: "violet",
  },
  {
    icon: ArrowDownToLine,
    title: "Xuất file PDF",
    description: "Lưu CV sắc nét để ứng tuyển ở bất cứ đâu.",
    tone: "mint",
  },
  {
    icon: Bot,
    title: "Gợi ý nội dung AI",
    description: "Tham khảo cách viết kỹ năng và kinh nghiệm phù hợp.",
    tone: "amber",
  },
  {
    icon: ShieldCheck,
    title: "Kiểm tra CV",
    description: "Rà soát hồ sơ để nội dung rõ ràng và dễ đọc hơn.",
    tone: "blue",
  },
  {
    icon: BriefcaseBusiness,
    title: "Hướng dẫn chi tiết",
    description: "Từng bước hoàn thiện CV phù hợp với vị trí ứng tuyển.",
    tone: "teal",
  },
];

function ResumePreview() {
  return (
    <div className="cv-showcase-art" aria-label="Bản xem trước một mẫu CV chuyên nghiệp">
      <div className="cv-resume-back cv-resume-back-dark" />
      <div className="cv-resume-back cv-resume-back-light" />
      <article className="cv-resume-sheet">
        <header className="cv-resume-person">
          <div className="cv-resume-avatar">LA</div>
          <div className="cv-resume-person-copy">
            <strong>Nguyễn Lan Anh</strong>
            <span>Chuyên viên Marketing</span>
          </div>
          <span className="cv-resume-mark" />
        </header>
        <div className="cv-resume-contact">
          <span>✉&nbsp; lananh@email.com</span>
          <span>⌖&nbsp; Hà Nội, Việt Nam</span>
          <span>☎&nbsp; 090 123 4567</span>
        </div>
        <div className="cv-resume-content">
          <div className="cv-resume-main">
            <section>
              <h4>MỤC TIÊU NGHỀ NGHIỆP</h4>
              <i className="long" /><i /><i className="medium" />
            </section>
            <section>
              <h4>KINH NGHIỆM LÀM VIỆC</h4>
              <b>Marketing Executive</b><i className="medium" />
              <i /><i className="long" /><i className="short" />
            </section>
            <section>
              <h4>HỌC VẤN</h4>
              <b>Đại học Kinh tế Quốc dân</b><i className="medium" />
            </section>
          </div>
          <div className="cv-resume-aside">
            <section>
              <h4>KỸ NĂNG</h4>
              {[
                ["Content", "88%"],
                ["SEO", "74%"],
                ["Social", "82%"],
              ].map(([label, width]) => (
                <div className="cv-resume-skill" key={label}>
                  <span>{label}</span><i><b style={{ width }} /></i>
                </div>
              ))}
            </section>
            <section>
              <h4>NGOẠI NGỮ</h4><i /><i className="medium" />
            </section>
            <section>
              <h4>CHỨNG CHỈ</h4><i className="long" /><i className="medium" />
            </section>
          </div>
        </div>
      </article>
      <div className="cv-showcase-sticker"><Sparkles aria-hidden="true" /><span><strong>500+</strong> mẫu CV đẹp</span></div>
    </div>
  );
}

function FeatureCard({ feature }) {
  const Icon = feature.icon;
  return (
    <Link to="/cv-templates" className={`cv-feature-card cv-tone-${feature.tone}`}>
      <span className="cv-feature-icon"><Icon aria-hidden="true" /></span>
      <span className="cv-feature-arrow"><ArrowRight aria-hidden="true" /></span>
      <strong>{feature.title}</strong>
      <span className="cv-feature-description">{feature.description}</span>
    </Link>
  );
}

export function CvTemplates() {
  return (
    <section className="cv-templates" aria-labelledby="cv-templates-title">
      <div className="cv-templates-heading">
        <div className="cv-templates-copy">
          <p className="cv-templates-eyebrow"><FileText aria-hidden="true" /> MIỄN PHÍ & CHUYÊN NGHIỆP</p>
          <h2 id="cv-templates-title">Kho mẫu CV và <span>công cụ chuyên nghiệp</span></h2>
          <p className="cv-templates-description">
            Hàng trăm mẫu CV hiện đại cùng công cụ hỗ trợ giúp bạn tạo hồ sơ ấn tượng và tự tin chinh phục nhà tuyển dụng.
          </p>
        </div>
        <Link to="/cv-templates" className="cv-templates-primary">
          <LayoutTemplate aria-hidden="true" />
          Tạo CV Online miễn phí
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <div className="cv-templates-content">
        <div className="cv-showcase-panel">
          <ResumePreview />
          <div className="cv-benefits">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div className={`cv-benefit cv-tone-${benefit.tone}`} key={benefit.title}>
                  <span className="cv-benefit-icon"><Icon aria-hidden="true" /></span>
                  <div><strong>{benefit.title}</strong><p>{benefit.description}</p></div>
                </div>
              );
            })}
            <Link to="/cv-templates" className="cv-showcase-link">Xem tất cả mẫu CV <ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="cv-features-grid">
          {features.map((feature) => <FeatureCard feature={feature} key={feature.title} />)}
        </div>
      </div>
    </section>
  );
}
