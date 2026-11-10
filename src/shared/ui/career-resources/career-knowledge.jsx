import { mediaUrl } from "@/shared/lib/media-url";
import { ArrowRight, Building2, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { readArticles } from "@/shared/api/career-articles";
import "./career-knowledge.css";

export function CareerKnowledge() {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await readArticles(null, controller.signal);
        if (!controller.signal.aborted) {
          setArticles(data.slice(0, 4));
          setError("");
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [attempt]);
  return (
    <section className="career-knowledge" aria-label="Cẩm nang nghề nghiệp">
      <div className="knowledge-heading">
        <div>
          <p>
            <BookOpen />
            KIẾN THỨC THỰC CHIẾN TỪ CHUYÊN GIA
          </p>
          <h2>Cẩm nang & Báo cáo thị trường tuyển dụng {new Date().getFullYear()}</h2>
        </div>
        <Link to="/career-articles" className="knowledge-link">
          Xem tất cả bài viết <ArrowRight />
        </Link>
      </div>
      {error && (
        <p role="alert">
          {error}
          <button className="knowledge-link" onClick={() => setAttempt((value) => value + 1)}>
            Thử lại
          </button>
        </p>
      )}
      <div className="knowledge-article-grid">
        {articles.map(({ id, category, title, summary: description, updatedAt, coverUrl }, i) => (
          <article key={id}>
            {coverUrl ? (
              <Link to={`/career-articles/${id}`} className="knowledge-cover">
                <img src={mediaUrl(coverUrl)} alt={title} />
              </Link>
            ) : (
              <div className={`knowledge-article-art article-art-${i}`} aria-hidden="true">
                {i % 2 ? <Building2 /> : <BookOpen />}
                <span>JOB TỐT / {category.toUpperCase()}</span>
              </div>
            )}
            <div>
              <small>
                {category} · {new Date(updatedAt).getFullYear()}
              </small>
              <h3>{title}</h3>
              <p>{description}</p>
              <Link to={`/career-articles/${id}`} className="knowledge-link">
                Khám phá ngay <ArrowRight />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
