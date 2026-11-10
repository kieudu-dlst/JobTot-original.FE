import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog } from "radix-ui";
import {
  Menu,
  X,
  Search,
  Building,
  BriefcaseBusiness,
  FileText,
  Calculator,
  ReceiptText,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import "./mobile-menu.css";

const jobs = [
  ["/jobs", "Tìm kiếm việc làm", Search],
  ["/companies", "Doanh nghiệp", Building],
  ["/top-industries", "Top ngành nghề", BriefcaseBusiness],
];
const tools = [
  ["/cv-templates", "Mẫu CV", FileText],
  ["/tools/gross-net", "Tính lương", Calculator],
  ["/tools/income-tax", "Tính thuế TNCN", ReceiptText],
  ["/tools/social-insurance", "Tính BHXH 1 lần", ShieldCheck],
  ["/tools/unemployment-insurance", "Tính bảo hiểm thất nghiệp", BriefcaseBusiness],
];

function MenuGroup({ title, icon: Icon, items }) {
  return (
    <section className="mobile-menu-group">
      <h3>
        <Icon />
        {title}
      </h3>
      {items.map(([to, label, ItemIcon]) => (
        <Dialog.Close asChild key={to}>
          <Link className="mobile-menu-link" to={to}>
            <ItemIcon />
            {label}
          </Link>
        </Dialog.Close>
      ))}
    </section>
  );
}

export function MobileMenu({ navigation, accountActions, userName, loading, authRole }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="mobile-menu-trigger" aria-label="Mở menu">
        <Menu />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="mobile-menu-overlay" />
        <Dialog.Content className="mobile-menu-panel font-roboto" aria-describedby={undefined}>
          <div className="mobile-menu-heading">
            <Dialog.Title>Menu</Dialog.Title>
            <Dialog.Close className="mobile-menu-close" aria-label="Đóng menu">
              <X />
            </Dialog.Close>
          </div>
          <nav
            aria-label="Điều hướng mobile"
            onClick={(event) => {
              if (event.target.closest("a")) setOpen(false);
            }}
          >
            {navigation ? (
              <section className="mobile-menu-group mobile-menu-custom">
                <h3>
                  <BriefcaseBusiness />
                  Nhà tuyển dụng
                </h3>
                {navigation}
              </section>
            ) : (
              <>
                <MenuGroup title="Việc làm" icon={BriefcaseBusiness} items={jobs} />
                <MenuGroup title="Kho tiện ích" icon={Wrench} items={tools} />
              </>
            )}
            <section className="mobile-menu-group">
              <h3>Tài khoản</h3>
              {loading ? (
                <p role="status">Đang kiểm tra đăng nhập…</p>
              ) : userName ? (
                accountActions
              ) : (
                <div className="mobile-menu-auth">
                  <Dialog.Close asChild>
                    <Link to={authRole === "employer" ? "/login?role=employer" : "/login"}>
                      Đăng nhập
                    </Link>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <Link to={authRole === "employer" ? "/register?role=employer" : "/register"}>
                      Đăng ký
                    </Link>
                  </Dialog.Close>
                </div>
              )}
              <Dialog.Close asChild>
                <Link
                  className="mobile-menu-link"
                  to={authRole === "employer" ? "/register" : "/register?role=employer"}
                >
                  <Building />
                  {authRole === "employer" ? "Dành cho ứng viên" : "Dành cho nhà tuyển dụng"}
                </Link>
              </Dialog.Close>
            </section>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
