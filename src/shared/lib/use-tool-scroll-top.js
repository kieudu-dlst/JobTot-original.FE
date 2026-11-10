import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export function useToolScrollTop() {
  const { pathname, hash } = useLocation();
  useLayoutEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);
}
