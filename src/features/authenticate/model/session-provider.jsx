import { useEffect, useRef, useState } from "react";
import { candidateAuth } from "../api/candidate-auth";
import { clearTokens } from "@/shared/api/candidate-session";
import { SessionContext } from "./session-context";

export function SessionProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const version = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const current = version.current;
    const timer = setTimeout(() => {
      candidateAuth
        .me(controller.signal)
        .then((value) => {
          if (!controller.signal.aborted && current === version.current) setAccount(value);
        })
        .catch((failure) => {
          if (!controller.signal.aborted && current === version.current && failure.status !== 401)
            setError(failure.message);
        })
        .finally(() => {
          if (!controller.signal.aborted && current === version.current) setLoading(false);
        });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);
  function signIn(value) {
    if (!value) clearTokens();
    version.current += 1;
    setAccount(value);
    setError("");
    setLoading(false);
  }
  useEffect(() => {
    const ended = () => {
      version.current += 1;
      setAccount(null);
      setError("");
      setLoading(false);
    };
    const changed = (event) => {
      if (event.key === "jobtot.candidate.tokens" && !event.newValue) ended();
    };
    window.addEventListener("candidate-session-ended", ended);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener("candidate-session-ended", ended);
      window.removeEventListener("storage", changed);
    };
  }, []);
  async function signOut() {
    try {
      await candidateAuth.logout();
    } finally {
      signIn(null);
    }
  }
  return (
    <SessionContext.Provider
      value={{
        account,
        loading,
        error,
        signIn,
        signOut,
        updateAvatar: (avatarUrl) =>
          setAccount((current) => (current ? { ...current, avatarUrl } : current)),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
