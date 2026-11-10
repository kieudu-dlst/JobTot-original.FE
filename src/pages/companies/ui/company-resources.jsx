import { Link } from "react-router-dom";
import { BadgeCheck, Flame, ShieldCheck, Building2 } from "lucide-react";
import { ServiceNotice } from "@/shared/ui/service-notice";

export function CompanyResources() {
  return (
    <section className="company-resources">
      <div className="company-employer-banner">
        <div>
          <span>
            <Flame />
            DÀNH RIÊNG CHO NHÀ TUYỂN DỤNG
          </span>
          <h2>Bạn là Doanh nghiệp tuyển dụng? Tiếp cận ứng viên chất lượng cao</h2>
          <p>
            Đăng tin tuyển dụng không giới hạn, kết nối nhân tài và xây dựng thương hiệu tuyển dụng
            chuyên nghiệp cùng Job Tốt.
          </p>
        </div>
        <div>
          <Link className="company-primary" to="/register?role=employer">
            <Building2 />
            Đăng tin tuyển dụng miễn phí
          </Link>
          <ServiceNotice title="Gói Doanh nghiệp VIP">
            <button className="company-light-button">Đăng ký Gói Doanh nghiệp VIP</button>
          </ServiceNotice>
        </div>
      </div>
      <div className="company-safety">
        <ShieldCheck />
        <div>
          <h2>
            Cam kết minh bạch & An toàn tuyệt đối tại Job Tốt{" "}
            <span>
              <BadgeCheck />
              ĐÃ XÁC THỰC
            </span>
          </h2>
          <p>
            Kiểm tra thông tin doanh nghiệp, bảo vệ dữ liệu cá nhân và lựa chọn cơ hội việc làm phù
            hợp.
          </p>
          <p>
            Không chuyển tiền cho nhà tuyển dụng để được nhận việc. Cần hỗ trợ? Liên hệ hotline
            0356.520.207.
          </p>
        </div>
        <ServiceNotice title="Chính sách An toàn">
          <button className="company-text-button">Chính sách An toàn 24/7</button>
        </ServiceNotice>
      </div>
    </section>
  );
}
