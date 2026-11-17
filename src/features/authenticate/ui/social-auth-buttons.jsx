import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { externalAuth } from "../api/external-auth";
import "./social-auth.css";

export function SocialAuthButtons({ role, mode }) {
  const { search } = useLocation();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  return (
    <div className="social-auth">
      <div className="social-auth-buttons" aria-label="Xác thực bằng Google">
        <button
          type="button"
          className="social-auth-button social-auth-google"
          disabled={pending}
          onClick={async () => {
            if (busy.current) return;
            busy.current = true;
            setPending(true);
            setMessage("");
            try {
              const result = await externalAuth.start(
                role,
                "google",
                mode,
                new URLSearchParams(search).get("returnTo"),
              );
              window.location.assign(result.authorizationUrl);
            } catch (error) {
              setMessage(error.message || "Không thể kết nối Google. Vui lòng thử lại.");
              busy.current = false;
              setPending(false);
            }
          }}
        >
          <span aria-hidden="true" className="social-auth-mark">
            G
          </span>
          {pending
            ? "Đang chuyển tới Google…"
            : `${mode === "register" ? "Đăng ký" : "Đăng nhập"} bằng Google`}
        </button>
      </div>
      {message && (
        <p className="social-auth-message" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
