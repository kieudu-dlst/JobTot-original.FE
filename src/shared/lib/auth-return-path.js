export function authReturnPath(search, fallback = "/jobs") {
  const path = new URLSearchParams(search).get("returnTo");
  if (/^\/ai\/career-search(?:\?role=(candidate|employer))?$/.test(path || "")) return path;
  return /^(\/auth\/external\?role=(candidate|employer)&flow=[0-9a-f-]{36}|\/jobs\/[0-9a-f-]{36}(#job-application)?|\/my-jobs(\?tab=(saved|applied|companies|interviews))?|\/messages(\?(hr=[^&#]+|company=[0-9a-f-]{36}))?)$/i.test(
    path || "",
  )
    ? path
    : fallback;
}
