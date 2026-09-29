import React, { useState } from 'react';
import { useAuth, TEST_PERSONAS } from '../../context/AuthContext';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  ShieldCheck,
  Store,
  Bike,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    register,
    switchTestPersona,
    user,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+639');
  const [role, setRole] = useState('customer');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (authModalMode === 'login') {
        await login(email, password);
      } else if (authModalMode === 'register') {
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }
        await register({ email, pass: password, fullName, phone, role });
      } else if (authModalMode === 'forgot') {
        setSuccessMsg('Reset instructions dispatched to your verified email address.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePersonaClick = async (p: typeof TEST_PERSONAS[0]) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await switchTestPersona(p.email, p.pass);
    } catch (err: any) {
      setErrorMsg(err.message || 'Persona login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white text-base">
              T
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {authModalMode === 'login' && 'Sign In to TOGO SERVE'}
                {authModalMode === 'register' && 'Create Live Account'}
                {authModalMode === 'forgot' && 'Reset Account Password'}
              </h3>
              <p className="text-xs text-slate-400">
                Philippine Multi-Vendor Commerce & Logistics
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authModalMode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Santos"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Philippine Mobile Number (+63)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="+639171234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Role
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                        role === 'customer'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <User className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="font-bold">Customer</p>
                        <p className="text-[10px] text-slate-500">Order & Padala</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('merchant')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                        role === 'merchant'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Store className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="font-bold">Merchant</p>
                        <p className="text-[10px] text-slate-500">Store Partner</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('rider')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                        role === 'rider'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Bike className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="font-bold">Rider</p>
                        <p className="text-[10px] text-slate-500">Fleet Courier</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('business_owner')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition ${
                        role === 'business_owner'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="font-bold">Enterprise</p>
                        <p className="text-[10px] text-slate-500">Multi-Store Owner</p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {authModalMode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  {authModalMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setAuthModalMode('forgot')}
                      className="text-[11px] text-emerald-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              {isSubmitting
                ? 'Processing...'
                : authModalMode === 'login'
                ? 'Sign In'
                : authModalMode === 'register'
                ? 'Register Live Account'
                : 'Send Reset Instructions'}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
            {authModalMode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('register')}
                  className="font-bold text-emerald-600 hover:underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('login')}
                  className="font-bold text-emerald-600 hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

          {/* Seed Test Persona Fast-Switch (Authenticated via Real SQLite Backend) */}
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl space-y-2 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Sign-In with Provisioned Roles</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Select any pre-seeded persona to authenticate directly against the SQLite database with real bcrypt and JWT:
            </p>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {TEST_PERSONAS.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handlePersonaClick(p)}
                  disabled={isSubmitting}
                  className="text-left p-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 transition text-[11px]"
                >
                  <p className="font-bold text-slate-900 truncate">{p.label}</p>
                  <p className="text-[10px] text-emerald-700 font-medium">{p.tag}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
