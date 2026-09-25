import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installGlobalErrorLog } from "./lib/errorLog";

// Persist render crashes + unhandled async failures so they survive reloads
installGlobalErrorLog();

const root = document.getElementById("root");

async function boot() {
  // GitHub Pages demo mode (vite build --mode demo): MSW intercepts all /api/v2/*
  // In a normal build this branch is statically replaced with false and, together
  // with the demo directory, tree-shaken away
  if (import.meta.env.MODE === "demo") {
    const { startDemo } = await import("./mocks/demo/server");
    await startDemo();
  }
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
}

void boot();
