import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Root from './Root.jsx';

const root = createRoot(document.getElementById('app'));
root.render(
  <BrowserRouter>
    <Root />
  </BrowserRouter>
);