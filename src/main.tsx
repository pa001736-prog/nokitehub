import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Register Service Worker for FCM
try {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('FCM Service Worker registered with scope:', registration.scope);
        })
        .catch((err) => {
          console.log('FCM Service Worker registration failed:', err);
        });
    });
  }
} catch (e) {
  console.log('Service Worker not supported or blocked by browser');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
