import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import dts from 'vite-plugin-dts';

import * as packageJson from './package.json';

export default defineConfig({
  plugins: [
    svelte({ preprocess: sveltePreprocess() }),
    dts({
      insertTypesEntry: true,
      include: ['./src/'],
      entryRoot: './src'
    })
  ],
  server: {
    open: '/test/index.html'
  },
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: (format) => `annotorious-svelte.${format}.js`
    },
    rollupOptions: {
      external: [
        ...Object.keys(packageJson.peerDependencies),
        '@annotorious/core',
        '@annotorious/annotorious',
        '@annotorious/openseadragon'
      ],
      output: {
        preserveModules: true,
        assetFileNames: 'annotorious-svelte.[ext]'
      }
    },
    sourcemap: true
  }
});
