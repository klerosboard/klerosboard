import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import { lingui } from '@lingui/vite-plugin'
import netlify from '@netlify/vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    netlify(),
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
      'v8-sandbox': path.resolve('./src/mocks/v8-sandbox.js'),
    },
  },
  define: {
    global: 'globalThis',
  },
})
