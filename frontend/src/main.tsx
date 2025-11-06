import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import {
  registerServiceWorker,
  isCacheMismatchError,
  clearCacheAndReload,
} from "./lib/serviceWorker"

// Register service worker for PWA updates
registerServiceWorker()

// Global error handler for cache-related errors (catches errors outside React)
window.addEventListener("error", (event) => {
  const error = event.error
  if (error && isCacheMismatchError(error)) {
    console.error("[App] Cache mismatch error detected:", error)
    clearCacheAndReload()
  }
})

// Handle unhandled promise rejections (common with cache errors)
window.addEventListener("unhandledrejection", (event) => {
  const error = event.reason
  if (error && isCacheMismatchError(error)) {
    console.error("[App] Cache mismatch error in promise rejection:", error)
    clearCacheAndReload()
    event.preventDefault() // Prevent default error handling
  }
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
