import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  BarChart3,
  Calculator,
  User,
  Sparkles,
  Bot,
  FileText,
  GraduationCap,
  Award,
  ListTodo,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Timetable', href: '/timetable', icon: CalendarDays, badge: 'AI' },
  { name: 'Attendance', href: '/attendance', icon: CheckSquare },
  { name: 'Smart Tasks', href: '/tasks', icon: ListTodo, badge: 'VOICE' },
  { name: 'Assignments', href: '/assignments', icon: FileText },
  { name: 'Exams & Vivas', href: '/exams', icon: GraduationCap },
  { name: 'AttendX AI', href: '/chat', icon: Bot, badge: 'PRO' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Bunk Calculator', href: '/calculator', icon: Calculator },
  { name: 'CGPA Predictor', href: '/cgpa', icon: Award },
  { name: 'Profile & Settings', href: '/profile', icon: User },
];

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-slate-200/80 dark:border-dark-border bg-white dark:bg-dark-surface flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-dark-border">
          <NavLink to="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Attend<span className="text-brand-600 dark:text-brand-400">X</span>
              </span>
              <span className="text-[10px] block font-semibold text-slate-400 tracking-wider uppercase -mt-1">
                Smart Tracker
              </span>
            </div>
          </NavLink>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-card hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-xs">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Target percentage footer card */}
        <div className="p-4 border-t border-slate-100 dark:border-dark-border m-3 rounded-2xl bg-slate-50 dark:bg-dark-card/60">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Goal Threshold</span>
            <span className="font-bold text-brand-600 dark:text-brand-400">
              {user?.attendanceThreshold || 75}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            AttendX monitors your timetable and warns you before you fall below this threshold.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
