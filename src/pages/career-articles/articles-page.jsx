import { mediaUrl } from "@/shared/lib/media-url";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthHeader } from "@/widgets/auth-header";
import { AuthFooter } from "@/widgets/auth-footer";
import { readArticles } from "@/shared/api/career-articles";
import { ArticleBody } from "@/shared/ui/article-body";
import { PageBreadcrumb } from "@/shared/ui/page-breadcrumb";
import { useCandidateSession } from "@/features/authenticate";
import "./articles.css";
import "./markdown-editor.css";

export function ArticlesPage() {
  const { id } = useParams();
  return <ArticlePageContent key={id || "list"} id={id} />;
}
function ArticlePageContent({ id }) {
  const { account, loading } = useCandidateSession();
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setData(null);
      setError("");
      try {
        const result = await readArticles(id, controller.signal);
        if (!controller.signal.aborted) setData(result);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, attempt]);
  return (
    <div className="articles-page font-roboto">
      <AuthHeader userName={account?.fullName} loading={loading} />
      <main className="page-container">
        <title>{data?.title || "Cẩm nang nghề nghiệp"} | Job Tốt</title>
        <PageBreadcrumb
          parents={id ? [{ to: "/career-articles", label: "Danh sách bài viết" }] : []}
          current={id ? data?.title || "Chi tiết bài viết" : "Danh sách bài viết"}
        />
        {error ? (
          <p role="alert">
            {error}
            <button className="company-primary" onClick={() => setAttempt((value) => value + 1)}>
              Thử lại
            </button>
          </p>
        ) : !data ? (
          <p role="status">Đang tải bài viết…</p>
        ) : id ? (
          <article className="article-detail">
            <small>{data.category}</small>
            <h1>{data.title}</h1>
            <p className="article-summary">{data.summary}</p>
            {data.coverUrl && (
              <img className="article-cover" src={mediaUrl(data.coverUrl)} alt={data.title} />
            )}
            <ArticleBody content={data.content} />
          </article>
        ) : (
          <>
            <h1>Cẩm nang & Báo cáo thị trường tuyển dụng</h1>
            <div className="article-catalog">
              {data.map((article) => (
                <article key={article.id}>
                  {article.coverUrl && (
                    <img
                      className="article-cover"
                      src={mediaUrl(article.coverUrl)}
                      alt={article.title}
                    />
                  )}
                  <small>{article.category}</small>
                  <h2>
                    <Link to={`/career-articles/${article.id}`}>{article.title}</Link>
                  </h2>
                  <p>{article.summary}</p>
                  <Link to={`/career-articles/${article.id}`}>Khám phá ngay →</Link>
                </article>
              ))}
            </div>
            {!data.length && <p>Chưa có bài viết được xuất bản.</p>}
          </>
        )}
      </main>
      <AuthFooter />
    </div>
  );
}
