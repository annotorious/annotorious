import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsConfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';

import * as packageJson from './package.json';

export default defineConfig({
  plugins: [
    react(),
    tsConfigPaths(),
    dts({
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
      fileName: (format) => `annotorious-react.${format}.js`
    },
    rollupOptions: {
      external: [
        ...Object.keys(packageJson.peerDependencies),
        /@annotorious\/(core|annotorious|openseadragon)/
      ],
      output: {
        preserveModules: true,
        assetFileNames: 'annotorious-react.[ext]'
      }
    },
    sourcemap: true
  }
});
