import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';

import './index.css';

/*
 * FinSight application bootstrap.
 *
 * index.css itself imports the shared theme/global layers.
 * Keeping the entry point small makes the architecture easier
 * to reason about and prevents CSS ordering mistakes.
 */

const rootElement =
  document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'FinSight could not find the #root application mount.'
  );
}

/*
 * Remove the static HTML boot screen once React takes
 * ownership of the page.
 */
document.documentElement.classList.add(
  'fs-react-booting'
);

const root =
  ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/*
 * Give the browser a frame to paint React before
 * removing the static boot state.
 */
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove(
      'fs-react-booting'
    );

    document.documentElement.classList.add(
      'fs-react-mounted'
    );

    const bootScreen =
      document.getElementById(
        'finsight-static-boot'
      );

    if (bootScreen) {
      bootScreen.classList.add(
        'fs-static-boot-hidden'
      );

      window.setTimeout(() => {
        bootScreen.remove();
      }, 700);
    }
  });
});