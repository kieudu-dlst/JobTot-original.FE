import { DropdownMenu } from "radix-ui";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, Building, ChevronDown, Search, Bookmark } from "lucide-react";
import "./jobs-menu.css";

export function JobsMenu({ compact = false }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={`jobs-menu-trigger ${compact ? "jobs-menu-compact" : ""}`}
        aria-label="Việc làm"
      >
        <BriefcaseBusiness />
        <span>Việc làm</span>
        <ChevronDown className="jobs-menu-chevron" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="jobs-menu-content font-roboto"
          sideOffset={10}
          align="start"
          collisionPadding={12}
        >
          <DropdownMenu.Item asChild>
            <Link to="/jobs" className="jobs-menu-item">
              <Search />
              Tìm kiếm việc làm
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link to="/companies" className="jobs-menu-item">
              <Building />
              Doanh nghiệp
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link to="/top-industries" className="jobs-menu-item">
              <BriefcaseBusiness />
              Top ngành nghề
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link to="/my-jobs" className="jobs-menu-item">
              <Bookmark />
              Việc làm của tôi
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
