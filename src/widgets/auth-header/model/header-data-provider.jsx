import { useEffect, useState, useContext } from "react";
import { useCandidateSession, useEmployerSession } from "@/features/authenticate";
import { candidateFetch } from "@/shared/api/candidate-session";
import { employerFetch } from "@/shared/api/employer-session";
import { HeaderDataContext } from "./header-data-context";

const headerApi = {
  async get(role, signal) {
    const response = await (role === "employer" ? employerFetch : candidateFetch)("header", {
      signal,
    });
    if (!response.ok) throw new Error("Không thể tải thông báo. Vui lòng thử lại.");
    const data = await response.json();
    if (role === "employer" && data.companyLogoUrl === undefined) {
      // Older running APIs omit the logo from header data; use the company profile's logo.
      try {
        const companyResponse = await employerFetch("company", { signal });
        if (companyResponse.ok) {
          const company = await companyResponse.json();
          data.companyLogoUrl = company.document?.brand?.logoUrl;
        }
      } catch (failure) {
        if (signal?.aborted) throw failure;
      }
    }
    return data;
  },
};

function RoleData({ role, accountId, children }) {
  const parent = useContext(HeaderDataContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController();
    let running = false;
    async function refresh() {
      if (running || controller.signal.aborted) return;
      running = true;
      try {
        const value = await headerApi.get(role, controller.signal);
        if (!controller.signal.aborted) {
          setData({ accountId, value });
          setError("");
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError({ accountId, message: failure.message });
      } finally {
        running = false;
      }
    }
    const timer = setTimeout(refresh, 0);
    const interval = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    window.addEventListener("account-read-updated", refresh);
    const visibleRefresh = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", visibleRefresh);
    if (role === "employer") window.addEventListener("employer-company-updated", refresh);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("account-read-updated", refresh);
      document.removeEventListener("visibilitychange", visibleRefresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("employer-company-updated", refresh);
      controller.abort();
    };
  }, [role, attempt, accountId]);

  return (
    <HeaderDataContext.Provider
      value={{
        ...parent,
        [role]: {
          data: data && data.accountId === accountId ? data.value : null,
          error: error && error.accountId === accountId ? error.message : "",
          retry: () => setAttempt((value) => value + 1),
        },
      }}
    >
      {children}
    </HeaderDataContext.Provider>
  );
}
export function HeaderDataProvider({ children }) {
  const candidate = useCandidateSession();
  const employer = useEmployerSession();
  return (
    <RoleData role="candidate" accountId={candidate.account?.id}>
      <RoleData role="employer" accountId={employer.account?.id}>
        {children}
      </RoleData>
    </RoleData>
  );
}
