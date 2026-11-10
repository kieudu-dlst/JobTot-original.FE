import { Link, useLocation } from "react-router-dom";
import { BellRing, LockKeyhole, LogIn } from "lucide-react";
import { MessageCircle, ArrowUpRight, ShieldCheck } from "lucide-react";
import { AuthHeader, EmployerHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { useCandidateSession, useEmployerSession } from "@/features/authenticate";
import { AccountChat } from "./account-chat";
import "./messages.css";

export function MessagesPage({ employer = false }) {
  const candidate = useCandidateSession(),
    recruiter = useEmployerSession();
  const location = useLocation();
  const contactParams = new URLSearchParams(location.search);
  const contactingHr = contactParams.has("hr") || contactParams.has("company");
  const useEmployer = employer || (!contactingHr && !candidate.account && !!recruiter.account);
  const session = useEmployer ? recruiter : candidate;
  if (session.loading || (!employer && (candidate.loading || recruiter.loading)))
    return (
      <div className="messages-page font-roboto">
        {useEmployer ? <EmployerHeader loading /> : <AuthHeader loading />}
        <main className="page-container company-container chat-container">
          <PageBreadcrumb current="Tin nhắn" />
          <p role="status">Đang kiểm tra đăng nhập…</p>
        </main>
        <AuthFooter />
      </div>
    );
  if (!session.account) return <MessagesGuest employer={useEmployer} />;
  return (
    <AccountChat
      key={`${useEmployer}-${session.account.id}`}
      session={session}
      employer={useEmployer}
    />
  );
}
function MessagesGuest({ employer }) {
  const location = useLocation();
  const role = employer
    ? "?role=employer"
    : `?returnTo=${encodeURIComponent(location.pathname + location.search)}`;
  return (
    <div className="messages-page font-roboto">
      <title>Tin nhắn tuyển dụng | Job Tốt</title>
      {employer ? <EmployerHeader active="messages" /> : <AuthHeader />}
      <main className="page-container company-container chat-container">
        <PageBreadcrumb current="Tin nhắn tuyển dụng" />
        <section className="chat-guest" aria-labelledby="chat-guest-title">
          <div className="chat-guest-art" aria-hidden="true">
            <span className="chat-guest-orbit">
              <MessageCircle />
            </span>
            <span className="chat-guest-lock">
              <LockKeyhole />
            </span>
            <span className="chat-guest-dots">
              <i />
              <i />
              <i />
            </span>
          </div>
          <span className="chat-guest-label">
            <i />
            Kết nối cơ hội nghề nghiệp
          </span>
          <h1 id="chat-guest-title">Đăng nhập để xem và trao đổi tin nhắn</h1>
          <p className="chat-guest-description">
            {employer
              ? "Kết nối với ứng viên và theo dõi các cuộc trao đổi tuyển dụng trong tài khoản của bạn."
              : "Đăng nhập tài khoản "}{" "}
            {!employer && (
              <>
                <strong>Job Tốt</strong> để kết nối với nhà tuyển dụng, theo dõi lời mời phỏng vấn
                và tiếp tục những cuộc trao đổi về công việc bạn quan tâm.
              </>
            )}
          </p>
          <div className="chat-guest-actions">
            <Link className="chat-guest-login" to={`/login${role}`}>
              <LogIn />
              Đăng nhập ngay
              <ArrowUpRight />
            </Link>
            <Link className="chat-guest-register" to={`/register${role}`}>
              Tạo tài khoản miễn phí
            </Link>
          </div>
          <div className="chat-guest-features">
            <article>
              <span className="chat-guest-feature-icon">
                <MessageCircle />
              </span>
              <h2>Trao đổi trực tiếp</h2>
              <p>
                Kết nối với {employer ? "ứng viên" : "nhà tuyển dụng"} để trao đổi về vị trí, kinh
                nghiệm và những bước tiếp theo.
              </p>
            </article>
            <article>
              <span className="chat-guest-feature-icon">
                <BellRing />
              </span>
              <h2>Theo dõi hội thoại</h2>
              <p>Xem nội dung trao đổi và thông tin phỏng vấn cùng nhau trong một màn hình.</p>
            </article>
            <article>
              <span className="chat-guest-feature-icon">
                <ShieldCheck />
              </span>
              <h2>Tài khoản của riêng bạn</h2>
              <p>Đăng nhập để mở không gian tin nhắn dành cho tài khoản và vai trò của bạn.</p>
            </article>
          </div>
        </section>
      </main>
      <AuthFooter />
    </div>
  );
}
