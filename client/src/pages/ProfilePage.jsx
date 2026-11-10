import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Sliders,
  Lock,
  Trash2,
  Save,
  AlertTriangle,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Clock,
  Bell,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profilePicture: user?.profilePicture || '',
    collegeName: user?.collegeName || '',
    universityName: user?.universityName || '',
    collegeLocation: user?.collegeLocation || '',
    course: user?.course || '',
    branch: user?.branch || '',
    academicYear: user?.academicYear || '',
    semester: user?.semester || 1,
    section: user?.section || '',
    attendanceThreshold: user?.attendanceThreshold || 75,
    reminderMinutes: user?.reminderMinutes || 15,
    classCompletionReminder: user?.classCompletionReminder ?? true,
    notificationsEnabled: user?.notificationsEnabled ?? true,
    theme: user?.theme || theme || 'system',
  });

  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await userService.updateProfile(profileData);
      updateUser(res.user);
      if (profileData.theme) {
        setTheme(profileData.theme);
      }
      toast.success('Profile and preferences updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setSavingPassword(true);
      await userService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE in capital letters to confirm.');
      return;
    }

    if (!window.confirm('Are you absolutely certain? This will delete all your subjects, timetables, and attendance logs.')) {
      return;
    }

    try {
      setDeleting(true);
      await userService.deleteAccount();
      toast.success('Your account has been deleted.');
      logout();
      navigate('/');
    } catch (err) {
      toast.error('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
          <User className="w-4 h-4" />
          <span>Account & Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, academic institution, attendance goals, and themes.
        </p>
      </div>

      {/* SECTION 1: PERSONAL & COLLEGE INFORMATION */}
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-dark-border">
            <GraduationCap className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Student & Academic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              required
            />
            <Input label="Email address" value={profileData.email} disabled />
          </div>

          <Input
            label="College / Institute Name"
            value={profileData.collegeName}
            onChange={(e) => setProfileData({ ...profileData, collegeName: e.target.value })}
            placeholder="e.g. Stanford University / ANY college"
            helperText="AttendX supports ANY college or university"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="University (Optional)"
              value={profileData.universityName}
              onChange={(e) => setProfileData({ ...profileData, universityName: e.target.value })}
            />
            <Input
              label="Campus Location (Optional)"
              value={profileData.collegeLocation}
              onChange={(e) => setProfileData({ ...profileData, collegeLocation: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Course / Degree"
              value={profileData.course}
              onChange={(e) => setProfileData({ ...profileData, course: e.target.value })}
              placeholder="e.g. B.Tech, BCA, MBBS"
              required
            />
            <Input
              label="Department / Branch"
              value={profileData.branch}
              onChange={(e) => setProfileData({ ...profileData, branch: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Academic Year"
              value={profileData.academicYear}
              onChange={(e) => setProfileData({ ...profileData, academicYear: e.target.value })}
            />
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider block">
                Semester
              </label>
              <select
                value={profileData.semester}
                onChange={(e) => setProfileData({ ...profileData, semester: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white text-sm px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                  <option key={s} value={s}>
                    Sem {s}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Section"
              value={profileData.section}
              onChange={(e) => setProfileData({ ...profileData, section: e.target.value })}
            />
          </div>

          {/* SECTION 2: ATTENDANCE THRESHOLD & PREFERENCES */}
          <div className="pt-6 border-t border-slate-100 dark:border-dark-border space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Attendance Threshold & Reminders
              </h3>
            </div>

            {/* Threshold Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Required Minimum Attendance Threshold
                </span>
                <span className="text-sm font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2.5 py-0.5 rounded-lg border border-brand-200">
                  {profileData.attendanceThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="1"
                value={profileData.attendanceThreshold}
                onChange={(e) =>
                  setProfileData({ ...profileData, attendanceThreshold: Number(e.target.value) })
                }
                className="w-full accent-brand-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
            </div>

            {/* Reminder Times */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider block">
                Class Reminder Notification
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setProfileData({ ...profileData, reminderMinutes: mins })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      profileData.reminderMinutes === mins
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-dark-surface text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border'
                    }`}
                  >
                    {mins} mins before
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-dark-border cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Class Completion Reminder Prompt
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Prompt to mark Present / Absent right after lecture finishes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.classCompletionReminder}
                  onChange={(e) =>
                    setProfileData({ ...profileData, classCompletionReminder: e.target.checked })
                  }
                  className="w-4 h-4 accent-brand-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-dark-border cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Low Attendance Alerts
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Warn when any course dips below {profileData.attendanceThreshold}%
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.notificationsEnabled}
                  onChange={(e) =>
                    setProfileData({ ...profileData, notificationsEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-brand-600 cursor-pointer"
                />
              </label>
            </div>

            {/* Theme Settings */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider block">
                Preferred Interface Theme
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
                    onClick={() => setProfileData({ ...profileData, theme: t.id })}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      profileData.theme === t.id
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-dark-surface text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={savingProfile}
              leftIcon={Save}
            >
              Save Profile & Preferences
            </Button>
          </div>
        </form>
      </Card>

      {/* SECTION 3: CHANGE PASSWORD */}
      <Card className="p-6 sm:p-8">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-dark-border">
            <Lock className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Change Password
            </h3>
          </div>

          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="outline" size="sm" isLoading={savingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* SECTION 4: DANGER ZONE (DELETE ACCOUNT) */}
      <Card className="p-6 sm:p-8 border-rose-200 dark:border-rose-950/60 bg-rose-50/20 dark:bg-rose-950/10">
        <div className="flex items-center gap-2 pb-3 border-b border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="text-base font-bold">Danger Zone: Delete Account</h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
          Deleting your account will permanently wipe out all your subjects, timetables, attendance
          records, and settings. This action cannot be reversed.
        </p>

        <div className="mt-4 max-w-sm space-y-3">
          <Input
            label='Type "DELETE" to confirm'
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
          />

          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteAccount}
            isLoading={deleting}
            disabled={deleteConfirmText !== 'DELETE'}
            leftIcon={Trash2}
          >
            Permanently Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
