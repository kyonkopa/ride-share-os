/**
 * Service Worker Registration and Update Management
 *
 * Handles service worker registration, update detection, and automatic
 * reloading when new versions are available, with iOS-specific considerations.
 */

/**
 * Register the service worker and set up update detection
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

        setupUpdateDetection(registration)
        checkForUpdates(registration)

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          console.log("[SW] New service worker has taken control, reloading")
          window.location.reload()
        })
      })
      .catch((error) => {
        console.error("[SW] Service worker registration failed:", error)
      })
  })

  // Single visibilitychange listener to handle update checks and activation
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update().catch((error) => {
            console.error(
              "[SW] Error checking for updates on visibility change:",
              error
            )
          })

          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" })
          }
        }
      })
    }
  })
}

/**
 * Set up update detection to reload when a new SW is ready
 */
function setupUpdateDetection(registration: ServiceWorkerRegistration): void {
  registration.addEventListener("updatefound", () => {
    const newWorker = registration.installing
    if (!newWorker) return

    newWorker.addEventListener("statechange", () => {
      if (
        newWorker.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        console.log("[SW] New service worker installed, activating")
        window.location.reload()
      }
    })
  })

  if (registration.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" })
  }
}

/**
 * Periodically check for service worker updates (important for iOS)
 */
function checkForUpdates(registration: ServiceWorkerRegistration): void {
  setInterval(
    () => {
      registration
        .update()
        .then(() => {
          console.log("[SW] Checked for updates")
        })
        .catch((error) => {
          console.error("[SW] Error checking for updates:", error)
        })
    },
    60 * 60 * 1000
  ) // every hour
}

/**
 * Check if the current error is likely due to cache mismatch
 */
export function isCacheMismatchError(error: Error | unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const errorMessage = error.message.toLowerCase()
  const errorStack = error.stack?.toLowerCase() || ""

  // Common cache-related error patterns
  const cacheErrorPatterns = [
    "unexpected token",
    "unexpected end of json",
    "failed to fetch",
    "networkerror",
    "syntaxerror",
    "chunk load failed",
    "loading chunk",
    "failed to load module",
  ]

  return (
    cacheErrorPatterns.some(
      (pattern) =>
        errorMessage.includes(pattern) || errorStack.includes(pattern)
    ) ||
    // Check for 500 errors that might be cache-related
    errorMessage.includes("500") ||
    errorStack.includes("500")
  )
}

/**
 * Clear all caches and reload the app
 */
export async function clearCacheAndReload(): Promise<void> {
  if (typeof window === "undefined") {
    return
  }

  if (!("caches" in window)) {
    // Type assertion to avoid TypeScript's aggressive narrowing after 'in' check
    const win = window as unknown as Window
    win.location.reload()
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
