import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ScanLine,
  Calculator,
  BellRing,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  CalendarCheck,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import Button from '../components/common/Button';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <span className="text-xl font-black tracking-tight">
              Attend<span className="text-brand-600 dark:text-brand-400">X</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" rightIcon={ArrowRight}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 lg:py-28 px-4 sm:px-6 max-w-7xl mx-auto text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/10 dark:bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-6">
            <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
            <span>AI-Powered Timetable Scanner & Attendance Assistant</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Never fall below{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              75% attendance
            </span>{' '}
            again.
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            AttendX tracks your academic schedule across <strong>any college or university</strong>.
            Upload a photo of your timetable, let AI structure your classes, and calculate exactly
            how many lectures you can safely miss.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 py-3.5" rightIcon={ArrowRight}>
                Scan Your Timetable Free
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base px-8 py-3.5">
                Explore Demo Account
              </Button>
            </Link>
          </div>

          {/* USP Highlights List */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Works for ANY College
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> One-Click AI Timetable OCR
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Push Reminders & Alerts
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Accurate Bunk Calculator
            </span>
          </div>

          {/* Interactive Mockup Preview Card */}
          <div className="mt-16 max-w-5xl mx-auto rounded-3xl border border-slate-200/80 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 ml-2">attendx.app/dashboard</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Live Overview
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-surface border border-slate-200/60 dark:border-dark-border">
                <span className="text-xs text-slate-500">Overall Attendance</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">84.6%</p>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +9.6% above 75% target
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-surface border border-slate-200/60 dark:border-dark-border">
                <span className="text-xs text-slate-500">Conducted Classes</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">52</p>
                <span className="text-[11px] text-slate-400 mt-1 block">Semester to date</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-surface border border-slate-200/60 dark:border-dark-border">
                <span className="text-xs text-slate-500">Attended Classes</span>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">44</p>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Present</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-surface border border-slate-200/60 dark:border-dark-border">
                <span className="text-xs text-slate-500">Safe Bunks Left</span>
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1">6 Classes</p>
                <span className="text-[11px] text-brand-600 font-semibold mt-1 block">Safe to miss</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 bg-slate-100/60 dark:bg-dark-surface/50 border-t border-slate-200/80 dark:border-dark-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                Everything you need to master your college attendance
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">
                Built specifically for college & university students who want frictionless attendance management.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border shadow-subtle hover:shadow-premium transition-all">
                <div className="h-12 w-12 rounded-2xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-6">
                  <ScanLine className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  AI Timetable Scanner
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Simply upload your timetable screenshot, photo, or PDF. Our vision-capable AI
                  automatically detects subjects, slots, rooms, and faculty with zero manual data entry.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border shadow-subtle hover:shadow-premium transition-all">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Smart Bunk Calculator
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Know exactly how many consecutive lectures you can safely skip without falling
                  below your 75% target, or how many classes you must attend to recover.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border shadow-subtle hover:shadow-premium transition-all">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                  <BellRing className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Class Reminders & Alerts
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Receive Web Push reminders 15 minutes before class and an instant prompt when class
                  ends to mark yourself Present or Absent with a single tap.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-dark-border bg-white dark:bg-dark-surface py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AttendX. Smart Attendance Platform for Any College.</p>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-slate-900 dark:hover:text-white">
              Login
            </Link>
            <Link to="/register" className="hover:text-slate-900 dark:hover:text-white">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
