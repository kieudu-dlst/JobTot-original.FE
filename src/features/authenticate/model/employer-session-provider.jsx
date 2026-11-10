import { useEffect, useRef, useState } from "react";
import { employerAuth } from "../api/employer-auth";
import { clearTokens, readTokens } from "@/shared/api/employer-session";
import { EmployerSessionContext } from "./employer-session-context";

export function EmployerSessionProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const version = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const current = version.current;
    const timer = setTimeout(async () => {
      try {
        const value = readTokens() ? await employerAuth.me(controller.signal) : null;
        if (!controller.signal.aborted && current === version.current) setAccount(value);
      } catch (failure) {
        if (!controller.signal.aborted && current === version.current && failure.status !== 401)
          setError(failure.message);
      } finally {
        if (!controller.signal.aborted && current === version.current) setLoading(false);
      }
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
      if (event.key === "jobtot.employer.tokens" && !event.newValue) ended();
    };
    window.addEventListener("employer-session-ended", ended);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener("employer-session-ended", ended);
      window.removeEventListener("storage", changed);
    };
  }, []);
  async function signOut() {
    try {
      await employerAuth.logout();
    } finally {
      signIn(null);
    }
  }
  return (
    <EmployerSessionContext.Provider value={{ account, loading, error, signIn, signOut }}>
      {children}
    </EmployerSessionContext.Provider>
  );
}
