import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { readResponseJson } from "@/shared/api/read-response-json";
import "./company-map.css";

async function resolvePublicMap(url, signal) {
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const response = await fetch(`${base}/api/companies/map?url=${encodeURIComponent(url)}`, {
    signal,
  });
  const data = await readResponseJson(response);
  if (!response.ok)
    throw new Error(
      data?.detail ||
        "Kh\u00f4ng th\u1ec3 t\u1ea3i b\u1ea3n \u0111\u1ed3. Vui l\u00f2ng th\u1eed l\u1ea1i.",
    );
  return data;
}

export function CompanyMap({ address, province, resolveMap = resolvePublicMap }) {
  const [resolved, setResolved] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const input = address?.trim() || "";
  const link = /^https?:\/\//i.test(input);
  useEffect(() => {
    if (!link) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const result = await resolveMap(input, controller.signal);
        if (!controller.signal.aborted) setResolved({ input, url: result.url });
      } catch (error) {
        if (!controller.signal.aborted) setResolved({ input, error: error.message });
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input, link, attempt, resolveMap]);
  if (!input) return <p className="ec-empty">Cập nhật địa chỉ để hiển thị bản đồ.</p>;
  const result = resolved?.input === input ? resolved : null;
  const map = link
    ? result?.url && mapLocation(result.url)
    : {
        src: `https://www.google.com/maps?q=${encodeURIComponent(`${input} ${province || ""}`)}&output=embed`,
        href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${input} ${province || ""}`)}`,
      };
  return (
    <>
      {map ? (
        <iframe
          className="ec-map"
          title="Bản đồ trụ sở doanh nghiệp"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={map.src}
        />
      ) : result ? (
        <p className="ec-empty" role="alert">
          {result.error || "Không đọc được vị trí. Hãy dùng link chia sẻ đầy đủ hoặc địa chỉ."}{" "}
          <button
            type="button"
            className="ec-outline"
            onClick={() => {
              setResolved(null);
              setAttempt((value) => value + 1);
            }}
          >
            Thử lại
          </button>
        </p>
      ) : (
        <p className="ec-empty" role="status">
          Đang đọc vị trí từ Google Maps…
        </p>
      )}
      {(!link ||
        /^https:\/\/(maps\.app\.goo\.gl|maps\.google\.com|www\.google\.com|google\.com|goo\.gl)\//i.test(
          input,
        )) && (
        <a
          className="ec-map-link"
          target="_blank"
          rel="noopener noreferrer"
          href={map?.href || input}
        >
          Mở Google Maps <ArrowRight />
        </a>
      )}
    </>
  );
}

function mapLocation(value) {
  const url = new URL(value);
  if (url.pathname.startsWith("/maps/embed")) return { src: value, href: value };
  const decode = (text) => {
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  };
  const text = decode(value);
  const pin = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  const center = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const place = url.pathname.match(/\/maps\/place\/([^/]+)/);
  const query = pin
    ? `${pin[1]},${pin[2]}`
    : url.searchParams.get("query") ||
      url.searchParams.get("q") ||
      (place && decode(place[1]).replaceAll("+", " ")) ||
      (center && `${center[1]},${center[2]}`);
  return query
    ? {
        src: `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`,
        href: value,
      }
    : null;
}
