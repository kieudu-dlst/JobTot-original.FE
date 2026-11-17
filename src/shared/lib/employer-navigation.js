import { matchPath } from "react-router-dom";

// Talent Pool is a saved-profile collection, even though it shares a page with applications.
export function employerArea(pathname) {
  if (["/employer/discover", "/employer/talents"].some((path) => matchPath(path, pathname)))
    return "discover";
  if (["/employer/candidates", "/employer/interviews"].some((path) => matchPath(path, pathname)))
    return "candidates";
  if (matchPath({ path: "/employer/campaigns", end: false }, pathname)) return "campaigns";
  return null;
}
