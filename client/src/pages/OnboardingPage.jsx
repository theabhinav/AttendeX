import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  School,
  Clock,
  Bell,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const OnboardingPage = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    name: user?.name || '',
    email: user?.email || '',
    profilePicture: user?.profilePicture || '',
    // Step 2: College
    collegeName: user?.collegeName || '',
    universityName: user?.universityName || '',
    collegeLocation: user?.collegeLocation || '',
    course: user?.course || 'B.Tech',
    branch: user?.branch || 'Computer Science & Engineering',
    academicYear: user?.academicYear || '2024-2028',
    semester: user?.semester || 4,
    section: user?.section || 'A',
    // Step 3: Preferences
    attendanceThreshold: user?.attendanceThreshold || 75,
    reminderMinutes: user?.reminderMinutes || 15,
    classCompletionReminder: user?.classCompletionReminder ?? true,
    notificationsEnabled: user?.notificationsEnabled ?? true,
    theme: user?.theme || theme || 'system',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        toast.error('Please enter your full name');
        return;
      }
    }
    if (step === 2) {
      if (!formData.collegeName.trim()) {
        toast.error('Please enter your college name');
        return;
      }
      if (!formData.branch.trim()) {
        toast.error('Please enter your branch or department');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => Math.max(1, prev - 1));

  const handleFinish = async () => {
    try {
      setLoading(true);
      const res = await userService.updateProfile({
        ...formData,
        isOnboarded: true,
      });

      updateUser(res.user);
      if (formData.theme) {
        setTheme(formData.theme);
      }

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success('Onboarding complete! Welcome to AttendX.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Student Onboarding Setup</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Personalize your AttendX workspace
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Configure your institution and attendance targets so AttendX can monitor your timetable.
          </p>

          {/* Stepper Indicator */}
          <div className="mt-8 flex items-center justify-center gap-3">
            {[
              { num: 1, label: 'Personal' },
              { num: 2, label: 'College' },
              { num: 3, label: 'Preferences' },
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step >= s.num
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      step === s.num
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`w-12 h-0.5 rounded-full transition-colors ${
                      step > s.num ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border rounded-3xl p-6 sm:p-10 shadow-xl">
          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-dark-border mb-4">
                <User className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Step 1: Personal Details
                </h3>
              </div>

              <Input
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Alex Chen"
                required
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                disabled
                helperText="Email is associated with your account"
              />

              <Input
                label="Profile Picture URL (optional)"
                type="url"
                value={formData.profilePicture}
                onChange={(e) => handleChange('profilePicture', e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          )}

          {/* STEP 2: COLLEGE DETAILS */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-dark-border mb-4">
                <GraduationCap className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Step 2: College & Academic Details
                </h3>
              </div>

              <Input
                label="College / Institute Name"
                type="text"
                value={formData.collegeName}
                onChange={(e) => handleChange('collegeName', e.target.value)}
                placeholder="e.g. Stanford University / IIT Delhi / UCLA"
                helperText="Enter ANY institution name. AttendX is completely independent."
                leftIcon={School}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="University Name (Optional)"
                  type="text"
                  value={formData.universityName}
                  onChange={(e) => handleChange('universityName', e.target.value)}
                  placeholder="e.g. State University"
                />

                <Input
                  label="Campus Location (Optional)"
                  type="text"
                  value={formData.collegeLocation}
                  onChange={(e) => handleChange('collegeLocation', e.target.value)}
                  placeholder="e.g. California, USA"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Course / Degree
                  </label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => handleChange('course', e.target.value)}
                    placeholder="e.g. B.Tech, BCA, BBA, MBBS"
                    className="block w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                </div>

                <Input
                  label="Department / Branch"
                  type="text"
                  value={formData.branch}
                  onChange={(e) => handleChange('branch', e.target.value)}
                  placeholder="e.g. Computer Science, Mechanical"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => handleChange('academicYear', e.target.value)}
                    placeholder="2024-2028"
                    className="block w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-sm px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Semester
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => handleChange('semester', Number(e.target.value))}
                    className="block w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-sm px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                      <option key={sem} value={sem}>
                        Sem {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Section
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => handleChange('section', e.target.value)}
                    placeholder="A"
                    className="block w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-sm px-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREFERENCES */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-dark-border mb-2">
                <Sliders className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Step 3: Attendance & Reminder Preferences
                </h3>
              </div>

              {/* Attendance Threshold Slider */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Required Attendance Threshold
                  </span>
                  <span className="text-base font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2.5 py-0.5 rounded-lg border border-brand-200 dark:border-brand-800">
                    {formData.attendanceThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="1"
                  value={formData.attendanceThreshold}
                  onChange={(e) => handleChange('attendanceThreshold', Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
                <p className="text-[11px] text-slate-500 mt-2">
                  Standard college requirement is 75%. AttendX will alert you if your attendance approaches this line.
                </p>
              </div>

              {/* Class Reminder Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  Class Reminder Notification
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleChange('reminderMinutes', mins)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        formData.reminderMinutes === mins
                          ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-dark-surface text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-surface cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-brand-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        Class Completion Reminder
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Prompt to mark attendance (Present / Absent) right after a lecture ends
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.classCompletionReminder}
                    onChange={(e) => handleChange('classCompletionReminder', e.target.checked)}
                    className="w-4 h-4 text-brand-600 accent-brand-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-surface cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-brand-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        Low Attendance Warnings
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Receive warnings when any subject slips below target
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificationsEnabled}
                    onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
                    className="w-4 h-4 text-brand-600 accent-brand-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Theme Preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  Preferred Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Laptop },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleChange('theme', t.id)}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        formData.theme === t.id
                          ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-dark-surface text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <t.icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
            {step > 1 ? (
              <Button
                variant="secondary"
                size="md"
                onClick={prevStep}
                leftIcon={ArrowLeft}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                variant="primary"
                size="md"
                onClick={nextStep}
                rightIcon={ArrowRight}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleFinish}
                isLoading={loading}
                rightIcon={Sparkles}
              >
                Complete Setup & Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
