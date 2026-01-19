// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css'; // Import Tailwind CSS
import App from './App';

// Stable viewport height: set --fixed-svh to the smallest observed viewport height
(function setupFixedSVH() {
  const docEl = document.documentElement;
  const getVH = () => Math.round(window.visualViewport ? window.visualViewport.height : window.innerHeight);

  let baseline = getVH();
  const apply = (h) => docEl.style.setProperty('--fixed-svh', `${h}px`);
  apply(baseline);

  const onResize = () => {
    const h = getVH();
    // Only decrease to avoid growth when URL bar collapses
    if (h < baseline) {
      baseline = h;
      apply(baseline);
    }
  };

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', onResize, { passive: true });
  window.addEventListener('orientationchange', () => {
    // Re-evaluate after orientation settles
    setTimeout(() => {
      baseline = getVH();
      apply(baseline);
    }, 200);
  });
})();

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
