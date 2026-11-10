import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { Sparkles, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex flex-col items-center justify-center p-4 text-center">
      <div className="h-16 w-16 rounded-3xl bg-brand-600/10 text-brand-600 flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 dark:text-white">404</h1>
      <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-2">
        Page Not Found
      </h2>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">
        The timetable or page you are looking for doesn't exist or has been moved.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button variant="primary" size="md" leftIcon={Home}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
