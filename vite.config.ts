import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  /**
   * Deployed as a GitHub *user* page (Action-Kamen.github.io), which is served from the
   * domain root -- so the base is '/'. A project page would need '/<repo>/' here and every
   * asset URL would break without it.
   */
  base: '/',

  server: {
    port: 5173,
    /**
     * This project lives on the Windows filesystem under /mnt/c. inotify events do not
     * cross the WSL <-> Windows boundary, so without polling the dev server starts fine
     * and then silently never reloads. Ignoring node_modules keeps the poll cheap.
     */
    watch: {
      usePolling: true,
      interval: 300,
      ignored: ['**/node_modules/**', '**/dist/**'],
    },
  },

  build: {
    target: 'es2022',
    cssTarget: 'safari16',
    // Source maps are ~1 MB of files nobody fetches unless devtools is open.
    sourcemap: false,
    rollupOptions: {
      output: {
        /**
         * Two separate lazy chunks, not one.
         *
         * The hero shader is fetched by every visitor a moment after first paint. The four
         * project figures are fetched only by visitors who open an entry. Bundling them
         * together would make everyone pay for the figures to see the hero, which is the
         * exact cost the code splitting exists to avoid.
         */
        manualChunks(id) {
          if (id.includes('IridescenceField')) return 'field'
          if (id.includes('/components/figures/')) return 'figures'
        },
      },
    },
  },
})
