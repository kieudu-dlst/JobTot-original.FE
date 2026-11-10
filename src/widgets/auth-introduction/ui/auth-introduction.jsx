import { useDemoDataset } from "@/shared/api/use-demo-dataset";
import { Card } from "@/shared/ui/card";
import { benefits } from "../model/content";

function CareerStats({ stats }) {
  return (
    <Card className="mt-[33px] grid h-[88px] grid-cols-3 gap-0 rounded-2xl border bg-white px-4 py-[15px] shadow-none max-[700px]:mt-6 [&>div]:flex [&>div]:flex-col [&>div]:justify-center [&>div]:p-2 [&>div+div]:border-l [&>div+div]:border-auth-border-divider text-base  [&_strong]:text-xl [&_span]: [&_span]:text-auth-text-secondary">
      {stats.map(([value, label, tone]) => (
        <div key={label}>
          <strong
            className={
              {
                orange: "text-auth-orange",
                green: "text-auth-success",
                purple: "text-auth-purple-stat",
              }[tone]
            }
          >
            {value}
          </strong>
          <span>{label}</span>
        </div>
      ))}
    </Card>
  );
}

function BenefitCard({ item }) {
  const Icon = item.icon;
  return (
    <Card className="flex min-h-24 flex-row items-start gap-4 rounded-xl border bg-white p-[15px] shadow-[0_1px_2px_var(--color-auth-shadow-soft)] max-[950px]:gap-2.5 max-[950px]:p-3 [&_h2]:mt-0 [&_h2]:mb-[7px] [&_h2]:text-base [&_h2]:leading-[21px] [&_h2]:font-bold [&_h2]:tracking-normal max-[1150px]:[&_h2]:text-base max-[700px]:[&_h2]:text-sm [&_p]:m-0 [&_p]:text-base [&_p]: [&_p]:text-auth-muted">
      <span
        className={`inline-grid size-[46px] shrink-0 place-items-center rounded-[14px] [&_svg]:size-[23px] [&_svg]:stroke-2 ${{ purple: "bg-auth-purple-surface text-auth-purple", green: "bg-auth-success-surface text-auth-success", orange: "bg-auth-surface-brand-soft text-auth-orange" }[item.tone]}`}
      >
        <Icon aria-hidden="true" />
      </span>
      <div>
        <h2>
          {item.title}{" "}
          <span
            className={`ml-1 inline-block whitespace-nowrap rounded-[20px] px-2 align-middle text-xs leading-[17px] tracking-normal max-[1150px]:ml-0 ${{ purple: "bg-auth-purple text-white", orange: "bg-auth-surface-brand-badge text-auth-text-brand", green: "bg-auth-success-surface text-auth-success" }[item.tone]}`}
          >
            {item.badge}
          </span>
        </h2>
        <p>{item.description}</p>
      </div>
    </Card>
  );
}

function CandidateTestimonial({ testimony }) {
  return (
    <Card className="mt-6 min-h-[164px] gap-3 rounded-2xl border bg-white p-5 shadow-[0_1px_2px_var(--color-auth-shadow-soft)] max-[700px]:p-4 [&_blockquote]:m-0 [&_blockquote]:text-base [&_blockquote]:leading-[19px] [&_blockquote]:italic [&_blockquote]:text-auth-muted">
      <div className="flex items-center gap-3 max-[950px]:flex-wrap max-[700px]:flex-nowrap [&_img]:size-12 [&_img]:rounded-full [&_img]:object-cover [&_strong]:text-sm [&_strong]:font-bold [&_p]:m-0 [&_p]:text-base [&_p]:text-auth-muted max-[700px]:[&_p]:text-xs">
        <img src={testimony.image} alt={testimony.name} />
        <div>
          <strong>{testimony.name}</strong>
          <p>{testimony.role}</p>
        </div>
        <span
          className="ml-auto whitespace-nowrap text-xl tracking-[-2px] text-auth-rating max-[1150px]:text-base max-[950px]:ml-[60px] max-[700px]:ml-auto max-[380px]:hidden"
          aria-label="5 trên 5 sao"
        >
          ★★★★★
        </span>
      </div>
      <blockquote>{testimony.quote}</blockquote>
    </Card>
  );
}

export function AuthIntroduction() {
  const data = useDemoDataset("auth-introduction");
  return (
    <section
      className="min-[1100px]:min-h-[893px] max-[700px]:mt-1 [&_h1]:font-inter [&_h1]:mt-7 [&_h1]:mb-[9px] [&_h1]:text-5xl [&_h1]:leading-[1.2] [&_h1]:tracking-[-1.5px] [&_h1]:font-extrabold [&_h1_span]:text-auth-orange max-[1150px]:[&_h1]:text-4xl max-[950px]:[&_h1]:text-3xl max-[700px]:[&_h1]:mt-[22px] max-[700px]:[&_h1]:text-4xl max-[380px]:[&_h1]:text-3xl"
      aria-labelledby="auth-heading"
    >
      <span className="inline-flex items-center rounded-[20px] bg-auth-surface-brand px-3 py-[5px] text-xs leading-[18px] font-bold text-auth-orange [&_svg]:size-[17px]">
        Job Search Engine hàng đầu
      </span>
      <h1 id="auth-heading">
        Khởi đầu sự nghiệp mơ ước
        <br />
        cùng <span>Job Tốt</span>
      </h1>
      <p className="m-0 text-lg leading-[26px] tracking-[-0.3px] text-auth-muted max-[950px]:text-base max-[950px]:leading-6 [&_strong]:font-bold [&_strong]:text-auth-ink [&_b]:font-bold [&_b]:text-auth-orange">
        Gia nhập cộng đồng hơn <strong>{data?.candidates || ""}</strong> ứng viên và tiếp cận ngay{" "}
        <b>{data?.jobs || ""}</b> việc làm chất lượng cao từ các tập đoàn công nghệ & doanh nghiệp
        hàng đầu.
      </p>
      {data && <CareerStats stats={data.stats} />}
      <div className="mt-6 grid gap-3.5">
        {benefits.map((item) => (
          <BenefitCard key={item.title} item={item} />
        ))}
      </div>
      {data && <CandidateTestimonial testimony={data.testimony} />}
    </section>
  );
}
