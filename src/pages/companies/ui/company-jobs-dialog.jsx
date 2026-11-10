import { useEffect, useState } from "react";
import { MapPin, Banknote } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Pagination } from "@/shared/ui/pagination";
import { companiesApi } from "../api/companies";

function CompanyJobs({ company }) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      companiesApi
        .jobs(company.id, page, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) return;
          setResult({ ...data, requestedPage: page });
          setError("");
        })
        .catch((failure) => {
          if (!controller.signal.aborted) setError(failure.message);
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [company.id, page, attempt]);
  if (error)
    return (
      <div role="alert">
        {error}
        <button className="company-text-button" onClick={() => setAttempt((x) => x + 1)}>
          Thử lại
        </button>
      </div>
    );
  if (!result || result.requestedPage !== page) return <p role="status">Đang tải việc làm…</p>;
  return (
    <div className="company-job-list">
      {result.items.length ? (
        result.items.map((job) => (
          <details key={job.id} className="company-job-item">
            <summary>{job.title}</summary>
            <p>
              <MapPin />
              {job.location}
              <Banknote />
              {job.salaryMin || job.salaryMax
                ? `${(job.salaryMin || 0).toLocaleString("vi-VN")} – ${(job.salaryMax || 0).toLocaleString("vi-VN")} VND`
                : "Lương thỏa thuận"}
            </p>
            <div>{job.description}</div>
          </details>
        ))
      ) : (
        <p>Doanh nghiệp chưa có việc làm đang mở. Theo dõi để dễ dàng tìm lại công ty này.</p>
      )}
      {result.totalCount > 10 && (
        <Pagination
          aria-label="Phân trang việc làm doanh nghiệp"
          page={page}
          totalPages={Math.ceil(result.totalCount / 10)}
          onPageChange={setPage}
          compact
        />
      )}
    </div>
  );
}

export function CompanyJobsDialog({ company, onClose }) {
  return (
    <Dialog
      open={!!company}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="company-jobs-dialog">
        <DialogTitle>{company?.name}</DialogTitle>
        <DialogDescription>
          Các vị trí đang tuyển dụng tại doanh nghiệp. Chọn một vị trí để xem mô tả công việc.
        </DialogDescription>
        {company && <CompanyJobs key={company.id} company={company} />}
      </DialogContent>
    </Dialog>
  );
}
