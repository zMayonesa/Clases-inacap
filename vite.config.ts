import { defineConfig } from 'vite'
export default defineConfig({
  root: 'web',
  publicDir: '../public',
  base: '/Clases-inacap/',
  esbuild: { jsx: 'automatic' },
  build: { target: 'es2022', outDir: '../dist', assetsDir: 'academia-assets', emptyOutDir: true },
})
