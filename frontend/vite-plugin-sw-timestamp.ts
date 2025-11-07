/**
 * Vite plugin to generate version.json and inject build timestamp into service worker
 *
 * This ensures each build has a unique cache version, forcing
 * cache invalidation on deployments.
 */

import type { Plugin } from "vite"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { resolve } from "path"

export function swTimestampPlugin(): Plugin {
  let distDir = ""
  let buildVersion = ""

  return {
    name: "sw-timestamp",
    apply: "build",
    buildStart() {
      // Generate version once at build start
      buildVersion = new Date().toISOString()
    },
    configResolved(config) {
      distDir = config.build.outDir || "dist"
    },
    transformIndexHtml(html) {
      // Inject version as a script tag so it's available at runtime
      return html.replace(
        "</head>",
        `<script>window.__APP_VERSION__ = ${JSON.stringify(buildVersion)};</script></head>`
      )
    },
    writeBundle() {
      try {
        // Generate version.json with the same version
        const versionPath = resolve(process.cwd(), distDir, "version.json")
        const versionData = JSON.stringify({ version: buildVersion }, null, 2)
        writeFileSync(versionPath, versionData, "utf-8")
        console.log(`[Build] Generated version.json: ${buildVersion}`)

        // Update service worker cache version
        const swPath = resolve(process.cwd(), distDir, "sw.js")
        if (existsSync(swPath)) {
          const cacheVersion = `v${buildVersion.replace(/[-:]/g, "").split(".")[0]}`
          let swContent = readFileSync(swPath, "utf-8")
          swContent = swContent.replace(
            /const CACHE_VERSION = .*?;/,
            `const CACHE_VERSION = "${cacheVersion}";`
          )
          writeFileSync(swPath, swContent, "utf-8")
          console.log(`[SW] Injected cache version: ${cacheVersion}`)
        }
      } catch (error) {
        console.warn("[Build] Failed to generate version.json:", error)
      }
    },
  }
}
