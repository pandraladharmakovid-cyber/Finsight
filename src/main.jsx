import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.jsx';
import { ToastProvider } from './lib/hooks.jsx';

import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('FinSight: #root mount point was not found.');
}

/* Restore the user's saved accent + motion preference before first paint. */
try {
  const accent = window.localStorage.getItem('finsight:accent');
  const motion = window.localStorage.getItem('finsight:motion');

  if (accent) {
    document.documentElement.dataset.accent = JSON.parse(accent);
  }

  if (motion) {
    document.documentElement.dataset.motion = JSON.parse(motion);
  }
} catch {
  /* preferences are optional */
}

createRoot(container).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>,
);

/* Remove the static boot splash once React has painted. */
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const boot = document.getElementById('finsight-boot');

    if (boot) {
      boot.classList.add('boot-done');
      window.setTimeout(() => boot.remove(), 700);
    }
  });
});
