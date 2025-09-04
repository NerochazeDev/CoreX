import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global fetch interceptor to add auth token to all requests
const originalFetch = window.fetch;
window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Clone init to avoid mutating the original
  const modifiedInit = { ...init };

  // Always include credentials
  modifiedInit.credentials = 'include';

  // Add auth token if available and not already present
  const authToken = localStorage.getItem('bitvault_auth_token');
  if (authToken) {
    modifiedInit.headers = {
      ...modifiedInit.headers,
      'Authorization': `Bearer ${authToken}`
    };
  }

  return originalFetch(input, modifiedInit);
};

// Global error handlers to prevent unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default browser behavior of logging to console
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing in index.html");

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);