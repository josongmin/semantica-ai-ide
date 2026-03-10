import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";

// Dev tools — only loaded in development
if (import.meta.env.DEV) {
  import("./app/dev/devInjector")
    .then((m) => {
      // Auto-seed all features with mock data after app mounts
      setTimeout(() => {
        m.devInjector.seedAll();
      }, 200);
    })
    .catch(() => { /* noop */ });
  // Instant-seed all 14 Coding OS feature panels (no delay)
  import("./app/dev/scenarios/codingOsSimulations")
    .then((m) => {
      setTimeout(() => m.seedCodingOSPanels(), 250);
    })
    .catch(() => { /* noop */ });
  import("./app/dev/testHarness").catch(() => { /* noop */ });
  import("./app/dev/mockBackend").then((m) => m.installMockBackend()).catch(() => { /* noop */ });
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("[agent-ux] #root element not found in document");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
