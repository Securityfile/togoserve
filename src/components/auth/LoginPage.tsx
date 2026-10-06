import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { DEMO_USERNAME, DEMO_PASSWORD } from '../../auth/authService';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  KeyRound,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateHome }) => {
  const { login, intendedPath } = useAuth();

  const [username, setUsername] = useState('testpage2026');
  const [password, setPassword] = useState('testpage2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const result = login({ username, password });
      if (result.success) {
        onLoginSuccess();
      } else {
        setErrorMsg(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login encountered an unexpected error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemoCredentials = () => {
    setUsername(DEMO_USERNAME);
    setPassword(DEMO_PASSWORD);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* Top back button */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Public Overview</span>
        </button>

        <span className="text-[11px] text-slate-500 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
          Demo Gate
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Card Header with Brand */}
        <div className="p-6 bg-slate-900/80 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/20">
            T
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-lg tracking-tight text-white">
                TOGO<span className="text-emerald-400">SERVE</span>
              </h1>
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1 py-0.2 rounded font-bold uppercase">
                PH
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Platform Authentication Gate
            </p>
          </div>
        </div>

        {/* Development / Demo Disclosure Box */}
        <div className="m-6 mb-2 bg-amber-950/40 border border-amber-500/30 p-3.5 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Development Demo Access</span>
          </div>
          <p className="text-amber-200/80 text-[11px] leading-relaxed">
            This authentication is not intended for production security. Use the provided demonstration credentials below to enter the platform.
          </p>

          <div className="pt-1.5 border-t border-amber-500/20 flex items-center justify-between text-[11px] text-amber-300">
            <div>
              <span className="font-semibold text-slate-300">Username: </span>
              <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">
                {DEMO_USERNAME}
              </code>
            </div>
            <div>
              <span className="font-semibold text-slate-300">Password: </span>
              <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">
                {DEMO_PASSWORD}
              </code>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
          {intendedPath && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>You will be redirected to: <code className="font-mono text-white">{intendedPath}</code></span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-950/50 border border-rose-500/40 text-rose-300 p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-10 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleFillDemoCredentials}
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition text-[11px]"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Fill Demo Credentials</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In to ToGoServe'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Card Footer */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-800/80 text-center text-xs text-slate-500">
          ToGoServe Philippines • Multi-Category Commerce & Logistics Baseline
        </div>
      </div>
    </div>
  );
};
