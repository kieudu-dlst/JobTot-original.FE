import { test, after } from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { fileURLToPath } from "node:url";
import path from "node:path";

const win = new Window({ url: "http://localhost/" });
for (const key of [
  "document",
  "navigator",
  "Node",
  "Element",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "MutationObserver",
  "ResizeObserver",
  "DOMParser",
  "Event",
  "CustomEvent",
  "KeyboardEvent",
  "MouseEvent",
  "PointerEvent",
  "NodeFilter",
  "DOMRect",
  "CSS",
]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: win[key] });
}
globalThis.window = win;
globalThis.getComputedStyle = win.getComputedStyle.bind(win);
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.innerHeight = 900;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createElement, act, useState } = await import("react");
const { createRoot } = await import("react-dom/client");
const { Tooltip } = await import("radix-ui");
const { createServer } = await import("vite");
const rootPath = fileURLToPath(new URL("../", import.meta.url));
const server = await createServer({
  root: rootPath,
  configFile: path.join(rootPath, "vite.config.js"),
  cacheDir: path.resolve(rootPath, "../.artifacts/article-editor-checks/vite-cache"),
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false },
});
const { TablePicker } = await server.ssrLoadModule("/src/pages/career-articles/table-picker.jsx");
const { ArticleEditor } = await server.ssrLoadModule(
  "/src/pages/career-articles/article-editor.jsx",
);
const { articleHtml, ARTICLE_HTML_PREFIX } = await server.ssrLoadModule(
  "/src/shared/lib/article-content.js",
);
let mounted;
async function mount(element) {
  if (mounted) await act(async () => mounted.unmount());
  const host = document.body.appendChild(document.createElement("div"));
  mounted = createRoot(host);
  await act(async () => {
    mounted.render(element);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  return host;
}
async function click(element) {
  assert.ok(element, "target exists");
  await act(async () => {
    element.click();
  });
}
const button = (host, label) =>
  [...host.querySelectorAll("button")].find(
    (node) => node.getAttribute("aria-label") === label || node.textContent === label,
  );
async function setInput(input, value) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new win.Event("input", { bubbles: true }));
    input.dispatchEvent(new win.Event("change", { bubbles: true }));
  });
}
after(async () => {
  if (mounted) await act(async () => mounted.unmount());
  await server.close();
  win.happyDOM.abort();
});

test("table picker highlights the hovered rectangle and confirms exact dimensions", async () => {
  const inserted = [];
  const host = await mount(
    createElement(
      Tooltip.Provider,
      null,
      createElement(TablePicker, { onInsert: (rows, cols) => inserted.push([rows, cols]) }),
    ),
  );
  for (const [rows, cols] of [
    [1, 1],
    [2, 3],
    [8, 10],
  ]) {
    await click(button(host, "Chèn bảng"));
    const grid = document.querySelector('[role="grid"]');
    assert.equal(grid.querySelectorAll('[role="gridcell"]').length, 80);
    const cell = grid.querySelector(`[data-cell="${rows}-${cols}"]`);
    await act(async () => {
      cell.dispatchEvent(new win.PointerEvent("pointerover", { bubbles: true }));
    });
    assert.equal(grid.querySelectorAll('[aria-selected="true"]').length, rows * cols);
    assert.equal(document.querySelector("output").textContent, `${cols} cột × ${rows} hàng`);
    await click(cell);
    assert.deepEqual(inserted.at(-1), [rows, cols]);
    assert.equal(document.querySelector('[role="grid"]'), null);
  }
});

