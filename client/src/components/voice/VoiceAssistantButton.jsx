import React from 'react';
import { Mic, Sparkles } from 'lucide-react';

const VoiceAssistantButton = ({ onClick }) => {
  return (
    <div className="fixed bottom-6 right-6 z-40 group">
      {/* Tooltip on hover */}
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none transition-all">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>Voice Assistant & Smart To-Do</span>
      </div>

      {/* Pulsing Backlight Effect */}
      <span className="absolute inset-0 rounded-full bg-brand-500/25 animate-ping pointer-events-none" />

      {/* Floating Circular Mic Button */}
      <button
        onClick={onClick}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-brand-500 text-white shadow-xl shadow-brand-500/30 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20 focus:outline-none focus:ring-4 focus:ring-brand-500/30"
        aria-label="Open Voice Assistant"
      >
        <Mic className="w-6 h-6 transition-transform group-hover:scale-110" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-dark-bg flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </span>
      </button>
    </div>
  );
};

export default VoiceAssistantButton;

