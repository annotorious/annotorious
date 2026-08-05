import React from 'react';
import { createRoot } from 'react-dom/client';
import { Annotorious } from '../../src';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Annotorious>
      <App />
    </Annotorious>
  </React.StrictMode>
);
