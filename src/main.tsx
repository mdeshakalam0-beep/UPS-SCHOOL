import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js') // Vite serves .ts as .js
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(registrationError => {
        console.error('Service Worker registration failed:', registrationError);
      });
  });
}