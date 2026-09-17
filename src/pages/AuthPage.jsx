import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState(initialMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.onboarded === 0 && user.role !== 'ADMIN') {
        navigate('/onboarding');
      } else {
        navigate('/home');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        const res = await signup(email, password);
        if (res.user.onboarded === 0 && res.user.role !== 'ADMIN') {
          navigate('/onboarding');
        } else {
          navigate('/home');
        }
      } else {
        const res = await login(email, password);
        if (res.user.onboarded === 0 && res.user.role !== 'ADMIN') {
          navigate('/onboarding');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await login(demoEmail, demoPassword);
      if (res.user.onboarded === 0 && res.user.role !== 'ADMIN') {
        navigate('/onboarding');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-extrabold text-white text-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-blue-950/60 ring-1 ring-blue-400/30">
            TS
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            {mode === 'signup' ? 'Create your TeamSync Account' : 'Welcome back to TeamSync'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
            Connect. Collaborate. Build.
          </p>
        </div>

        <div className="card-base bg-slate-900/90 border-slate-800/80 p-6 sm:p-8">
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                mode === 'login' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                mode === 'signup' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs rounded-xl p-3.5 mb-5 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                College Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 mt-3 text-sm font-semibold"
            >
              {submitting ? 'Please wait...' : (mode === 'signup' ? 'Create Account' : 'Log In')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick One-Click Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-400 mb-3 font-semibold text-center uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Quick One-Click Demo Logins
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('alex@mit.edu', 'Password123!')}
                className="w-full btn-secondary text-xs justify-between py-2.5 px-3.5"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-slate-200">Alex Rivera (MIT • 2nd Year)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('priya@stanford.edu', 'Password123!')}
                className="w-full btn-secondary text-xs justify-between py-2.5 px-3.5"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium text-slate-200">Priya Sharma (Stanford • 2nd Year)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin@teamsync.edu', 'Password123!')}
                className="w-full bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 text-amber-300 text-xs font-medium rounded-xl px-3.5 py-2.5 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Platform Administrator</span>
                </div>
                <span className="text-[10px] bg-amber-900/80 px-2 py-0.5 rounded text-amber-200 font-semibold">Admin</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
