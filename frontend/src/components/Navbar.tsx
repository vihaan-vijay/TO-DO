import { useState, useEffect } from 'react';
import { CheckSquare, Moon, Sun } from 'lucide-react';

export function Navbar() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <nav className="navbar glass">
      <div className="navbar-brand">
        <CheckSquare size={24} className="navbar-icon" />
        <h1 className="navbar-title">TaskFlow</h1>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        <button
          className="btn-icon-sm"
          onClick={() => setIsDark(!isDark)}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  );
}
