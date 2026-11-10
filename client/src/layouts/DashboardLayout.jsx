import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import ClassCompletionPrompt from '../components/common/ClassCompletionPrompt';
import VoiceAssistantButton from '../components/voice/VoiceAssistantButton';
import VoiceAssistantModal from '../components/voice/VoiceAssistantModal';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const { isAuthenticated, isOnboarded, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading AttendX...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar onMobileMenuToggle={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Automatic class completion reminder prompt */}
      <ClassCompletionPrompt />

      {/* Global Voice Assistant AI Floating Button */}
      <VoiceAssistantButton onClick={() => setIsVoiceModalOpen(true)} />

      {/* Global Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTaskActionSuccess={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('attendx:task-updated'));
          }
        }}
      />
    </div>
  );
};

export default DashboardLayout;
