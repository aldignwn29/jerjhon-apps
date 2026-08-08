import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Comprehensive suppression of benign Vite WebSocket / HMR disconnection errors in sandbox
if (typeof window !== 'undefined') {
  const isWebSocketError = (err: any) => {
    if (!err) return false;
    const msg = String(err?.message || err?.reason || err || '').toLowerCase();
    return (
      msg.includes('websocket') ||
      msg.includes('ws://') ||
      msg.includes('wss://') ||
      msg.includes('[vite]') ||
      msg.includes('failed to connect')
    );
  };

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (isWebSocketError(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      if (isWebSocketError(event.error) || isWebSocketError(event.message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  // Filter console logs for benign Vite HMR WebSocket connection drops
  const origConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (args.some((arg) => isWebSocketError(arg))) {
      return;
    }
    origConsoleError.apply(console, args);
  };

  const origConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (args.some((arg) => isWebSocketError(arg))) {
      return;
    }
    origConsoleWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

