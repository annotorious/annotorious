import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

const path = require('path');

export default defineConfig({
  plugins: [ preact() ],
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.jsx'),
      name: 'Annotorious',
      formats: [ 'umd' ]
    }
  }
})