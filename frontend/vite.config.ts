import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"
import { swTimestampPlugin } from "./vite-plugin-sw-timestamp"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), swTimestampPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
