const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
export function mediaUrl(value) {
  return value?.startsWith("/uploads/avatars/") || value?.startsWith("/uploads/companies/")
    ? `${base}${value}`
    : value;
}
