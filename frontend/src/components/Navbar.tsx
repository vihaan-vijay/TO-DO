import { CheckSquare } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <CheckSquare size={24} className="navbar-icon" />
        <h1 className="navbar-title">TaskFlow</h1>
      </div>
    </nav>
  );
}
