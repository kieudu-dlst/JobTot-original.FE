import { after, test } from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { mkdir, writeFile } from "node:fs/promises";
import {
  articleHtml,
  serializeArticle,
  hasArticleContent,
  ARTICLE_HTML_PREFIX,
} from "../src/shared/lib/article-content.js";

const win = new Window({ url: "http://localhost/" });
for (const key of [
  "window",
  "document",
  "navigator",
  "Node",
  "HTMLElement",
  "Element",
  "MutationObserver",
  "DOMParser",
  "KeyboardEvent",
  "MouseEvent",
  "getComputedStyle",
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value:
      key === "window"
        ? win
        : typeof win[key] === "function" && key === "getComputedStyle"
          ? win[key].bind(win)
          : win[key],
  });
}
globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.innerHeight = 900;
const { Editor } = await import("@tiptap/core");
const { columnResizingPluginKey } = await import("@tiptap/pm/tables");
const { createArticleExtensions, selectedTablePosition, moveTableAt } = await import(
  "../src/pages/career-articles/editor-extensions.js"
);
const editors = [];
function create(content = "") {
  const element = document.body.appendChild(document.createElement("div"));
  const editor = new Editor({
    element,
    extensions: createArticleExtensions(),
    content: articleHtml(content),
    injectCSS: false,
  });
  editors.push(editor);
  return editor;
}
function table(editor) {
  let found;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "table") {
      found ||= { node, pos };
      return false;
    }
  });
  return found;
}
after(() => {
  editors.forEach((editor) => editor.destroy());
  win.happyDOM.abort();
});

test("old Markdown including tables opens as editable visual nodes", () => {
  const editor = create(
    "## Cẩm nang\n\n**Đậm**, *nghiêng*, <u>gạch chân</u>\n\n| Kỹ năng | Mức độ |\n| --- | --- |\n| React | Tốt |",
  );
  assert.match(editor.getHTML(), /<h2>Cẩm nang<\/h2>/);
  assert.match(editor.getHTML(), /<strong>Đậm<\/strong>/);
  assert.match(editor.getHTML(), /<u>gạch chân<\/u>/);
  assert.equal(table(editor).node.childCount, 2);
  assert.equal(table(editor).node.firstChild.childCount, 2);
  editor.commands.setTextSelection(table(editor).pos + 4);
  editor.commands.insertContent("Sửa ô ");
  assert.ok(table(editor).node.textContent.includes("Sửa ô"));
});

test("different chosen sizes insert exact row/column counts and focus the first cell", () => {
  for (const [rows, cols] of [
    [1, 1],
    [2, 3],
    [5, 7],
    [8, 10],
    [20, 20],
  ]) {
    const editor = create();
    assert.ok(editor.commands.insertTable({ rows, cols, withHeaderRow: true }));
    const t = table(editor);
    assert.equal(t.node.childCount, rows);
    t.node.forEach((row) => assert.equal(row.childCount, cols));
    assert.equal(selectedTablePosition(editor), t.pos);
    assert.equal(editor.state.selection.from, t.pos + 4);
    assert.equal(t.node.firstChild.firstChild.attrs.colwidth, null);
    assert.equal(editor.view.dom.querySelectorAll("col").length, cols);
  }
});

test("cell typing, Tab and Shift+Tab edit and navigate the actual editor model", () => {
  const editor = create();
  editor.commands.insertTable({ rows: 2, cols: 3 });
  editor.commands.insertContent("Ô đầu tiên");
  const first = editor.state.selection.from;
  const press = (shiftKey) =>
    editor.view.someProp("handleKeyDown", (handler) =>
      handler(
        editor.view,
        new win.KeyboardEvent("keydown", { key: "Tab", code: "Tab", keyCode: 9, shiftKey }),
      ),
    );
  assert.ok(press(false));
  assert.ok(editor.state.selection.from > first);
  editor.commands.insertContent("Ô thứ hai");
  assert.ok(press(true));
  assert.equal(editor.state.selection.$from.parent.textContent, "Ô đầu tiên");
  assert.ok(table(editor).node.textContent.includes("Ô thứ hai"));
});

test("rows and columns can be inserted and deleted without losing remaining cells", () => {
  const editor = create();
  editor.commands.insertTable({ rows: 2, cols: 2 });
  editor.commands.insertContent("Giữ lại");
  editor.commands.addRowAfter();
  editor.commands.addColumnAfter();
  assert.equal(table(editor).node.childCount, 3);
  assert.equal(table(editor).node.firstChild.childCount, 3);
  editor.commands.goToNextCell();
  editor.commands.deleteColumn();
  const t = table(editor);
  let lastRow = t.pos + 1;
  for (let index = 0; index < t.node.childCount - 1; index++)
    lastRow += t.node.child(index).nodeSize;
  editor.commands.setTextSelection(lastRow + 3);
  editor.commands.deleteRow();
  assert.equal(table(editor).node.firstChild.childCount, 2);
  assert.ok(table(editor).node.textContent.includes("Giữ lại"));
});

