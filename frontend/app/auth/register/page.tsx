'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { token, user } = await authApi.register(email, password);
      login(token, user);
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">MethodVault</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Create your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" className="input-base" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input type="password" className="input-base" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
              <input type="password" className="input-base" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? <span className="spinner inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : 'Create Account'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium" style={{ color: '#a78bfa' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
