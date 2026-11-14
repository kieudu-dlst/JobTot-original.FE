import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeParse from "rehype-parse";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

export const ARTICLE_HTML_PREFIX = "<!--jobtot:article-html:v1-->";
export const ARTICLE_MAX_LENGTH = 20000;

// Only table dimensions survive inline CSS. Author styles, events and identifiers do not.
function normalizeArticleHtml() {
  return function walk(node) {
    if (node.type === "element") {
      if (node.tagName === "h1") node.tagName = "h2";
      const props = node.properties || {};
      if (props.style) {
        const widths = String(props.style)
          .split(";")
          .map((part) => part.trim())
          .filter((part) =>
            /^(?:min-width|width):\s*(?:\d{1,4}(?:\.\d{1,2})?px|100%)$/i.test(part),
          );
        props.style = ["table", "col"].includes(node.tagName) ? widths.join(";") : "";
      }
      if (props.colwidth && !/^\d{1,4}(?:,\d{1,4})*$/.test(String(props.colwidth)))
        delete props.colwidth;
      for (const key of ["colSpan", "rowSpan", "width", "height"]) {
        if (props[key] != null && !(Number(props[key]) >= 1 && Number(props[key]) <= 10000))
          delete props[key];
      }
      if (node.tagName === "a") {
        props.target = "_blank";
        props.rel = ["noopener", "noreferrer"];
      }
    }
    node.children?.forEach(walk);
  };
}

const schema = {
  tagNames: [
    "p",
    "br",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "del",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "img",
    "table",
    "colgroup",
    "col",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "pre",
    "code",
    "hr",
  ],
  attributes: {
    a: ["href", "title", ["target", "_blank"], ["rel", "noopener", "noreferrer"]],
    img: ["src", "alt", "title", "width", "height"],
    ol: ["start"],
    table: ["style"],
    col: ["style", "width", "span"],
    td: ["colSpan", "rowSpan", "colwidth", "align"],
    th: ["colSpan", "rowSpan", "colwidth", "align"],
  },
  protocols: { href: ["http", "https", "mailto"], src: ["http", "https"] },
  strip: [
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "svg",
    "math",
    "template",
    "textarea",
    "title",
    "form",
    "input",
    "button",
  ],
};
const htmlProcessor = unified()
  .use(rehypeParse, { fragment: true })
  .use(normalizeArticleHtml)
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);
const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkBreaks)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(normalizeArticleHtml)
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

export function articleHtml(content = "") {
  const text = typeof content === "string" ? content : "";
  return String(
    text.startsWith(ARTICLE_HTML_PREFIX)
      ? htmlProcessor.processSync(text.slice(ARTICLE_HTML_PREFIX.length))
      : markdownProcessor.processSync(text),
  );
}
export function serializeArticle(html) {
  return ARTICLE_HTML_PREFIX + String(htmlProcessor.processSync(html));
}
export function hasArticleContent(content) {
  const html = articleHtml(content);
  return (
    /<(?:img|table|hr)\b/.test(html) ||
    Boolean(html.replace(/<[^>]*>/g, "").replace(/(?:&#x?a0;|&nbsp;|\s)/gi, ""))
  );
}
