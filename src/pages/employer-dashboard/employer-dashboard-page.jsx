import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  UsersRound,
  CalendarDays,
  CheckCircle2,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useEmployerSession } from "@/features/authenticate";
import { employerFetch } from "@/shared/api/employer-session";
import { Button } from "@/shared/ui/button";

export function EmployerDashboardPage() {
  const { account } = useEmployerSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      employerFetch("campaigns?page=1", { signal: controller.signal })
        .then(async (response) => {
          const value = await response.json();
          if (!response.ok) throw new Error(value.detail || "Không thể tải số liệu tuyển dụng.");
          return value;
        })
        .then((value) => {
          if (!controller.signal.aborted) {
            setData(value);
            setError("");
          }
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setError(failure.message);
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [account?.companyId, attempt]);
  const stats = data?.stats;
  return (
    <div className="ed-overview">
      <title>Tổng quan tuyển dụng | Job Tốt</title>
      <section className="ed-welcome">
        <div>
          <p>TỔNG QUAN TUYỂN DỤNG</p>
          <h2>Xin chào, {account?.fullName}</h2>
          <span>Theo dõi tuyển dụng và kết nối với ứng viên tại một nơi.</span>
        </div>
        <Button asChild>
          <Link to="/employer/campaigns/new">
            <Plus size={18} />
            Tạo chiến dịch
          </Link>
        </Button>
      </section>
      {error && (
        <div role="alert" className="ed-error">
          {error}
          <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>
            Thử lại
          </Button>
        </div>
      )}
      {!data && !error && <p role="status">Đang tải số liệu tuyển dụng…</p>}
      <section className="ed-stat-grid" aria-label="Số liệu tuyển dụng">
        {[
          [BriefcaseBusiness, "Chiến dịch đang chạy", stats?.running, "/employer/campaigns"],
          [UsersRound, "Hồ sơ ứng tuyển", stats?.applications, "/employer/candidates"],
          [CalendarDays, "Phỏng vấn hôm nay", stats?.interviews, "/employer/interviews"],
          [CheckCircle2, "Ứng viên đã tuyển", stats?.hired, "/employer/candidates"],
        ].map(([Icon, label, value, to]) => (
          <Link to={to} className="ed-stat" key={label}>
            <Icon size={22} />
            <strong>{typeof value === "number" ? value.toLocaleString("vi-VN") : "—"}</strong>
            <span>{label}</span>
          </Link>
        ))}
      </section>
      <section className="ed-panel">
        <div className="ed-panel-heading">
          <h2>Chiến dịch tuyển dụng</h2>
          <Link to="/employer/campaigns">
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>
        {data?.items?.length ? (
          <div className="ed-campaign-list">
            {data.items.slice(0, 5).map((item) => (
              <Link key={item.id} to={`/employer/campaigns/${item.id}/edit`}>
                <div>
                  <strong>{item.title || item.name}</strong>
                  <span>
                    {{
                      Draft: "Bản nháp",
                      Running: "Đang chạy",
                      Paused: "Tạm dừng",
                      Ended: "Đã kết thúc",
                    }[item.campaignStatus] || item.campaignStatus}
                  </span>
                </div>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="ed-muted">
            {data
              ? "Bạn chưa có chiến dịch tuyển dụng. Tạo chiến dịch đầu tiên để bắt đầu."
              : "Số liệu sẽ hiển thị sau khi tải thành công."}
          </p>
        )}
      </section>
    </div>
  );
}
