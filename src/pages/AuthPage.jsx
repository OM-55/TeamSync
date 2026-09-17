import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

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
        await signup(email, password);
        navigate('/onboarding');
      } else {
        const res = await login(email, password);
        if (res.user.onboarded === 0 && res.user.role !== 'ADMIN') {
          navigate('/onboarding');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
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
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 font-bold text-white text-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-900/40">
            TS
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            {mode === 'signup' ? 'Create your TeamSync Account' : 'Welcome back to TeamSync'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect. Collaborate. Build.
          </p>
        </div>

        <div className="card-base bg-slate-900 border-slate-800">
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'login' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'signup' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                College Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {submitting ? 'Please wait...' : (mode === 'signup' ? 'Create Account' : 'Log In')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-xs text-slate-400 mb-3 font-semibold text-center uppercase tracking-wider">
              Quick One-Click Demo Logins
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('alex@mit.edu', 'Password123!')}
                className="w-full btn-secondary text-xs justify-between py-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span>Alex Rivera (MIT • 2nd Year)</span>
                </div>
                <span className="text-[10px] text-slate-400">Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('priya@stanford.edu', 'Password123!')}
                className="w-full btn-secondary text-xs justify-between py-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Priya Sharma (Stanford • 2nd Year)</span>
                </div>
                <span className="text-[10px] text-slate-400">Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin@teamsync.edu', 'Password123!')}
                className="w-full bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 text-amber-300 text-xs font-medium rounded-lg px-3 py-2 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Platform Administrator</span>
                </div>
                <span className="text-[10px] bg-amber-900/80 px-1.5 py-0.5 rounded text-amber-200">Admin</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
