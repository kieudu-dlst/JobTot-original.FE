import { Select } from "@/shared/ui/select";
import { Table, TableScroll } from "@/shared/ui/table";
import { useToast } from "@/shared/ui/toast-context";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Building2,
  Users,
  Layers3,
  Search,
  Plus,
  CheckCircle2,
  Eye,
  KeyRound,
  Pencil,
  Power,
} from "lucide-react";
import { Pagination } from "@/shared/ui/pagination";
import { AdminLayout } from "@/widgets/admin-layout";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { adminApi } from "../api/admin";

const sections = {
  companies: {
    label: "Công ty",
    title: "Quản lý công ty",
    description: "Kiểm duyệt thông tin và quản lý trạng thái các doanh nghiệp.",
    icon: Building2,
  },
  users: {
    label: "Người dùng",
    title: "Quản lý người dùng",
    description: "Quản lý tài khoản, quyền truy cập và mật khẩu người dùng.",
    icon: Users,
  },
  industries: {
    label: "Nhóm ngành",
    title: "Quản lý nhóm ngành",
    description: "Cập nhật danh mục ngành nghề dùng trên nền tảng.",
    icon: Layers3,
  },
};
const verificationNames = { Pending: "Chờ xác minh", Verified: "Đã xác minh", Rejected: "Từ chối" };
const roleNames = { Admin: "Quản trị viên", Candidate: "Ứng viên", Employer: "Nhà tuyển dụng" };

export function AdminPage() {
  const { section = "companies" } = useParams();
  return (
    <AdminLayout>
      {({ me, onExpired }) =>
        sections[section] ? (
          <AdminSection key={section} section={section} me={me} onExpired={onExpired} />
        ) : (
          <Link to="/admin/companies">Quay lại quản trị</Link>
        )
      }
    </AdminLayout>
  );
}