test("dragging a column separator updates widths and survives save/reopen", async () => {
  const editor = create();
  editor.commands.insertTable({ rows: 2, cols: 3 });
  editor.commands.insertContent("Nội dung ô");
  const firstCell = table(editor).pos + 2;
  editor.view.dispatch(editor.state.tr.setMeta(columnResizingPluginKey, { setHandle: firstCell }));
  const cell = editor.view.dom.querySelector("th");
  Object.defineProperty(cell, "offsetWidth", { configurable: true, value: 120 });
  const start = new win.MouseEvent("mousedown", { clientX: 120, buttons: 1, bubbles: true });
  cell.dispatchEvent(start);
  win.dispatchEvent(new win.MouseEvent("mousemove", { clientX: 200, buttons: 1 }));
  win.dispatchEvent(new win.MouseEvent("mouseup", { clientX: 200 }));
  const width = table(editor).node.firstChild.firstChild.attrs.colwidth?.[0];
  assert.equal(width, 200);
  const saved = serializeArticle(editor.getHTML());
  assert.ok(saved.startsWith(ARTICLE_HTML_PREFIX));
  const reopened = create(saved);
  assert.equal(table(reopened).node.firstChild.firstChild.attrs.colwidth[0], width);
  assert.equal(table(reopened).node.textContent, "Nội dung ô");
  const published = articleHtml(saved);
  assert.match(published, /colwidth="200"/);
  assert.match(published, /width: 200px/);
  assert.ok(!published.includes("article-table-drag"));
  assert.ok(!published.includes("contenteditable"));
  const output = new URL("../../.artifacts/article-editor-checks/", import.meta.url);
  await mkdir(output, { recursive: true });
  await writeFile(new URL("visual-content.json", output), JSON.stringify({ content: saved }));
});

test("tables move between paragraphs in both directions and undo as one edit", () => {
  const editor = create("Trước\n\nSau");
  editor.commands.setTextSelection(6);
  editor.commands.insertTable({ rows: 2, cols: 2 });
  editor.commands.insertContent("Bảng di chuyển");
  const position = table(editor).pos;
  assert.ok(moveTableAt(editor.view, position, 1));
  assert.ok(table(editor).pos > position);
  assert.ok(moveTableAt(editor.view, table(editor).pos, -1));
  assert.equal(table(editor).pos, position);
  const reopened = create(serializeArticle(editor.getHTML()));
  assert.equal(table(reopened).pos, position);
  assert.ok(reopened.state.doc.textContent.includes("Trước"));
  assert.ok(reopened.state.doc.textContent.includes("Sau"));
  assert.ok(reopened.state.doc.textContent.includes("Bảng di chuyển"));
  const handle = editor.view.dom.querySelector(".article-table-drag");
  assert.equal(handle.draggable, true);
  handle.dispatchEvent(
    new win.KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true }),
  );
  assert.ok(table(editor).pos > position);
});

test("the table drag handle starts a native move and drop moves the whole table", () => {
  const editor = create("Trước\n\nSau");
  editor.commands.setTextSelection(6);
  editor.commands.insertTable({ rows: 2, cols: 2 });
  editor.commands.insertContent("Nội dung kéo");
  const original = table(editor).pos;
  const handle = editor.view.dom.querySelector(".article-table-drag");
  handle.dispatchEvent(new win.MouseEvent("mousedown", { bubbles: true, button: 0 }));
  const transfer = new win.DataTransfer();
  const dragEvent = (type, y) => {
    const event = new win.MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: 10,
      clientY: y,
    });
    Object.defineProperty(event, "dataTransfer", { value: transfer });
    return event;
  };
  // DOM simulation has no layout: provide the positions hit-testing would resolve in a browser.
  const originalHitTest = editor.view.posAtCoords;
  editor.view.posAtCoords = () => ({ pos: original + 1, inside: original });
  handle.dispatchEvent(dragEvent("dragstart", 10));
  assert.ok(editor.view.dragging);
  assert.equal(editor.view.dragging.slice.content.firstChild.type.name, "table");
  editor.view.posAtCoords = () => ({ pos: editor.state.doc.content.size, inside: -1 });
  editor.view.dom.dispatchEvent(dragEvent("drop", 80));
  editor.view.posAtCoords = originalHitTest;
  assert.ok(table(editor).pos > original);
  assert.equal(editor.view.dom.querySelectorAll("table").length, 1);
  assert.ok(table(editor).node.textContent.includes("Nội dung kéo"));
});

test("H2–H6 and Normal preserve paragraph text and inline marks", () => {
  const editor = create("**Giữ nguyên** nội dung");
  for (const level of [2, 3, 4, 5, 6]) {
    editor.commands.setTextSelection(2);
    editor.commands.setHeading({ level });
    assert.equal(editor.getAttributes("heading").level, level);
    assert.match(
      editor.getHTML(),
      new RegExp(`<h${level}><strong>Giữ nguyên</strong> nội dung</h${level}>`),
    );
  }
  editor.commands.setParagraph();
  assert.match(editor.getHTML(), /<p><strong>Giữ nguyên<\/strong> nội dung<\/p>/);
  assert.equal(editor.isActive("heading"), false);
});

test("saved visual HTML and legacy Markdown share safe, consistent rendering", () => {
  const legacy = "## Tiêu đề\n\n**Đậm** và *nghiêng*\n\n- Một\n- Hai";
  const editor = create(legacy);
  const saved = serializeArticle(editor.getHTML());
  const reopened = create(saved);
  assert.equal(reopened.getHTML(), editor.getHTML());
  assert.equal(articleHtml(saved), articleHtml(serializeArticle(reopened.getHTML())));
  assert.ok(hasArticleContent(saved));
  assert.equal(hasArticleContent(serializeArticle("<p></p>")), false);
  const hostile = serializeArticle(
    '<p onclick="alert(1)" id="x" style="background:url(javascript:x)"><u>Đúng</u></p><script>alert(2)</script><iframe srcdoc="x"></iframe><a href="javascript:alert(3)">Link</a><table style="width: 320px;background:red"><tbody><tr><td colwidth="160" onmouseover="alert(4)">Ô</td></tr></tbody></table>',
  );
  assert.match(hostile, /<u>Đúng<\/u>/);
  assert.match(hostile, /width: 320px/);
  assert.ok(!/onclick|onmouseover|javascript:|<script|<iframe|background:|id="x"/.test(hostile));
});
