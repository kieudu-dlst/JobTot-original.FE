import { after, test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(root, "../.artifacts/recruitment-content-checks");
await mkdir(output, { recursive: true });
const detailPath = path
  .join(root, "src/pages/job-detail/ui/job-detail-page.jsx")
  .replaceAll("\\", "/");
const editorPath = path
  .join(root, "src/pages/employer-campaigns/ui/markdown-editor.jsx")
  .replaceAll("\\", "/");
const server = await createServer({
  root,
  configFile: path.join(root, "vite.config.js"),
  cacheDir: path.join(output, "vite-cache"),
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false },
  plugins: [
    {
      name: "job-detail-fixture",
      enforce: "pre",
      async load(id) {
        if (id === `${editorPath}?preview-fixture`) {
          const source = await readFile(editorPath, "utf8");
          return source.replace("useState(false)", "useState(true)");
        }
        if (id !== detailPath) return;
        // Supply API-shaped data as the initial state for SSR. Production source stays unchanged.
        const source = await readFile(id, "utf8");
        const state = "const [job, setJob] = useState(null);";
        assert.ok(source.includes(state), "Job detail fixture must seed the job state");
        return (
          source.replace(
            state,
            "const [job, setJob] = useState(() => globalThis.__jobContentFixture);",
          ) + "\nexport { JobDetail as JobDetailFixture };"
        );
      },
    },
  ],
});
after(async () => {
  delete globalThis.__jobContentFixture;
  await server.close();
});
const { RecruitmentContent } = await server.ssrLoadModule("/src/shared/ui/recruitment-content.jsx");
const render = (content) => renderToStaticMarkup(createElement(RecruitmentContent, { content }));

