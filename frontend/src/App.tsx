import { Toaster } from 'react-hot-toast';
import { Dashboard } from './pages/Dashboard';

export default function App() {
  return (
    <>
      <Dashboard />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 1800,
          style: {
            background: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: "'Inter', sans-serif",
            padding: '10px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </>
  );
}

