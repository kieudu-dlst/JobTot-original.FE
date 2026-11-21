import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader, TableView } from "@tiptap/extension-table";
import { NodeSelection } from "@tiptap/pm/state";

export function moveTableAt(view, position, direction) {
  const { doc } = view.state;
  const node = doc.nodeAt(position);
  if (node?.type.name !== "table") return false;
  const $pos = doc.resolve(position);
  const index = $pos.index();
  const sibling = $pos.parent.maybeChild(index + direction);
  if (!sibling) return false;
  const target = direction < 0 ? position - sibling.nodeSize : position + sibling.nodeSize;
  const tr = view.state.tr.delete(position, position + node.nodeSize).insert(target, node);
  tr.setSelection(NodeSelection.create(tr.doc, target)).scrollIntoView();
  view.dispatch(tr);
  view.focus();
  return true;
}

export function selectedTablePosition(editor) {
  const { selection } = editor.state;
  if (selection instanceof NodeSelection && selection.node.type.name === "table")
    return selection.from;
  for (let depth = selection.$from.depth; depth > 0; depth--) {
    if (selection.$from.node(depth).type.name === "table") return selection.$from.before(depth);
  }
  return null;
}

const ArticleTable = Table.extend({
  draggable: true,
  addNodeView() {
    return ({ node, view, getPos, HTMLAttributes }) => {
      const tableView = new TableView(node, this.options.cellMinWidth, view, HTMLAttributes);
      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "article-table-drag";
      handle.draggable = true;
      handle.contentEditable = "false";
      handle.setAttribute("data-drag-handle", "");
      handle.setAttribute("aria-label", "Di chuyển bảng; Alt và phím mũi tên lên hoặc xuống");
      handle.title = "Kéo bảng giữa các đoạn · Alt+↑ / Alt+↓";
      handle.textContent = "⠿";
      handle.addEventListener("mousedown", () => {
        const pos = getPos();
        if (typeof pos === "number")
          view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)));
      });
      handle.addEventListener("keydown", (event) => {
        if (event.altKey && ["ArrowUp", "ArrowDown"].includes(event.key)) {
          event.preventDefault();
          const pos = getPos();
          if (typeof pos === "number") moveTableAt(view, pos, event.key === "ArrowUp" ? -1 : 1);
        }
      });
      tableView.dom.insertBefore(handle, tableView.table);
      tableView.dom.classList.add("article-table-editor");
      tableView.selectNode = () => tableView.dom.classList.add("ProseMirror-selectednode");
      tableView.deselectNode = () => tableView.dom.classList.remove("ProseMirror-selectednode");
      tableView.stopEvent = (event) =>
        handle.contains(event.target) && !event.type.startsWith("drag") && event.type !== "drop";
      return tableView;
    };
  },
});

export function createArticleExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4, 5, 6] },
      link: {
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      },
      dropcursor: { color: "#ff5722", width: 3 },
    }),
    Image.configure({ allowBase64: false }),
    ArticleTable.configure({
      resizable: true,
      cellMinWidth: 50,
      lastColumnResizable: false,
      allowTableNodeSelection: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
  ];
}
