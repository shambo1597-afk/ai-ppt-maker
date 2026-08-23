import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { buildGoogleFontsHref } from './lib/design/fontManifest';

// Load every theme font from the single manifest, not a hand-maintained
// <link> in index.html — see lib/design/fontManifest.ts for why.
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = buildGoogleFontsHref();
document.head.appendChild(fontLink);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