function AdminSection({ section, me, onExpired }) {
  const notify = useToast();
  const config = sections[section];
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setResult(null);
      setError("");
      try {
        const query = new URLSearchParams({
          page,
          size: 20,
          ...(keyword && { keyword }),
          ...(status && { status }),
        });
        const data = await adminApi.list(section, query, controller.signal);
        if (!controller.signal.aborted) {
          const lastPage = Math.max(1, Math.ceil(data.total / data.size));
          if (page > lastPage) setPage(lastPage);
          else setResult(data);
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [section, keyword, status, page, attempt]);
  if (error?.status === 401 || error?.status === 403)
    return (
      <div className="admin-notice error" role="alert">
        Phiên quản trị không còn hợp lệ.<button onClick={onExpired}>Đăng nhập lại</button>
      </div>
    );
  function open(value) {
    setEditor(value);
    setDialogError("");
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setDialogError("");
    try {
      if (editor.type === "status")
        await adminApi.status(section, editor.row.id, editor.row.status !== "Active");
      else if (editor.type === "verification")
        await adminApi.verify(editor.row.id, values.get("verification"));
      else if (editor.type === "password") {
        if (values.get("password") !== values.get("confirm")) {
          setDialogError("Mật khẩu xác nhận không khớp.");
          return;
        }
        await adminApi.password(editor.row.id, values.get("password"));
        if (editor.row.id === me.id) {
          clearAdminSession();
          onExpired();
          return;
        }
      } else await adminApi.industry(editor.row?.id, values.get("name"));
      setEditor(null);
      setAttempt((value) => value + 1);
      notify("Đã cập nhật thành công.");
    } catch (failure) {
      if (failure.status === 401 || failure.status === 403) {
        onExpired();
        return;
      }
      setDialogError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  const pages = result ? Math.max(1, Math.ceil(result.total / result.size)) : 1;
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">QUẢN TRỊ NỀN TẢNG</span>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        {section === "industries" && (
          <button className="admin-primary" onClick={() => open({ type: "industry" })}>
            <Plus />
            Thêm nhóm ngành
          </button>
        )}
      </div>
      <div className="admin-overview">
        <span className="admin-overview-icon">
          <config.icon />
        </span>
        <div>
          <span>
            Tổng{" "}
            {section === "companies"
              ? "công ty"
              : section === "users"
                ? "người dùng"
                : "nhóm ngành"}
            {keyword || status ? " phù hợp" : ""}
          </span>
          <strong>{result ? result.total.toLocaleString("vi-VN") : "—"}</strong>
        </div>
        <span className="admin-overview-note">
          <CheckCircle2 />
          Dữ liệu từ hệ thống
        </span>
      </div>

      <section className="admin-table-card" aria-label={config.title}>
        <div className="admin-table-toolbar">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setKeyword(search.trim());
              setPage(1);
            }}
          >
            <label className="admin-search">
              <Search />
              <input
                aria-label="Tìm kiếm"
                placeholder={
                  section === "companies"
                    ? "Tên công ty, mã số thuế, email…"
                    : section === "users"
                      ? "Tên, email hoặc số điện thoại…"
                      : "Tìm nhóm ngành…"
                }
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                maxLength={200}
              />
            </label>
            <button className="admin-secondary">Tìm kiếm</button>
          </form>
          <Select
            aria-label="Lọc trạng thái"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Đang hoạt động</option>
            <option value="Inactive">Ngừng hoạt động</option>
          </Select>
        </div>
        {error ? (
          <div className="admin-empty" role="alert">
            {error.message}
            <button className="admin-secondary" onClick={() => setAttempt((value) => value + 1)}>
              Thử lại
            </button>
          </div>
        ) : !result ? (
          <p className="admin-empty" role="status">
            Đang tải danh sách…
          </p>
        ) : !result.items.length ? (
          <div className="admin-empty">
            <config.icon />
            <h2>Không có kết quả</h2>
            <p>Thử thay đổi từ khóa hoặc bộ lọc.</p>
          </div>
        ) : (
          <TableScroll label="Danh sách quản trị" className="admin-table-scroll">
            <Table aria-label="Danh sách quản trị">
              <thead>
                <tr>
                  <th>
                    {section === "companies"
                      ? "Công ty"
                      : section === "users"
                        ? "Người dùng"
                        : "Nhóm ngành"}
                  </th>
                  {section === "companies" ? (
                    <>
                      <th>Mã số thuế</th>
                      <th>Xác minh</th>
                    </>
                  ) : section === "users" ? (
                    <>
                      <th>Liên hệ</th>
                      <th>Loại tài khoản</th>
                    </>
                  ) : (
                    <th>Số công ty</th>
                  )}
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name || row.fullName}</strong>
                      {section === "companies" && <small>{row.email || "Chưa có email"}</small>}
                    </td>
                    {section === "companies" ? (
                      <>
                        <td>{row.taxCode || "Chưa cập nhật"}</td>
                        <td>
                          <span className={`admin-badge ${row.verificationStatus.toLowerCase()}`}>
                            {verificationNames[row.verificationStatus] || row.verificationStatus}
                          </span>
                        </td>
                      </>
                    ) : section === "users" ? (
                      <>
                        <td>
                          {row.email || "—"}
                          <small>{row.phone}</small>
                        </td>
                        <td>{roleNames[row.accountType] || row.accountType || "—"}</td>
                      </>
                    ) : (
                      <td>{row.companyCount}</td>
                    )}
                    <td>
                      <span className={`admin-badge ${row.status.toLowerCase()}`}>
                        {row.status === "Active" ? "Đang hoạt động" : "Ngừng hoạt động"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        {section === "companies" ? (
                          <>
                            <button onClick={() => open({ type: "verification", row })}>
                              <Eye />
                              Xem & xác minh
                            </button>
                          </>
                        ) : section === "users" ? (
                          <button onClick={() => open({ type: "password", row })}>
                            <KeyRound />
                            Đổi mật khẩu
                          </button>
                        ) : (
                          <button onClick={() => open({ type: "industry", row })}>
                            <Pencil />
                            Sửa tên
                          </button>
                        )}
                        <button
                          disabled={
                            section === "users" && row.id === me.id && row.status === "Active"
                          }
                          onClick={() => open({ type: "status", row })}
                        >
                          <Power />
                          {row.status === "Active" ? "Ngừng hoạt động" : "Kích hoạt"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
        {result && (
          <Pagination
            className="ui-pagination--inset"
            aria-label={`Phân trang ${config.label.toLocaleLowerCase("vi")}`}
            page={page}
            totalPages={pages}
            onPageChange={setPage}
            info={
              result.total
                ? `Hiển thị ${(page - 1) * result.size + 1}–${Math.min(page * result.size, result.total)} / ${result.total}`
                : "0 kết quả"
            }
          />
        )}
      </section>
      <Dialog
        open={!!editor}
        onOpenChange={(value) => {
          if (!value && !busy) setEditor(null);
        }}
      >
        <DialogContent className="admin-dialog" showCloseButton={!busy}>
          {editor && (
            <form onSubmit={save}>
              <DialogTitle>
                {editor.type === "status"
                  ? editor.row.status === "Active"
                    ? "Ngừng hoạt động"
                    : "Kích hoạt"
                  : editor.type === "password"
                    ? "Đổi mật khẩu người dùng"
                    : editor.type === "verification"
                      ? "Xác minh thông tin công ty"
                      : editor.row
                        ? "Sửa nhóm ngành"
                        : "Thêm nhóm ngành"}
              </DialogTitle>
              <DialogDescription>
                {editor.row?.name ||
                  editor.row?.fullName ||
                  "Thêm ngành nghề vào danh mục của nền tảng."}
              </DialogDescription>
              {editor.type === "verification" && (
                <>
                  <dl className="admin-company-details">
                    {[
                      ["Tên pháp lý", editor.row.legalName],
                      ["Mã số thuế", editor.row.taxCode],
                      ["Email", editor.row.email],
                      ["Điện thoại", editor.row.phone],
                      ["Website", editor.row.websiteUrl],
                      ["Địa chỉ", editor.row.addressLine],
                      ["Ngành nghề", editor.row.industry],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value || "Chưa cập nhật"}</dd>
                      </div>
                    ))}
                  </dl>
                  <label>
                    Kết quả xác minh
                    <Select name="verification" defaultValue={editor.row.verificationStatus}>
                      <option value="Pending">Chờ xác minh</option>
                      <option value="Verified">Đã xác minh</option>
                      <option value="Rejected">Từ chối</option>
                    </Select>
                  </label>
                  <p className="admin-dialog-hint">
                    Kiểm tra thông tin trước khi duyệt. Công ty cần có tên pháp lý, mã số thuế,
                    email và địa chỉ.
                  </p>
                </>
              )}
              {editor.type === "password" && (
                <>
                  <label>
                    Mật khẩu mới
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                    />
                  </label>
                  <label>
                    Xác nhận mật khẩu
                    <input
                      type="password"
                      name="confirm"
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                    />
                  </label>
                  <p className="admin-dialog-hint">
                    Tối thiểu 12 ký tự. Tất cả phiên đăng nhập cũ của người dùng sẽ bị thu hồi.
                  </p>
                </>
              )}
              {editor.type === "industry" && (
                <label>
                  Tên nhóm ngành
                  <input
                    name="name"
                    defaultValue={editor.row?.name || ""}
                    required
                    maxLength={200}
                  />
                </label>
              )}
              {editor.type === "status" && (
                <p className="admin-dialog-hint">
                  {editor.row.status === "Active"
                    ? section === "users"
                      ? "Người dùng sẽ không thể đăng nhập; các phiên đăng nhập hiện tại sẽ bị thu hồi."
                      : section === "companies"
                        ? "Công ty và việc làm của công ty sẽ bị ẩn khỏi danh sách công khai. Nhà tuyển dụng thuộc công ty này sẽ không thể truy cập nếu không còn công ty hoạt động khác."
                        : "Nhóm ngành sẽ bị ẩn khỏi danh mục đang hoạt động. Các liên kết dữ liệu được giữ lại."
                    : "Cho phép mục này hoạt động trở lại trên nền tảng."}
                </p>
              )}
              {dialogError && (
                <p className="admin-notice error" role="alert">
                  {dialogError}
                </p>
              )}
              <div className="admin-dialog-actions">
                <button
                  type="button"
                  className="admin-secondary"
                  disabled={busy}
                  onClick={() => setEditor(null)}
                >
                  Hủy
                </button>
                <button className="admin-primary" disabled={busy}>
                  {busy ? "Đang lưu…" : "Xác nhận"}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
