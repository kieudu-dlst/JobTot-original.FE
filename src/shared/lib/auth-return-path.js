export function authReturnPath(search) {
  const path = new URLSearchParams(search).get("returnTo");
  return /^(\/jobs\/[0-9a-f-]{36}(#job-application)?|\/my-jobs(\?tab=(saved|applied|companies|interviews))?|\/messages(\?(hr=[^&#]+|company=[0-9a-f-]{36}))?)$/i.test(
    path || "",
  )
    ? path
    : "/jobs";
}
