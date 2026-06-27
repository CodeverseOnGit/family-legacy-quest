import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './styles/global.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#FDF8F2',
            color: '#2C1810',
            border: '1px solid rgba(44,24,16,0.1)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(44,24,16,0.12)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#5A8A6A', secondary: '#FDF8F2' },
          },
          error: {
            iconTheme: { primary: '#DC3545', secondary: '#FDF8F2' },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)
