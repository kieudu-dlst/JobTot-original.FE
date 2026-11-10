import { useEffect, useState } from "react";
import { employerCompanyApi } from "../api/company";

export function IndustrySelect({ value, ids, onChange }) {
  const [options, setOptions] = useState(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await employerCompanyApi.industries(controller.signal);
        if (!controller.signal.aborted) {
          setOptions(data);
          setError("");
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [attempt]);
  const [query, setQuery] = useState("");
  const selected =
    ids ?? (options || []).filter((item) => item.name === value).map((item) => item.id);
  function toggle(id, checked) {
    const next = checked ? [...selected, id] : selected.filter((item) => item !== id);
    onChange(
      next,
      (options || [])
        .filter((item) => next.includes(item.id))
        .map((item) => item.name)
        .join(", "),
    );
  }
  return (
    <fieldset className="ec-industries">
      <legend>Ngành nghề / Lĩnh vực</legend>
      <input
        aria-label="Tìm ngành nghề"
        placeholder="Tìm ngành nghề…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {!options && !error && <p role="status">Đang tải ngành nghề…</p>}
      <div className="ec-industry-options">
        {options
          ?.filter((item) =>
            item.name.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")),
          )
          .map((item) => (
            <label key={item.id}>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                disabled={selected.length >= 20 && !selected.includes(item.id)}
                onChange={(event) => toggle(item.id, event.target.checked)}
              />
              {item.name}
            </label>
          ))}
      </div>
      <p>Đã chọn {selected.length} ngành · Tối đa 20 ngành.</p>
      {selected.length > 0 && (
        <button type="button" className="ec-outline" onClick={() => onChange([], "")}>
          Bỏ chọn tất cả
        </button>
      )}
      {error && (
        <p role="alert" className="ec-error">
          {error}{" "}
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            Thử lại
          </button>
        </p>
      )}
    </fieldset>
  );
}
