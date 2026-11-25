import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pause, Play } from "lucide-react";

const posters = [
  { image: "1.png", title: "Cơ hội tốt bắt đầu từ hôm nay — khám phá việc làm phù hợp", to: "/jobs" },
  { image: "2.png", title: "Tuyển dụng thông minh — khám phá Trợ lý AI hỏi đáp", to: "/ai/career-search" },
  { image: "3.png", title: "Liên lạc trực tiếp giữa ứng viên và nhà tuyển dụng", to: "/messages" },
];

export function HomePosters() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => setActive((index) => (index + 1) % posters.length), 5000);
    return () => clearTimeout(timer);
  }, [active, paused]);
  return (
    <section className="home-posters" aria-label="Khám phá JobTot" aria-roledescription="trình chiếu">
      <h1 className="sr-only">JobTot — Tìm việc làm và phát triển sự nghiệp</h1>
      <div className="home-poster-stage">
        {posters.map((poster, index) => <Link key={poster.image} to={poster.to} className="home-poster-slide" hidden={active !== index} aria-label={poster.title}>
          <img src={`/images/home-posters/${poster.image}`} alt={poster.title} fetchPriority={index === 0 ? "high" : "auto"} decoding="async" />
        </Link>)}
      </div>
      <div className="home-poster-controls">
        <div className="home-poster-dots" aria-label="Chọn poster">
          {posters.map((poster, index) => <button key={poster.image} type="button" aria-label={`Xem poster ${index + 1}: ${poster.title}`} aria-pressed={active === index} onClick={() => setActive(index)}><span /></button>)}
        </div>
        <button className="home-poster-play" type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Tiếp tục chuyển poster" : "Tạm dừng chuyển poster"}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
      </div>
    </section>
  );
}
