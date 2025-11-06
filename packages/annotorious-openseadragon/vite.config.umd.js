import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

import * as packageJson from './package.json';

export default defineConfig({
  plugins: [
    svelte({ preprocess: sveltePreprocess() })
  ],
  server: {
    open: '/test/index.html'
  },
  build: {
    sourcemap: true,
    emptyOutDir: false,
    lib: {
      entry: './src/index.ts',
      name: 'AnnotoriousOSD',
      formats: ['umd'],
      fileName: () => 'annotorious-openseadragon.js' 
    },
    rollupOptions: {
      external: Object.keys(packageJson.peerDependencies),
      output: {
        assetFileNames: 'annotorious-openseadragon.[ext]',
        globals: {
          openseadragon: 'OpenSeadragon'
        }
      }
    }
  },
  // process.env polyfill for nanostores
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});
