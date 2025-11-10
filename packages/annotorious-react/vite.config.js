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
    open: '/test/openseadragon/index.html'
  },
  build: {
    lib: {
      entry: {
        'annotorious-react': './src/index.ts',
        'openseadragon': './src/openseadragon.ts'
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.${format}.js`
    },
    rollupOptions: {
      external: [
        ...Object.keys(packageJson.peerDependencies),
        '@annotorious/core',
        '@annotorious/annotorious',
        '@annotorious/openseadragon',
        'react/jsx-runtime',
        'react/jsx-dev-runtime'
      ],
      output: {
        preserveModules: true,
        assetFileNames: 'annotorious-react.[ext]',
      }
    },
    sourcemap: true
  }
});
