import { useMemo } from "react";
import { articleHtml } from "@/shared/lib/article-content";
import "./article-content.css";

export function ArticleBody({ content = "" }) {
  const html = useMemo(() => articleHtml(content), [content]);
  return <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
