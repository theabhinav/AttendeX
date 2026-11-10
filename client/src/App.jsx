import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

import DashboardLayout from './layouts/DashboardLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OnboardingPage from './pages/OnboardingPage';

import DashboardPage from './pages/DashboardPage';
import TimetablePage from './pages/TimetablePage';
import AttendancePage from './pages/AttendancePage';
import TodoPage from './pages/TodoPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CalculatorPage from './pages/CalculatorPage';
import ChatbotPage from './pages/ChatbotPage';
import AssignmentsPage from './pages/AssignmentsPage';
import ExamsPage from './pages/ExamsPage';
import CGPACalculatorPage from './pages/CGPACalculatorPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Route guards
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isOnboarded, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to={isOnboarded ? '/dashboard' : '/onboarding'} replace />;
  }
  return children;
};

const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, isOnboarded, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isOnboarded) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <LandingPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicOnlyRoute>
            <ResetPasswordPage />
          </PublicOnlyRoute>
        }
      />

      {/* Onboarding Flow */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <OnboardingPage />
          </OnboardingRoute>
        }
      />

      {/* Authenticated Dashboard Layout */}
      <Route path="/" element={<DashboardLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="tasks" element={<TodoPage />} />
        <Route path="todo" element={<Navigate to="/tasks" replace />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="chat" element={<ChatbotPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="calculator" element={<CalculatorPage />} />
        <Route path="cgpa" element={<CGPACalculatorPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* 404 Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'text-xs font-semibold rounded-2xl shadow-lg border border-slate-200 dark:border-dark-border dark:bg-dark-card dark:text-white',
                duration: 3500,
              }}
            />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
