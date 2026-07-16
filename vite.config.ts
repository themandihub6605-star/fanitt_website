import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Zoom Meeting SDK's WASM video engine requires SharedArrayBuffer, which
// browsers only allow on "cross-origin isolated" pages — these two headers
// enable that. They're only applied to the /sessions/:id/live route's
// document (not site-wide), because COEP:require-corp would otherwise block
// the external images/video used everywhere else on the site.
function zoomIsolationHeaders(): Plugin {
  return {
    name: 'zoom-isolation-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && /^\/sessions\/[^/]+\/live/.test(req.url)) {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && /^\/sessions\/[^/]+\/live/.test(req.url)) {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), zoomIsolationHeaders()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})