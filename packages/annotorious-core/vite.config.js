import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    svelte({ preprocess: sveltePreprocess() }),
    dts({ 
      insertTypesEntry: true,
      include: ['./src/'],
      entryRoot: './src'
    })
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: (format) => `annotorious-core.${format}.js`
    }
  }
});
