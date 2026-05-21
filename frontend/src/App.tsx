import { Toaster } from 'react-hot-toast';
import { Dashboard } from './pages/Dashboard';

export default function App() {
  return (
    <>
      <Dashboard />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#fafafa',
            color: '#1a1a1a',
            border: '1px solid #e5e5e5',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: "'Inter', sans-serif",
            padding: '10px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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