test("grid keyboard navigation and manual dimensions validate before insertion", async () => {
  const inserted = [];
  const host = await mount(
    createElement(
      Tooltip.Provider,
      null,
      createElement(TablePicker, { onInsert: (rows, cols) => inserted.push([rows, cols]) }),
    ),
  );
  await click(button(host, "Chèn bảng"));
  const cell = document.querySelector('[data-cell="1-1"]');
  await act(async () => {
    cell.focus();
    cell.dispatchEvent(new win.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  });
  assert.equal(document.activeElement.getAttribute("data-cell"), "1-2");
  await act(async () => {
    document.activeElement.dispatchEvent(
      new win.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
  });
  assert.equal(document.activeElement.getAttribute("data-cell"), "2-2");
  const inputs = document.querySelectorAll(".article-table-manual input");
  await setInput(inputs[0], "21");
  await click(button(document, "Chèn bảng theo kích thước"));
  assert.equal(inserted.length, 0);
  assert.ok(document.querySelector('[role="alert"]'));
  await setInput(inputs[0], "12");
  await setInput(inputs[1], "5");
  await click(button(document, "Chèn bảng theo kích thước"));
  assert.deepEqual(inserted[0], [5, 12]);
});

test("actual editor inserts a blank table, tracks Heading, and saves/reopens visual content", async () => {
  let saved = "";
  function Harness({ initial = "" }) {
    const [value, setValue] = useState(initial);
    return createElement(ArticleEditor, {
      value,
      onChange: (next) => {
        saved = next;
        setValue(next);
      },
    });
  }
  const host = await mount(createElement(Harness));
  assert.ok(host.querySelector('[contenteditable="true"]'));
  await click(button(host, "Chèn bảng"));
  await click(document.querySelector('[data-cell="2-3"]'));
  const dom = host.querySelector(".ProseMirror");
  const editor = dom.editor;
  assert.equal(dom.querySelectorAll("tr").length, 2);
  assert.equal(dom.querySelectorAll("tr")[0].children.length, 3);
  assert.ok(
    saved.startsWith(ARTICLE_HTML_PREFIX),
    "empty inserted tables are saved, not discarded as empty text",
  );
  await act(async () => {
    editor.commands.insertContent("Ô trực quan");
  });
  assert.ok(saved.includes("Ô trực quan"));
  await click(button(host, "Soạn & xem trước"));
  assert.equal(host.querySelector(".markdown-preview table").rows.length, 2);
  assert.equal(host.querySelector(".markdown-preview table").textContent, "Ô trực quan");
  assert.equal(host.querySelector(".markdown-preview .article-table-drag"), null);
  await click(button(host, "Xem trước"));
  assert.equal(host.querySelector(".article-compose-pane").hidden, true);
  assert.equal(host.querySelector(".markdown-preview .column-resize-handle"), null);
  const persisted = saved;
  const reopened = await mount(createElement(Harness, { initial: persisted }));
  assert.equal(reopened.querySelectorAll(".ProseMirror tr").length, 2);
  assert.equal(reopened.querySelector(".ProseMirror table").textContent, "Ô trực quan");
  assert.match(articleHtml(persisted), /<table/);
});

test("Heading menu reflects selection and Normal removes only the heading", async () => {
  const host = await mount(
    createElement(ArticleEditor, { value: "## Tiêu đề cũ\n\nĐoạn thường", onChange() {} }),
  );
  const editor = host.querySelector(".ProseMirror").editor;
  await act(async () => {
    editor.commands.setTextSelection(2);
  });
  const menu = host.querySelector('select[aria-label="Kiểu đoạn"]');
  assert.equal(menu.value, "2");
  await act(async () => {
    menu.value = "6";
    menu.dispatchEvent(new win.Event("change", { bubbles: true }));
  });
  assert.equal(editor.state.doc.firstChild.type.name, "heading");
  assert.equal(editor.state.doc.firstChild.attrs.level, 6);
  await act(async () => {
    menu.value = "paragraph";
    menu.dispatchEvent(new win.Event("change", { bubbles: true }));
  });
  assert.equal(editor.state.doc.firstChild.type.name, "paragraph");
  assert.equal(editor.state.doc.firstChild.textContent, "Tiêu đề cũ");
});

test("visual selection formatting and preview retain bold, italic, underline, lists and images", async () => {
  let saved = "";
  function Harness() {
    const [value, setValue] = useState("Đoạn định dạng");
    return createElement(ArticleEditor, {
      value,
      onChange(next) {
        saved = next;
        setValue(next);
      },
    });
  }
  const host = await mount(createElement(Harness));
  const editor = host.querySelector(".ProseMirror").editor;
  await act(async () => {
    editor.commands.setTextSelection({ from: 1, to: 5 });
  });
  await click(button(host, "Đậm"));
  await click(button(host, "Nghiêng"));
  await click(button(host, "Gạch chân"));
  assert.match(editor.getHTML(), /<strong><em><u>Đoạn<\/u><\/em><\/strong>/);
  await act(async () => {
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    editor.commands.insertContent("<p>Mục danh sách</p>");
  });
  await click(button(host, "Danh sách dấu chấm"));
  assert.match(editor.getHTML(), /<ul>/);
  await act(async () => {
    editor.commands.setImage({ src: "https://example.com/image.jpg", alt: "Ảnh bài viết" });
  });
  await click(button(host, "Soạn & xem trước"));
  const preview = host.querySelector(".markdown-preview .article-body");
  assert.ok(preview.querySelector("strong em u"));
  assert.ok(preview.querySelector("ul"));
  assert.equal(preview.querySelector("img").getAttribute("alt"), "Ảnh bài viết");
  assert.equal(preview.innerHTML, articleHtml(saved));
});
