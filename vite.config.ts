import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  // ─────────────────────────────────────────────────────────────────────────
  // ADR-0003, QST-SITE-URL = A (project site).
  //
  // This project is served from a SUBDIRECTORY:
  //     https://stanley-zhou.github.io/wordle-with-records/
  //
  // ⚠️  Renaming this repository breaks the deployed site until this string
  //     changes to match. The failure is nasty because it is asymmetric:
  //     `npm run dev` stays perfect while production serves a blank white
  //     page with 404s on every asset. ADR-0003 calls this out as the single
  //     most likely first production bug here, which is why the value is a
  //     recorded decision rather than a default.
  // ─────────────────────────────────────────────────────────────────────────
  base: '/wordle-with-records/',

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    // The guess dictionary (ADR-0001, QST-GUESS-LEGALITY = B) is a ~50-80 KB
    // gzipped asset that must never block first paint. It does not exist yet
    // — its licence has to be recorded in ADR-0001 first — but when it lands
    // it arrives via dynamic import, so it becomes its own chunk here.
    chunkSizeWarningLimit: 600,
  },
})
