import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      showToast('Welcome back! Successfully logged in.', 'success');
      navigate('/');
    } catch (error) {
      console.error('Login submit error:', error);
      showToast(error.message || 'Authentication failed. Please verify credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background blobs for premium glassmorphism */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 bg-primary-200/50 rounded-full filter blur-[80px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 bg-emerald-200/40 rounded-full filter blur-[80px] -z-10"></div>

      {/* Login Card */}
      <div className="glass max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-xl border border-white/60">
        
        {/* Logo block */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-primary-600 text-white p-3.5 rounded-2xl shadow-lg shadow-primary-600/20 mb-3">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Access PharmaCare</h1>
          <p className="text-xs text-slate-500 mt-1">Enter your staff credentials to enter the pharmacy desk</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-xs font-bold text-slate-600 tracking-wide uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                id="login-email"
                type="email" 
                autoComplete="email"
                placeholder="admin@pharmacare.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/90 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition focus-visible:ring-2 focus-visible:ring-primary-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-xs font-bold text-slate-600 tracking-wide uppercase">Password</label>
              <button
                type="button" 
                onClick={() => showToast('Default admin password is set during initial seeding or managed by system administrators.', 'info')} 
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 focus:outline-none"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                id="login-password"
                type={showPassword ? 'text' : 'password'} 
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-white/90 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition focus-visible:ring-2 focus-visible:ring-primary-500 font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password text" : "Show password text"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember details */}
          <div className="flex items-center space-x-2.5">
            <input type="checkbox" id="remember" className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500 cursor-pointer" defaultChecked />
            <label htmlFor="remember" className="text-xs text-slate-600 font-medium cursor-pointer">Keep me signed in for 30 days</label>
          </div>

          {/* Action Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 transition active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Secure Log In</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Security badge */}
        <div className="flex items-center justify-center space-x-2 mt-8 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4 text-primary-600" />
          <span>AES-256 TLS Encrypted Gateway</span>
        </div>

      </div>
    </div>
  );
};

export default Login;
