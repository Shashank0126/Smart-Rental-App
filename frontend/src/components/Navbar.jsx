import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import {
  Home, Building2, Heart, MessageCircle, Bell, LogOut, Menu, X,
  LayoutDashboard, Users, Settings, ChevronDown, Search
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin, isOwner } = useAuth();
  const { unread } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = isAdmin
    ? [
        { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/users', icon: Users, label: 'Users' },
        { to: '/admin/properties', icon: Building2, label: 'Properties' },
      ]
    : isOwner
    ? [
        { to: '/owner', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/owner/properties', icon: Building2, label: 'My Listings' },
        { to: '/owner/inquiries', icon: MessageCircle, label: 'Inquiries' },
      ]
    : [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/search', icon: Search, label: 'Search' },
        { to: '/favorites', icon: Heart, label: 'Favorites' },
        { to: '/chat', icon: MessageCircle, label: 'Messages' },
      ];

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-[var(--border)] rounded-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">SmartRental</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === to
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Notifications */}
                <Link to={isAdmin ? '/admin' : '/notifications'} className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Bell size={18} className="text-slate-400" />
                  {unread > 0 && <span className="notification-dot" />}
                </Link>

                {/* Chat */}
                {!isAdmin && (
                  <Link to={isOwner ? '/owner/inquiries' : '/chat'} className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <MessageCircle size={18} className="text-slate-400" />
                    {unread > 0 && <span className="notification-dot" />}
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-300">{user.name}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 glass-card border border-[var(--border)] rounded-xl py-2 shadow-2xl">
                      <div className="px-4 py-2 border-b border-[var(--border)]">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate">{user.email}</p>
                        <span className="badge badge-primary mt-1">{user.role}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors mt-1"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm py-2 px-4">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/5"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] px-4 py-3 space-y-1">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-red-400 hover:bg-red-500/10"
            >
              <LogOut size={16} /> Sign Out
            </button>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-ghost flex-1 text-center text-sm">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 text-center text-sm">Register</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
