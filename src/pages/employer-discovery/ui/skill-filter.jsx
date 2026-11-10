import { Combobox } from "@/shared/ui/combobox";

export function SkillFilter({ skills, value, onChange }) {
  return (
    <Combobox
      className="td-skill-filter"
      label="Kỹ năng"
      options={[
        { value: "", label: "Tất cả kỹ năng", filterable: false },
        ...skills.map((skill) => ({ value: skill, label: skill })),
      ]}
      value={value}
      onChange={onChange}
      searchLabel="Tìm kỹ năng"
      searchPlaceholder="Tìm kỹ năng…"
      emptyMessage="Không tìm thấy kỹ năng phù hợp."
    />
  );
}
