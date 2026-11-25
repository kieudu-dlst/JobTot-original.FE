import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { citationView, safeSourceUrl, suggestionsDocument } from "../model/career-search";
import "@/shared/ui/recruitment-content.css";

const components = {
  a: ({ href, children }) =>
    safeSourceUrl(href) ? (
      <a href={safeSourceUrl(href)} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
  img: () => null,
};
export function CareerAnswer({ result, question }) {
  const { sources, citations } = citationView(result);
  const labels = {
    grounded: "Có nguồn từ metadata tra cứu; bạn nên mở nguồn để đối chiếu.",
    no_sources: "Có thông tin tra cứu nhưng chưa có nguồn để đối chiếu.",
    not_grounded: "Câu trả lời từ AI, không tra cứu web. Bạn nên kiểm tra lại thông tin quan trọng.",
  };
  return (
    <article className="ai-answer" aria-labelledby="ai-answer-title">
      <span className="ai-eyebrow">CÂU HỎI ĐÃ GỬI</span>
      <h2 id="ai-answer-title">{question}</h2>
      <p className="ai-grounding">{labels[result.groundingStatus] || labels.not_grounded}</p>
      {result.isTruncated && (
        <p role="status">Câu trả lời đã chạm giới hạn sinh nội dung. Bạn có thể thu hẹp câu hỏi.</p>
      )}
      <div className="recruitment-content ai-markdown">
        <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} skipHtml components={components}>
          {result.answer}
        </Markdown>
      </div>
      {citations.length > 0 && (
        <section aria-labelledby="ai-citations">
          <h3 id="ai-citations">Trích dẫn theo đoạn</h3>
          <p>Trích dẫn được trình bày riêng để giữ nguyên câu trả lời và cú pháp Markdown.</p>
          {citations.map((citation, index) => (
            <div
              className="ai-citation"
              key={`${citation.startIndex}-${citation.endIndex}-${index}`}
            >
              <blockquote>{citation.text}</blockquote>
              <div>
                {citation.sourceIds.map((id) => {
                  const source = sources.find((s) => s.id === id);
                  return (
                    <a
                      key={id}
                      href={safeSourceUrl(source.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {source.title || source.id}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}
      {sources.length > 0 && (
        <section aria-labelledby="ai-sources">
          <h3 id="ai-sources">Nguồn tham khảo</h3>
          <ul className="ai-sources">
            {sources.map((source, index) => (
              <li key={`${source.id}-${index}`}>
                <a href={safeSourceUrl(source.url)} target="_blank" rel="noopener noreferrer">
                  {source.title || source.id}
                </a>
                <span>{new URL(source.url).hostname}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {Array.isArray(result.searchQueries) && result.searchQueries.length > 0 && (
        <details>
          <summary>Truy vấn tìm kiếm được trả về</summary>
          <ul>
            {result.searchQueries
              .filter((q) => typeof q === "string")
              .map((q, i) => (
                <li key={i}>{q}</li>
              ))}
          </ul>
        </details>
      )}
      {typeof result.searchSuggestionsHtml === "string" && result.searchSuggestionsHtml && (
        <section aria-labelledby="ai-google-suggestions">
          <h3 id="ai-google-suggestions">Gợi ý tìm kiếm từ Google</h3>
          <p>Vùng nội dung riêng có thể cuộn. Liên kết mở trong tab mới.</p>
          <iframe
            title="Google Search Suggestions"
            className="ai-suggestions"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            srcDoc={suggestionsDocument(result.searchSuggestionsHtml)}
          />
        </section>
      )}
      <p className="ai-disclaimer">
        Nội dung do AI tổng hợp, có thể chưa chính xác hoặc đầy đủ. Hãy mở nguồn để đối chiếu trước
        khi sử dụng.
      </p>
    </article>
  );
}
