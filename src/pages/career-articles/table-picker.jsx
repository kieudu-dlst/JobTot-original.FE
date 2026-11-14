import { useRef, useState } from "react";
import { Popover, Tooltip } from "radix-ui";
import { Table2 } from "lucide-react";

export const TABLE_GRID_COLUMNS = 10;
export const TABLE_GRID_ROWS = 8;
export const TABLE_MAX_SIZE = 20;

function validTableSize(rows, columns) {
  return [rows, columns].every(
    (value) =>
      Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= TABLE_MAX_SIZE,
  );
}

export function TablePicker({ disabled, onInsert }) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState({ rows: 1, columns: 1 });
  const [manual, setManual] = useState({ rows: "3", columns: "3" });
  const inserted = useRef(false);
  const [error, setError] = useState("");
  function insert(rows, columns) {
    if (!validTableSize(rows, columns)) {
      setError(`Nhập số nguyên từ 1 đến ${TABLE_MAX_SIZE}.`);
      return;
    }
    if (onInsert(Number(rows), Number(columns)) === false) return;
    inserted.current = true;
    setOpen(false);
  }
  function navigate(event, row, column) {
    const moves = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    if (!moves[event.key]) return;
    event.preventDefault();
    const [dy, dx] = moves[event.key];
    const rows = Math.max(1, Math.min(TABLE_GRID_ROWS, row + dy));
    const columns = Math.max(1, Math.min(TABLE_GRID_COLUMNS, column + dx));
    setSize({ rows, columns });
    event.currentTarget
      .closest('[role="grid"]')
      .querySelector(`[data-cell="${rows}-${columns}"]`)
      ?.focus();
  }
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Popover.Trigger
            type="button"
            className="markdown-tool-button"
            disabled={disabled}
            aria-label="Chèn bảng"
            onClick={() => setError("")}
          >
            <Table2 aria-hidden="true" />
          </Popover.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="markdown-tool-tooltip" sideOffset={6}>
            Chèn bảng
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Popover.Portal>
        <Popover.Content
          className="article-table-picker"
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          aria-label="Chọn kích thước bảng"
          onCloseAutoFocus={(event) => {
            if (inserted.current) {
              event.preventDefault();
              inserted.current = false;
            }
          }}
        >
          <strong>Chèn bảng</strong>
          <output aria-live="polite">
            {size.columns} cột × {size.rows} hàng
          </output>
          <div role="grid" aria-label="Lưới chọn số cột và số hàng" className="article-table-grid">
            {Array.from({ length: TABLE_GRID_ROWS }, (_, row) => (
              <div role="row" key={row}>
                {Array.from({ length: TABLE_GRID_COLUMNS }, (_, column) => (
                  <button
                    type="button"
                    role="gridcell"
                    key={column}
                    data-cell={`${row + 1}-${column + 1}`}
                    aria-label={`${column + 1} cột, ${row + 1} hàng`}
                    aria-selected={row < size.rows && column < size.columns}
                    tabIndex={row + 1 === size.rows && column + 1 === size.columns ? 0 : -1}
                    onPointerEnter={() => setSize({ rows: row + 1, columns: column + 1 })}
                    onFocus={() => setSize({ rows: row + 1, columns: column + 1 })}
                    onKeyDown={(event) => navigate(event, row + 1, column + 1)}
                    onClick={() => insert(row + 1, column + 1)}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="article-table-manual">
            <label>
              Số cột
              <input
                type="number"
                min="1"
                max={TABLE_MAX_SIZE}
                step="1"
                value={manual.columns}
                onChange={(event) => setManual({ ...manual, columns: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    insert(manual.rows, manual.columns);
                  }
                }}
              />
            </label>
            <label>
              Số hàng
              <input
                type="number"
                min="1"
                max={TABLE_MAX_SIZE}
                step="1"
                value={manual.rows}
                onChange={(event) => setManual({ ...manual, rows: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    insert(manual.rows, manual.columns);
                  }
                }}
              />
            </label>
          </div>
          <p className="article-hint">
            Số hàng đã gồm hàng tiêu đề. Tối đa {TABLE_MAX_SIZE} × {TABLE_MAX_SIZE}.
          </p>
          {error && <p role="alert">{error}</p>}
          <button
            type="button"
            className="article-insert-table"
            onClick={() => insert(manual.rows, manual.columns)}
          >
            Chèn bảng theo kích thước
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
