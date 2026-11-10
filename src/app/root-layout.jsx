import { CareerResources } from "@/widgets/career-resources";
import { Outlet } from "react-router-dom";
import { SiteHeader } from "@/widgets/site-header";

export function RootLayout() {
  return (
    <div className="site-page">
      <SiteHeader />
      <Outlet />
      <div className="mx-auto max-w-[1284px] px-[50px] pb-16 font-roboto max-[700px]:px-[18px]">
        <CareerResources />
      </div>
      <footer className="site-footer mx-auto max-w-6xl border-t px-6 py-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} TalentHub · Khởi đầu cho hành trình nghề nghiệp của bạn.
      </footer>
    </div>
  );
}
