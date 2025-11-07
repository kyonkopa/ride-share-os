import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { toast } from "sonner"
import "./index.css"
import App from "./App.tsx"
import {
  registerServiceWorker,
  checkForAssetUpdate,
  clearCacheAndReload,
} from "./lib/serviceWorker"

// Register service worker for PWA updates
registerServiceWorker()

// Check for updates when document is ready
if (!import.meta.env.DEV) {
  const checkForUpdates = async () => {
    try {
      const { hasUpdate } = await checkForAssetUpdate()
      if (hasUpdate) {
        toast.info("A new version is available", {
          description: "Click to reload and update",
          action: {
            label: "Reload",
            onClick: () => {
              clearCacheAndReload()
            },
          },
          duration: Infinity,
        })
      }
    } catch (error) {
      console.error("[Version] Error checking for updates:", error)
    }
  }

  // Check when document is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkForUpdates)
  } else {
    checkForUpdates()
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
