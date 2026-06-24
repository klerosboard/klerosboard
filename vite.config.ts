import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import { lingui } from '@lingui/vite-plugin'

export default defineConfig({
  plugins: [
    svgr(),
    react({ babel: { plugins: ['macros'] } }),
    lingui(),
    nodePolyfills({
      exclude: ['v8'],
    }),
  ],
  optimizeDeps: {
    exclude: ['@kleros/archon'],
  },
  resolve: {
    alias: {
      'v8-sandbox': false,
    },
  },
  define: {
    global: 'globalThis',
  },
})
