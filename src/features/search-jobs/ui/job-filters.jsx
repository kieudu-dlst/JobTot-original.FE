import { Select } from "@/shared/ui/select";
import { Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

export function JobFilters({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  return (
    <section
      aria-label="Bộ lọc việc làm"
      className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm md:flex-row"
    >
      <div className="relative flex-1">
        <Search aria-hidden="true" className="absolute top-3 left-3 size-4 text-muted-foreground" />
        <Input
          aria-label="Tìm theo vị trí, công ty hoặc kỹ năng"
          placeholder="Vị trí, công ty hoặc kỹ năng..."
          value={filters.query}
          onChange={(event) => update("query", event.target.value)}
          className="h-10 pl-10"
        />
      </div>
      <Select
        aria-label="Địa điểm"
        className="h-10 rounded-[9px] border border-[#e2e8f0] bg-white pl-3 pr-9 text-[13px] font-medium text-[#263449] hover:border-[#ffb294] focus-visible:border-[#ff875a] focus-visible:shadow-[0_0_0_3px_rgba(255,87,34,0.12)] focus-visible:outline-none transition-colors cursor-pointer"
        value={filters.location}
        onChange={(event) => update("location", event.target.value)}
      >
        <option value="">Tất cả địa điểm</option>
        <option>Hồ Chí Minh</option>
        <option>Hà Nội</option>
        <option>Remote</option>
      </Select>
      <Select
        aria-label="Hình thức làm việc"
        className="h-10 rounded-[9px] border border-[#e2e8f0] bg-white pl-3 pr-9 text-[13px] font-medium text-[#263449] hover:border-[#ffb294] focus-visible:border-[#ff875a] focus-visible:shadow-[0_0_0_3px_rgba(255,87,34,0.12)] focus-visible:outline-none transition-colors cursor-pointer"
        value={filters.type}
        onChange={(event) => update("type", event.target.value)}
      >
        <option value="">Tất cả hình thức</option>
        <option>Toàn thời gian</option>
        <option>Thực tập</option>
      </Select>
      <Button
        variant="outline"
        className="h-10"
        onClick={() => onChange({ query: "", location: "", type: "" })}
      >
        Xóa bộ lọc
      </Button>
    </section>
  );
}
