import { Calculator, ReceiptText, Shield, ChartNoAxesCombined, ArrowRight } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Link } from "react-router-dom";
import { ServiceNotice } from "@/shared/ui/service-notice";
import { Button } from "@/shared/ui/button";
import "./career-tools.css";

const tools = [
  {
    icon: Calculator,
    title: "Tính lương Gross - Net",
    href: "/tools/gross-net",
    description: (
      <>
        Công cụ quy đổi lương Gross sang Net
        <br />
        và ngược lại chuẩn xác theo quy định mới nhất.
      </>
    ),
  },
  {
    icon: ReceiptText,
    title: "Tính thuế thu nhập cá nhân",
    href: "/tools/income-tax",
    description: "Tính chi tiết mức thuế TNCN phải nộp kèm các khoản giảm trừ gia cảnh.",
  },
  {
    icon: Shield,
    title: "Tính bảo hiểm xã hội một lần",
    href: "/tools/social-insurance",
    description: "Dự tính số tiền BHXH một lần có thể nhận dựa trên thời gian và mức đóng.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Tính bảo hiểm thất nghiệp",
    href: "/tools/unemployment-insurance",
    description: (
      <>
        Tra cứu điều kiện và mức hưởng trợ cấp
        <br />
        thất nghiệp hàng tháng chính xác.
      </>
    ),
  },
];

function CareerToolCard({ tool }) {
  const Icon = tool.icon;
  const action = (
    <Button
      asChild={!!tool.href}
      variant="ghost"
      className="mt-[18px] flex h-[31px] w-full justify-between rounded-none border-t border-auth-border-subtle px-0 pt-3 pb-0 text-xs font-bold text-auth-orange hover:bg-transparent hover:text-auth-brand-strong"
    >
      {tool.href ? (
        <Link to={tool.href}>
          Dùng ngay
          <ArrowRight />
        </Link>
      ) : (
        <>
          Dùng ngay
          <ArrowRight />
        </>
      )}
    </Button>
  );
  return (
    <Card className="flex h-[282px] gap-0 rounded-2xl border border-auth-border-card bg-white p-6 shadow-[0_1px_2px_var(--color-auth-shadow-card)] max-[1150px]:p-5 max-[950px]:h-[260px] max-[700px]:h-[285px] max-[700px]:p-4 max-[380px]:h-[255px]">
      <div className="mb-[18px] flex items-center justify-between max-[700px]:gap-[5px] [&>span:first-child]:size-12 max-[700px]:[&>span:first-child]:size-[38px]">
        <span className="inline-grid size-[46px] shrink-0 place-items-center rounded-[14px] [&_svg]:size-[23px] [&_svg]:stroke-2 bg-auth-surface-brand-soft text-auth-orange">
          <Icon aria-hidden="true" />
        </span>
        <span className="rounded-[20px] bg-auth-surface-brand px-2.5 py-[3px] text-xs font-semibold text-auth-orange max-[700px]:px-1.5 max-[700px]:text-xs">
          Miễn phí
        </span>
      </div>
      <div className="mt-auto [&_h3]:mb-2 [&_h3]:text-base [&_h3]:leading-[21px] [&_h3]:font-bold [&_h3]:tracking-[-0.4px] max-[700px]:[&_h3]:text-sm [&_p]:m-0 [&_p]:min-h-[65px] [&_p]:text-base [&_p]:leading-[21px] [&_p]:text-auth-text-body max-[700px]:[&_p]:text-xs max-[700px]:[&_p]:leading-[18px]">
        <h3>{tool.title}</h3>
        <p>{tool.description}</p>
      </div>
      {tool.href ? action : <ServiceNotice title={tool.title}>{action}</ServiceNotice>}
    </Card>
  );
}

export function CareerTools() {
  return (
    <section
      className="career-tools mt-24 max-[950px]:mt-16 max-[700px]:mt-12"
      aria-labelledby="tools-heading"
    >
      <div className="mb-8 grid grid-cols-[3fr_2fr] items-end gap-10 max-[950px]:grid-cols-2 max-[950px]:gap-[25px] max-[700px]:mb-6 max-[700px]:grid-cols-1 max-[700px]:gap-4 [&_h2]:mt-3 [&_h2]:text-3xl [&_h2]:leading-[34px] [&_h2]:font-bold [&_h2]:tracking-[-0.9px] max-[1150px]:[&_h2]:text-2xl max-[700px]:[&_h2]:leading-8 [&_p]:mb-[7px] [&_p]:text-sm [&_p]:leading-5 [&_p]:text-auth-text-description max-[700px]:[&_p]:m-0">
        <div>
          <span className="rounded-[20px] bg-auth-info-surface px-3 py-1 text-xs font-extrabold tracking-[0.3px] text-auth-info">
            HÀNH TRANG SỰ NGHIỆP
          </span>
          <h2 id="tools-heading">Kho tiện ích hỗ trợ ứng viên chuẩn 2026</h2>
        </div>
        <p>
          Các công cụ miễn phí 100% giúp bạn chủ động đo lường giá trị bản thân, tính toán thu nhập
          và hoạch định lộ trình.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-5 max-[950px]:grid-cols-2 max-[700px]:gap-3.5 max-[380px]:grid-cols-1">
        {tools.map((tool) => (
          <CareerToolCard key={tool.title} tool={tool} />
        ))}
      </div>
    </section>
  );
}
