import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationDropdown from '../common/NotificationDropdown';
import {
  Sun,
  Moon,
  Menu,
  LogOut,
  User,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Mobile hamburger & breadcrumb/brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-card focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <GraduationCap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span className="font-semibold text-slate-900 dark:text-slate-200">
            {user?.collegeName || 'AttendX'}
          </span>
          {user?.branch && (
            <>
              <span>•</span>
              <span>{user.branch}</span>
            </>
          )}
          {user?.semester && (
            <>
              <span>•</span>
              <span>Sem {user.semester}</span>
            </>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-card border border-transparent hover:border-slate-200 dark:hover:border-dark-border transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User profile dropdown */}
        <div className="relative ml-2" ref={dropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1 pl-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-card border border-transparent hover:border-slate-200 dark:hover:border-dark-border transition-colors"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="hidden md:block text-left pr-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {user?.name || 'Student'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {user?.course || 'Student'}
              </p>
            </div>
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-dark-border">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>

              <Link
                to="/profile"
                onClick={() => setUserDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Profile & Settings</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
