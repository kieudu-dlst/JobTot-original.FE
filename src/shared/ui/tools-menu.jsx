import { DropdownMenu } from "radix-ui";
import { Link } from "react-router-dom";
import {
  Wrench,
  ChevronDown,
  FileText,
  Calculator,
  ReceiptText,
  ShieldCheck,
  BriefcaseBusiness,
} from "lucide-react";
import "./jobs-menu.css";

const tools = [
  { to: "/cv-templates", label: "Mẫu CV", icon: FileText },
  { to: "/tools/gross-net", label: "Tính lương", icon: Calculator },
  { to: "/tools/income-tax", label: "Tính thuế TNCN", icon: ReceiptText },
  { to: "/tools/social-insurance", label: "Tính BHXH 1 lần", icon: ShieldCheck },
  {
    to: "/tools/unemployment-insurance",
    label: "Tính bảo hiểm thất nghiệp",
    icon: BriefcaseBusiness,
  },
];

export function ToolsMenu({ compact = false }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={`jobs-menu-trigger ${compact ? "jobs-menu-compact" : ""}`}
        aria-label="Kho tiện ích"
      >
        <Wrench />
        <span>Kho tiện ích</span>
        <ChevronDown className="jobs-menu-chevron" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="jobs-menu-content font-roboto"
          sideOffset={10}
          align="start"
          collisionPadding={12}
        >
          {tools.map(({ to, label, icon: Icon }) => (
            <DropdownMenu.Item key={to} asChild>
              <Link to={to} className="jobs-menu-item">
                <Icon />
                {label}
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
