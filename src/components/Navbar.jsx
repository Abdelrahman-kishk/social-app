import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, KeyRound, LogOut, MessagesSquare, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from './Avatar';
import ChangePasswordModal from './ChangePasswordModal';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-600">
          <MessagesSquare className="h-6 w-6" /> Connect
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            <Home className="h-4 w-4" /> <span className="hidden sm:inline">Home</span>
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            <User className="h-4 w-4" /> <span className="hidden sm:inline">Profile</span>
          </NavLink>
        </nav>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100" aria-label="User menu">
            <Avatar user={user} size={34} />
            <span className="hidden max-w-[120px] truncate pr-2 text-sm font-medium md:block">{user?.name}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
              >
                <User className="h-4 w-4" /> My profile
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setPwOpen(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
              >
                <KeyRound className="h-4 w-4" /> Change password
              </button>
              <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </header>
  );
}
