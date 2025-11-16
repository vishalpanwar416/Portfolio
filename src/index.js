import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Global error handler to suppress "Script error" messages from external sources
window.addEventListener('error', (event) => {
  // Suppress generic "Script error" messages that occur due to CORS
  // These are typically from external APIs or third-party scripts
  if (event.message === 'Script error.' || event.message === 'Script error') {
    event.preventDefault();
    return false;
  }
  // Allow other errors to be logged normally
  return true;
}, true);

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Suppress CORS-related errors from external APIs
  if (event.reason?.message?.includes('CORS') || 
      event.reason?.message?.includes('Failed to fetch') ||
      event.reason?.message?.includes('NetworkError')) {
    event.preventDefault();
    return false;
  }
  return true;
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
