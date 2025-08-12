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
  if (authToken && modifiedInit.headers) {
    modifiedInit.headers = {
      ...modifiedInit.headers,
      'Authorization': `Bearer ${authToken}`
    };
  } else if (authToken) {
    modifiedInit.headers = {
      'Authorization': `Bearer ${authToken}`
    };
  }
  
  return originalFetch(input, modifiedInit);
};

// Ensure DOM is ready before rendering
const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
} else {
  console.error("Root container not found");
}
