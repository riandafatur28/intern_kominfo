import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Root from './Root.jsx';
import { syncSwAuth } from './utils/swAuth';

// PDF opener: SW menambahkan header Authorization ke request /api saat window.open.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    syncSwAuth();
  });
}

const root = createRoot(document.getElementById('app'));
root.render(
  <BrowserRouter>
    <Root />
  </BrowserRouter>
);