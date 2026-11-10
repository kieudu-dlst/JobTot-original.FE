const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const storageKey = "jobtot.candidate.tokens";
let refreshPending;
let generation = 0;

export function readTokens() {
  for (const storage of [sessionStorage, localStorage]) {
    try {
      const value = JSON.parse(storage.getItem(storageKey));
      if (value?.accessToken && value?.refreshToken) return value;
    } catch {
      storage.removeItem(storageKey);
    }
  }
  return null;
}

export function saveTokens(session, rememberMe = localStorage.getItem(storageKey) !== null) {
  if (!session?.accessToken || !session?.refreshToken)
    throw new Error("Máy chủ không trả về token đăng nhập hợp lệ.");
  const storage = rememberMe ? localStorage : sessionStorage;
  (rememberMe ? sessionStorage : localStorage).removeItem(storageKey);
  storage.setItem(
    storageKey,
    JSON.stringify({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      refreshExpiresAt: session.refreshExpiresAt,
    }),
  );
  generation += 1;
}

export function clearTokens() {
  sessionStorage.removeItem(storageKey);
  localStorage.removeItem(storageKey);
  localStorage.removeItem("jobtot.candidate.session-mode");
  generation += 1;
  window.dispatchEvent(new Event("candidate-session-ended"));
}

async function refreshTokens(failedAccessToken) {
  const rotate = async () => {
    const tokens = readTokens();
    if (!tokens) return null;
    if (tokens.accessToken !== failedAccessToken) return tokens;
    const currentGeneration = generation;
    const response = await fetch(`${base}/api/candidate/auth/refresh`, {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (generation !== currentGeneration || readTokens()?.refreshToken !== tokens.refreshToken)
      return readTokens();
    if (!response.ok) {
      if (response.status === 401 || response.status === 400) clearTokens();
      const error = new Error(
        response.status === 401 || response.status === 400
          ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          : "Không thể làm mới phiên đăng nhập. Vui lòng thử lại.",
      );
      error.status = response.status;
      throw error;
    }
    const session = await response.json();
    if (generation !== currentGeneration || readTokens()?.refreshToken !== tokens.refreshToken)
      return readTokens();
    saveTokens(session);
    return readTokens();
  };
  // The lock also prevents persistent sessions in different tabs from reusing a refresh token.
  refreshPending ??= (
    navigator.locks ? navigator.locks.request("jobtot.candidate.refresh", rotate) : rotate()
  ).finally(() => {
    refreshPending = null;
  });
  return refreshPending;
}

export async function candidateFetch(
  path,
  options = {},
  { authenticated = true, retry = true } = {},
) {
  const tokens = authenticated ? readTokens() : null;
  const headers = new Headers(options.headers);
  if (tokens) headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  const response = await fetch(`${base}/api/candidate/${path}`, {
    ...options,
    credentials: "omit",
    headers,
  });
  if (authenticated && retry && response.status === 401 && tokens) {
    if (await refreshTokens(tokens.accessToken)) {
      const result = await candidateFetch(path, options, { authenticated, retry: false });
      if (result.status === 401) clearTokens();
      return result;
    }
  }
  return response;
}
