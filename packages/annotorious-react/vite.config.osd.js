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
      include: ['./src/openseadragon'],
      entryRoot: './src/openseadragon'
    })
  ],
  server: {
    open: '/test/index.html'
  },
  build: {
    lib: {
      entry: './src/openseadragon/index.ts',
      formats: ['es'],
      fileName: (format) => `annotorious-react-osd.${format}.js`
    },
    outDir: './dist/openseadragon',
    rollupOptions: {
      external: [
        ...Object.keys(packageJson.peerDependencies)
      ],
      output: {
        preserveModules: false,
        assetFileNames: 'annotorious-react-osd.[ext]',
        globals: {
          react: 'React',
          openseadragon: 'OpenSeadragon'
        }
      }
    },
    sourcemap: true
  }
});