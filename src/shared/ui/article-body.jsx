import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function escapeHtml() {
  return function walk(node) {
    if (node.type === "html") node.type = "text";
    node.children?.forEach(walk);
  };
}

export function ArticleBody({ content = "" }) {
  return (
    <div className="article-body">
      <Markdown
        remarkPlugins={[remarkGfm, escapeHtml]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
