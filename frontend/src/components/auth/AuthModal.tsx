import React, { useState } from 'react';
import { X, Loader, ArrowLeft, Mail } from 'lucide-react';
import { signIn, signUp, sendPasswordResetEmail } from '@/services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot-password'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email, password, displayName);
        onClose();
        // Reset form
        setEmail('');
        setPassword('');
        setDisplayName('');
      } else if (mode === 'forgot-password') {
        await sendPasswordResetEmail(email);
        setResetEmailSent(true);
      } else {
        await signIn(email, password);
        onClose();
        // Reset form
        setEmail('');
        setPassword('');
        setDisplayName('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          {mode === 'forgot-password' && (
            <button
              onClick={() => {
                setMode('signin');
                setError(null);
                setResetEmailSent(false);
              }}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-3 -ml-1"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </button>
          )}
          <h2 className="text-2xl font-bold text-slate-200 mb-2">
            {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          <p className="text-sm text-slate-400">
            {mode === 'signin'
              ? 'Sign in to continue your journey with DMN'
              : mode === 'signup'
              ? 'Join to save your conversations and access full features'
              : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Password reset success message */}
        {resetEmailSent && mode === 'forgot-password' && (
          <div className="mb-4 p-4 bg-green-900/20 border border-green-900/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/20 rounded-full">
                <Mail size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-400">Reset email sent!</p>
                <p className="text-xs text-slate-400 mt-1">Check your inbox for a link to reset your password.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMode('signin');
                setResetEmailSent(false);
                setEmail('');
              }}
              className="mt-4 w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              Return to Sign In
            </button>
          </div>
        )}

        {/* Form */}
        {!(resetEmailSent && mode === 'forgot-password') && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          {mode !== 'forgot-password' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader size={16} className="animate-spin" />}
            {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link')}
          </button>
        </form>
        )}

        {/* Forgot password link */}
        {mode === 'signin' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setMode('forgot-password');
                setError(null);
              }}
              className="text-sm text-slate-400 hover:text-slate-300"
            >
              Forgot your password?
            </button>
          </div>
        )}

        {/* Toggle mode */}
        {mode !== 'forgot-password' && (
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
            }}
            className="text-sm text-sky-400 hover:text-sky-300"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
        )}

        {/* Guest mode info */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">
            Sign in required to chat with DMN. Free plan available for all users.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
