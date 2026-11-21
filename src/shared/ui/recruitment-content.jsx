import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import "./recruitment-content.css";

// Recruitment text may contain Markdown and inline HTML (notably <u>).
// Parse HTML first, then allow only formatting; never pass through author-supplied props.
const schema = {
  tagNames: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "ins",
    "s",
    "del",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "pre",
    "code",
    "hr",
    "a",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  attributes: {
    a: ["href", "title"],
    ol: ["start"],
    th: ["align"],
    td: ["align"],
  },
  protocols: { href: ["http", "https", "mailto"] },
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
  ],
};
const components = {
  h1: "h3",
  h2: "h3",
  h3: "h4",
  h4: "h5",
  h5: "h6",
  h6: "h6",
  a: ({ href, title, children }) => (
    <a href={href} title={title} rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export function RecruitmentContent({ content = "", className = "" }) {
  return (
    <div className={`recruitment-content ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
        components={components}
      >
        {content || ""}
      </Markdown>
    </div>
  );
}
