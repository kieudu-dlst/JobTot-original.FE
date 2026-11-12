import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { externalAuth } from "../api/external-auth";
import "./social-auth.css";

const providers = [
  ["google", "Google", "G"],
  ["facebook", "Facebook", "f"],
  ["linkedin", "LinkedIn", "in"],
];
export function SocialAuthButtons({ role, mode }) {
  const { search } = useLocation();
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  return (
    <div className="social-auth">
      <div className="social-auth-buttons" aria-label="Xác thực bằng mạng xã hội">
        {providers
          .filter(([provider]) => role === "candidate" || provider === "google")
          .map(([provider, label, mark]) => (
            <button
              key={provider}
              type="button"
              className={`social-auth-button social-auth-${provider}`}
              disabled={Boolean(pending)}
              onClick={async () => {
                if (busy.current) return;
                busy.current = true;
                setPending(provider);
                setMessage("");
                try {
                  const result = await externalAuth.start(
                    role,
                    provider,
                    mode,
                    new URLSearchParams(search).get("returnTo"),
                  );
                  window.location.assign(result.authorizationUrl);
                } catch (error) {
                  setMessage(error.message || "Không thể kết nối nhà cung cấp. Vui lòng thử lại.");
                  busy.current = false;
                  setPending("");
                }
              }}
            >
              <span aria-hidden="true" className="social-auth-mark">
                {mark}
              </span>
              {pending === provider
                ? "Đang chuyển tới nhà cung cấp…"
                : `${mode === "register" ? "Đăng ký" : "Đăng nhập"} bằng ${label}`}
            </button>
          ))}
      </div>
      {message && (
        <p className="social-auth-message" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
