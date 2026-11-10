export function SummaryRows({ rows }) {
  return (
    <dl className="salary-rows">
      {rows.map(([label, value, tone]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd className={tone || ""}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
