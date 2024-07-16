import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import pugPlugin from 'vite-plugin-pug'

export default defineConfig({
  server: { https: true },
  assetsInclude: ['assets/'],
  plugins: [ mkcert(), pugPlugin() ],
});
