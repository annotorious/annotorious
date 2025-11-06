import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

export default defineConfig({
  plugins: [
    svelte({ preprocess: sveltePreprocess() })
  ],
  build: {
    sourcemap: true,
    emptyOutDir: false,
    lib: {
      entry: './src/index.ts',
      name: 'Annotorious',
      formats: ['umd'],
      fileName: () => 'annotorious.js'
    },
    rollupOptions: {
      external: ['test/*'],
      output: {
        assetFileNames: 'annotorious.[ext]'
      }
    }
  },
  // process.env polyfill for nanostores
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});
