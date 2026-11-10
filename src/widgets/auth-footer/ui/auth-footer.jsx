import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { ServiceNotice } from "@/shared/ui/service-notice";

const candidateLinks = [
  "Tạo CV chuyên nghiệp AI",
  "Công cụ tính lương Gross - Net",
  "Cẩm nang & Lộ trình nghề nghiệp",
  "Báo cáo thị trường tuyển dụng 2026",
];
const employerLinks = [
  "Đăng tin tuyển dụng",
  "Tìm hồ sơ ứng viên chuẩn AI",
  "Giải pháp Employer Branding",
  "Bảng giá dịch vụ tuyển dụng",
  "Quy chế xác thực doanh nghiệp",
];

export function AuthFooter() {
  return (
    <footer className="site-footer min-h-[430px] bg-auth-surface-footer text-auth-text-footer">
      <div className="mx-auto max-w-[1284px] px-[34px] pt-16 pb-12 max-[700px]:px-5 max-[700px]:pt-10 max-[700px]:pb-8">
        <div className="grid grid-cols-[480px_230px_1fr] gap-6 max-[1150px]:grid-cols-[2fr_1fr_1.3fr] max-[950px]:grid-cols-2 max-[950px]:gap-8 max-[700px]:gap-x-4 max-[700px]:gap-y-7 [&>section:not(:first-child)]:flex [&>section:not(:first-child)]:flex-col [&>section:not(:first-child)]:items-start [&>section:not(:first-child)]:gap-[7px] [&_h2]:mb-[7px] [&_h2]:text-base [&_h2]:font-bold [&_h2]:tracking-[0.2px] [&_h2]:text-auth-text-footer-heading max-[700px]:[&_h2]:text-base [&>section:not(:first-child)_a]:text-base [&>section:not(:first-child)_button]:text-base [&>section:not(:first-child)_a]:leading-[19px] [&>section:not(:first-child)_button]:leading-[19px] [&_button]:text-left max-[700px]:[&>section:not(:first-child)_a]:text-xs max-[700px]:[&>section:not(:first-child)_button]:text-xs [&_button:hover]:text-white [&_a:hover]:text-white">
          <section className="max-[950px]:col-span-full max-[950px]:max-w-[520px] [&>p]:mb-6 [&>p]:text-base [&>p]:leading-[19px] [&_address]:grid [&_address]:gap-2.5 [&_address]:text-base [&_address]:leading-[17px] [&_address]:not-italic [&_address>*]:flex [&_address>*]:items-start [&_address>*]:gap-2 [&_address_strong]:-ml-[5px] [&_address_strong]:font-semibold [&_address_strong]:text-auth-text-footer-link [&_address_svg]:size-4 [&_address_svg]:text-auth-orange">
            <BrandLogo footer />
            <p>
              Công ty Cổ phần Job Tốt Toàn Cầu – Nền tảng tuyển dụng thông minh tích hợp trí tuệ
              nhân tạo (AI) giúp tối ưu hóa hành trình phát triển sự nghiệp của người lao động Việt
              Nam.
            </p>
            <address>
              <span>
                <MapPin />
                Tầng 12, Tòa nhà Sông Đà, Đường Phạm Hùng, Phường Mỹ Đình 1, Quận Nam Từ Liêm, Hà
                Nội
              </span>
              <a href="tel:0356520207">
                <Phone />
                Hotline 24/7: <strong>0356.520.207</strong>
              </a>
              <a href="mailto:kieuhuyentrang2007@gmail.com">
                <Mail />
                Email: <strong>kieuhuyentrang2007@gmail.com</strong>
              </a>
            </address>
          </section>
          <section>
            <h2>Dành cho Ứng viên</h2>
            <Link to="/jobs">Tìm việc làm mới nhất</Link>
            {candidateLinks.map((label) => (
              <ServiceNotice key={label} title={label}>
                <button>{label}</button>
              </ServiceNotice>
            ))}
          </section>
          <section>
            <h2>Dành cho Nhà tuyển dụng</h2>
            {employerLinks.map((label) =>
              label === "Tìm hồ sơ ứng viên chuẩn AI" ? (
                <Link key={label} to="/employer/discover">
                  Tìm hồ sơ ứng viên
                </Link>
              ) : (
                <ServiceNotice key={label} title={label}>
                  <button>{label}</button>
                </ServiceNotice>
              ),
            )}
          </section>
        </div>
        <div className="mt-[50px] border-t border-auth-border-footer pt-7 text-xs font-semibold max-[700px]:mt-8">
          © 2026 Job Tốt Toàn Cầu
        </div>
      </div>
    </footer>
  );
}
