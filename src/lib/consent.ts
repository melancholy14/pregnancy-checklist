export type CookieConsent = "pending" | "accepted" | "rejected";

const STORAGE_KEY = "cookie-consent";

export function getConsent(): CookieConsent {
  if (typeof window === "undefined") return "pending";
  const value = localStorage.getItem(STORAGE_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return "pending";
}

export function setConsent(value: "accepted" | "rejected") {
  localStorage.setItem(STORAGE_KEY, value);
}
