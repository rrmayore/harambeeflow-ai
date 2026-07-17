console.log("MAIN.TSX STARTED");

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element missing");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Service Worker Registration for PWA Installability
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("[Service Worker] Registered successfully:", reg.scope))
      .catch((err) => console.error("[Service Worker] Registration failed:", err));
  });
}

