import { defineConfig } from 'vite'
import { nodeResolve } from '@rollup/plugin-node-resolve';
import mkcert from 'vite-plugin-mkcert'
import pugPlugin from 'vite-plugin-pug'

export default defineConfig({
  server: {
    https: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  plugins: [ 
    mkcert(), 
    pugPlugin(), 
    nodeResolve(),
  ],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: ['index.html', 'main.js'],
      output: {
        manualChunks: () => 'index',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        entryFileNames: '[name].js',
      },
    },
  },
  worker: {
    format: 'es',
  }
});
