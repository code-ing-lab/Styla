const STORAGE_KEY = "styla-dev-mode";

// 로컬 개발 서버(vite dev)에서는 항상 켜져 있고, 배포된 사이트에서는
// ?dev=1 쿼리파라미터를 한 번 방문하면 이후에도(localStorage) 계속 켜진 상태로 유지된다.
// ?dev=0으로 다시 끌 수 있다.
export function isDevModeEnabled() {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function syncDevModeFromUrl() {
  if (import.meta.env.DEV || typeof window === "undefined") return isDevModeEnabled();

  const params = new URLSearchParams(window.location.search);
  if (params.get("dev") === "1") {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } else if (params.get("dev") === "0") {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return isDevModeEnabled();
}
