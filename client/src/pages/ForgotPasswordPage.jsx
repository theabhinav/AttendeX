import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';
import { authService } from '../services/authService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    try {
      setLoading(true);
      const res = await authService.forgotPassword(email);
      toast.success(res.message || 'Reset token generated!');
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err) {
      toast.error('Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-indigo-100" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Attend<span className="text-brand-600 dark:text-brand-400">X</span>
          </span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reset your password
        </h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Enter your email to receive password reset instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border py-8 px-6 shadow-xl rounded-2xl sm:px-10">
          {!resetToken ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                leftIcon={Mail}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={loading}
                rightIcon={ArrowRight}
              >
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold mb-1">Reset Token Generated:</p>
                <code className="bg-white dark:bg-dark-card px-2 py-1 rounded border font-mono text-[11px] block select-all break-all">
                  {resetToken}
                </code>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate(`/reset-password?token=${resetToken}`)}
              >
                Proceed to Enter New Password
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
