/**
 * Service Worker Registration and Version-Based Update Management
 *
 * Handles service worker registration and version-based update detection
 * using a lightweight /version.json file approach.
 */

// Current app version (injected at build time via window.__APP_VERSION__)
const CURRENT_APP_VERSION =
  (typeof window !== "undefined" &&
    (window as { __APP_VERSION__?: string }).__APP_VERSION__) ||
  new Date().toISOString()

/**
 * Check for asset updates by comparing remote version.json with current version
 * @returns Promise resolving to update status
 */
export async function checkForAssetUpdate(): Promise<{
  hasUpdate: boolean
  version: string
}> {
  try {
    const response = await fetch("/version.json", {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    })

    if (!response.ok) {
      return { hasUpdate: false, version: CURRENT_APP_VERSION }
    }

    const data = await response.json()
    const remoteVersion = data.version

    return {
      hasUpdate: remoteVersion !== CURRENT_APP_VERSION,
      version: remoteVersion,
    }
  } catch (error) {
    console.error("[Version] Error checking for updates:", error)
    return { hasUpdate: false, version: CURRENT_APP_VERSION }
  }
}

/**
 * Clear all caches and reload the app
 */
export async function clearCacheAndReload(): Promise<void> {
  if (typeof window === "undefined") {
    return
  }

  if (!("caches" in window)) {
    ;(window as Window).location.reload()
    return
  }

  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((name) => caches.delete(name)))

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" })
    }

    setTimeout(() => window.location.reload(), 100)
  } catch {
    window.location.reload()
  }
}

/**
 * Register the service worker
 */
export function registerServiceWorker(): void {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("caches" in window)
  ) {
    console.log("[SW] Service workers not supported")
    return
  }

  if (import.meta.env.DEV) {
    console.log("[SW] Skipping service worker registration in development")
    return
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[SW] Service worker registered:", registration.scope)

        // If there's a waiting service worker, activate it immediately
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" })
          setTimeout(() => window.location.reload(), 500)
          return
        }

        // Listen for controller changes
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          console.log("[SW] New service worker has taken control, reloading")
          window.location.reload()
        })
      })
      .catch((error) => {
        console.error("[SW] Service worker registration failed:", error)
      })
  })
}