test("existing posts display bold titles without editing or resaving their source", () => {
  const source =
    "• **Lên kế hoạch và sản xuất nội dung**: Website, Fanpage.\n\n• **Truyền thông nội bộ:** Các sự kiện.";
  const html = render(JSON.parse(JSON.stringify(source)));
  assert.match(html, /• <strong>Lên kế hoạch và sản xuất nội dung<\/strong>:/);
  assert.match(html, /<strong>Truyền thông nội bộ:<\/strong>/);
  assert.ok(!html.includes("**"));
});
test("plain text keeps single line breaks, paragraph breaks and Vietnamese characters", () => {
  const html = render("Nội dung thuần & tiếng Việt\nDòng thứ hai\n\nĐoạn tiếp theo");
  assert.match(html, /Nội dung thuần &amp; tiếng Việt<br\/>\nDòng thứ hai/);
  assert.match(html, /<p>Đoạn tiếp theo<\/p>/);
});
test("bold, italic and HTML underline can be nested and combined", () => {
  const html = render(
    "**Đậm và *nghiêng* cùng <u>gạch chân</u>**\n<u>**Đậm gạch chân** và *nghiêng*</u>",
  );
  assert.match(html, /<strong>Đậm và <em>nghiêng<\/em> cùng <u>gạch chân<\/u><\/strong>/);
  assert.match(html, /<u><strong>Đậm gạch chân<\/strong> và <em>nghiêng<\/em><\/u>/);
});
test("editor headings, both list types, quotes and code are rendered semantically", () => {
  const html = render(
    "## Nội dung\n### Chi tiết\n- **Mục đậm**\n- Mục hai\n\n1. Bước đầu\n2. Bước sau\n\n> Trích dẫn\n\n`mã`\n\n```text\n**giữ nguyên trong mã**\n```",
  );
  for (const tag of ["h3", "h4", "ul", "ol", "li", "blockquote", "code", "pre"]) {
    assert.ok(html.includes(`<${tag}`), tag);
  }
  assert.match(html, /<pre><code>\*\*giữ nguyên trong mã\*\*/);
});
test("GFM strike-through, tables and nested lists work alongside editor formatting", () => {
  const html = render("~~Bỏ~~\n\n- Mục chính\n  - *Mục con*\n\n| Cột |\n| --- |\n| **Ô** |");
  assert.match(html, /<del>Bỏ<\/del>/);
  assert.equal((html.match(/<ul>/g) || []).length, 2);
  assert.match(html, /<table>/);
  assert.match(html, /<td><strong>Ô<\/strong><\/td>/);
});
test("legacy HTML retains only necessary formatting and safe links", () => {
  const html = render(
    '<p><b>Đậm</b> <i>Nghiêng</i> <u>Gạch chân</u><br>Xuống dòng</p><ol start="3"><li>Mục ba</li></ol><a href="https://example.com" title="Chi tiết" target="_blank">Link</a>',
  );
  assert.match(html, /<b>Đậm<\/b>/);
  assert.match(html, /<i>Nghiêng<\/i>/);
  assert.match(html, /<u>Gạch chân<\/u>/);
  assert.match(html, /<ol start="3">/);
  assert.match(html, /href="https:\/\/example.com"/);
  assert.ok(!html.includes("target="));
});
test("HTML events, CSS, DOM identifiers, active embeds and scripts are removed", () => {
  const html = render(
    '<p onclick="alert(1)" style="color:red" id="location" class="fixed"><u onmouseover="alert(2)">An toàn</u></p><script>alert(3)</script><style>body{display:none}</style><iframe srcdoc="x">ẩn</iframe><svg onload="alert(4)"><a href="javascript:alert(5)">x</a></svg><img src="x" onerror="alert(6)"><form><input autofocus></form>',
  );
  assert.match(html, /<u>An toàn<\/u>/);
  for (const forbidden of [
    "onclick",
    "onmouseover",
    "onerror",
    "style=",
    "id=",
    "fixed",
    "<script",
    "<style",
    "<iframe",
    "<svg",
    "<img",
    "<form",
    "<input",
    "alert(",
  ]) {
    assert.ok(!html.includes(forbidden), forbidden);
  }
});
test("unsafe URL schemes are blocked in both Markdown and HTML", () => {
  for (const source of [
    "[x](javascript:alert%281%29)",
    "[x](data:text/html,unsafe)",
    '<a href="jav&#x61;script:alert(1)">x</a>',
    '<a href="javascript&#58;alert(1)">x</a>',
    '<a href="vbscript:msgbox(1)">x</a>',
  ]) {
    const html = render(source);
    assert.ok(!/href="(?:javascript|vbscript|data):/i.test(html), source);
  }
  assert.match(render("[An toàn](https://example.com)"), /href="https:\/\/example.com"/);
});

test("editor offers underline and its preview uses the same safe renderer as job detail", async () => {
  const value = "**Đậm** *nghiêng* <u>gạch chân</u>\n\n1. Một\n2. Hai\n\n<script>alert(1)</script>";
  const { MarkdownEditor } = await server.ssrLoadModule(
    "/src/pages/employer-campaigns/ui/markdown-editor.jsx",
  );
  const props = { label: "Mô tả công việc", value, onChange() {} };
  const editHtml = renderToStaticMarkup(createElement(MarkdownEditor, props));
  assert.match(editHtml, /aria-label="Mô tả công việc: U"/);
  // The input remains the original source, ready to be sent unchanged to the API.
  assert.ok(editHtml.includes("&lt;u&gt;gạch chân&lt;/u&gt;"));
  const { MarkdownEditor: PreviewEditor } = await server.ssrLoadModule(
    "/src/pages/employer-campaigns/ui/markdown-editor.jsx?preview-fixture",
  );
  const previewHtml = renderToStaticMarkup(createElement(PreviewEditor, props));
  assert.ok(previewHtml.includes(render(value)));
  assert.ok(!previewHtml.includes("<script>"));
});

test("actual job detail renders old and new API-shaped posts in both content sections", async () => {
  const { MemoryRouter } = await import("react-router-dom");
  const { SessionContext } = await server.ssrLoadModule(
    "/src/features/authenticate/model/session-context.js",
  );
  const { SavedJobsContext } = await server.ssrLoadModule(
    "/src/features/save-job/model/saved-jobs-context.js",
  );
  const { ToastContext } = await server.ssrLoadModule("/src/shared/ui/toast-context.js");
  const { JobDetailFixture } = await server.ssrLoadModule(
    "/src/pages/job-detail/ui/job-detail-page.jsx",
  );
  const examples = {
    old: {
      description: "• **Lên kế hoạch và sản xuất nội dung**: Công việc.\nDòng tiếp theo",
      requirements: "- **Kinh nghiệm**: Có kinh nghiệm\n- Giao tiếp tốt",
    },
    new: {
      description:
        "## Công việc\n**Đậm**, *nghiêng*, <u>gạch chân</u>\n\n- Nội dung một\n- Nội dung hai",
      requirements: "**Yêu cầu** *phù hợp* <u>bắt buộc</u>\n\n1. Bước một\n2. Bước hai",
    },
  };
  for (const [name, content] of Object.entries(examples)) {
    globalThis.__jobContentFixture = JSON.parse(
      JSON.stringify({
        id: name,
        title: "Tin kiểm thử",
        companyId: "company",
        companyName: "Công ty kiểm thử",
        expiresAt: "2099-12-31T00:00:00Z",
        ...content,
      }),
    );
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: [`/jobs/${name}`] },
        createElement(
          SessionContext.Provider,
          { value: { account: null, loading: false } },
          createElement(
            ToastContext.Provider,
            { value: () => {} },
            createElement(
              SavedJobsContext.Provider,
              { value: { savedIds: [], pendingIds: [], savedLoading: false } },
              createElement(JobDetailFixture, { id: name }),
            ),
          ),
        ),
      ),
    );
    assert.match(html, /Mô tả công việc/);
    assert.match(html, /Yêu cầu ứng viên/);
    assert.equal((html.match(/class="recruitment-content /g) || []).length, 2);
    assert.ok(!html.includes("**"));
    assert.match(html, /<strong>/);
    if (name === "new")
      for (const tag of ["em", "u", "ul", "ol"]) assert.ok(html.includes(`<${tag}>`), tag);
    await writeFile(path.join(output, `${name}-job-detail.html`), html);
  }
});
