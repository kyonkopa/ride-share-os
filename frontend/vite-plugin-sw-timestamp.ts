/**
 * Vite plugin to inject build timestamp into service worker
 *
 * This ensures each build has a unique cache version, forcing
 * cache invalidation on deployments.
 */

import type { Plugin } from "vite"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { resolve } from "path"

export function swTimestampPlugin(): Plugin {
  let distDir = ""

  return {
    name: "sw-timestamp",
    apply: "build",
    configResolved(config) {
      distDir = config.build.outDir || "dist"
    },
    writeBundle() {
      // Vite copies files from public/ to dist/ during build
      // We need to update the service worker in the dist directory
      const swPath = resolve(process.cwd(), distDir, "sw.js")
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0] // YYYYMMDDTHHmmss
      const cacheVersion = `v${timestamp}`

      try {
        if (!existsSync(swPath)) {
          console.warn(`[SW] Service worker not found at ${swPath}`)
          return
        }

        let swContent = readFileSync(swPath, "utf-8")

        // Replace the CACHE_VERSION line with the build timestamp
        swContent = swContent.replace(
          /const CACHE_VERSION = .*?;/,
          `const CACHE_VERSION = "${cacheVersion}";`
        )

        writeFileSync(swPath, swContent, "utf-8")
        console.log(`[SW] Injected cache version: ${cacheVersion}`)
      } catch (error) {
        console.warn("[SW] Failed to inject timestamp:", error)
      }
    },
  }
}
