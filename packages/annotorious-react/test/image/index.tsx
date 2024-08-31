import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Annotorious } from '../../src';

import './index.css';

const root = createRoot(document.getElementById('root') as Element);
root.render(
  <React.StrictMode>
    <Annotorious>
      <App />
    </Annotorious>
  </React.StrictMode>
);
