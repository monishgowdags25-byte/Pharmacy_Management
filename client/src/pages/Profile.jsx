import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Shield, Key, Eye, EyeOff, Loader2 } from 'lucide-react';

const Profile = () => {
  const { user, changePassword } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill all password fields.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast('Password successfully changed!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message || 'Failed to change password. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Profile</h1>
        <p className="text-sm text-slate-500">Manage your credentials and access details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Profile Summary Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm space-y-6">
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
            <div className="bg-primary-50 text-primary-600 p-5 rounded-3xl border border-primary-100/50 mb-4">
              <User className="h-12 w-12" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
            <span className="text-xs text-slate-400 mt-0.5">{user?.email}</span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-semibold uppercase text-xs">Role Tier</span>
              <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-xs uppercase tracking-wider">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-semibold uppercase text-xs">Account Status</span>
              <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg text-xs">
                {user?.status}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-semibold uppercase text-xs">Created At</span>
              <span className="text-slate-600 font-semibold">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-400">
            <Shield className="h-4.5 w-4.5 text-slate-400 shrink-0" />
            <span>Roles determine what dashboards and actions you are permitted to access.</span>
          </div>
        </div>

        {/* Right Side: Change Password Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center space-x-2">
            <Key className="h-5 w-5 text-slate-500" />
            <span>Update Password</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6">Modify your security access credentials.</p>

          <form onSubmit={handlePasswordChange} className="space-y-5 max-w-xl">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
