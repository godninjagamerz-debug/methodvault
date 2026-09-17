'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { myApi, Method } from '@/lib/api';

export default function RedeemPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<Method | null>(null);

  function handleCodeChange(val: string) {
    // Auto-uppercase and limit to 24 chars
    setCode(val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.length !== 24) { setError('Code must be exactly 24 characters'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await myApi.redeem(code);
      setSuccess(res.method);
      setCode('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Redemption failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto fade-in">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm mb-4 inline-flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-1">Receive New Method</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Enter your 24-character unlock code below</p>
      </div>

      {success ? (
        <div className="card text-center py-10 fade-in">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
            style={{ background: 'rgba(34,197,94,0.15)' }}>✓</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#4ade80' }}>Method Unlocked!</h2>
          <p className="text-lg font-semibold mb-1">{success.name}</p>
          {success.category && <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{success.category}</p>}
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{success.description}</p>
          <div className="flex gap-3 justify-center">
            <Link href={`/dashboard/methods/${success.id}`} className="btn-primary">View Method</Link>
            <button onClick={() => setSuccess(null)} className="btn-secondary">Redeem Another</button>
          </div>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                24-Character Code
              </label>
              <input
                type="text"
                className="input-base font-mono text-lg tracking-widest text-center"
                placeholder="A7K9P2X4M8Q1Z6R3T5W8N2BC"
                value={code}
                onChange={e => handleCodeChange(e.target.value)}
                maxLength={24}
                spellCheck={false}
                autoComplete="off"
              />
              <div className="mt-2 flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span>Uppercase letters A–Z and numbers 0–9 only</span>
                <span className={code.length === 24 ? 'text-green-400' : ''}>{code.length}/24</span>
              </div>
            </div>

            {/* Code display grid */}
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg flex items-center justify-center font-mono font-bold text-lg"
                  style={{
                    background: code[i] ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${code[i] ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    color: code[i] ? '#c4b5fd' : 'var(--text-secondary)',
                  }}>
                  {code[i] || '·'}
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center py-3 text-base"
              disabled={loading || code.length !== 24}
            >
              {loading ? (
                <span className="spinner inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 2H3v16h5v4l4-4h5l4-4V2zM11 11V7M15 11V7" />
                  </svg>
                  Redeem Code
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
            <p className="font-medium mb-1">📋 How it works</p>
            <ul className="space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li>• Each code can only be redeemed once</li>
              <li>• Codes are valid for exactly one method</li>
              <li>• Once redeemed, the method is added to your library permanently</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
