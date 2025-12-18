import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { Toaster } from 'react-hot-toast';
import './index.css';

// Build stamp to force cache-busting when deploying behind long-lived asset caching.
// Useful to verify which bundle is loaded in the browser.
(window as any).__OME_DASHBOARD_BUILD__ = '2025-12-18-1';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Exponential backoff for 429 errors
        if (error?.response?.status === 429) {
          // Retry up to 3 times with exponential backoff
          return failureCount < 3;
        }
        // Normal retry logic for other errors
        return failureCount < 1;
      },
      retryDelay: (attemptIndex, error: any) => {
        // Exponential backoff: 2s, 4s, 8s for 429 errors
        if (error?.response?.status === 429) {
          return Math.min(1000 * 2 ** attemptIndex, 30000);
        }
        return 1000;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);


