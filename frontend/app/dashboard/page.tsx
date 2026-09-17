'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { myApi, marketplaceApi, UserMethod, Method } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<UserMethod[]>([]);
  const [marketplace, setMarketplace] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      myApi.listMethods().catch(() => []),
      marketplaceApi.listMethods().catch(() => []),
    ]).then(([m, mp]) => {
      setMethods(m);
      setMarketplace(mp);
    }).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Methods Unlocked', value: methods.length, icon: '📚' },
    { label: 'Available in Marketplace', value: marketplace.length, icon: '🛒' },
    { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—', icon: '🗓️' },
  ];

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Welcome back</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
      </div>

      {/* Receive CTA */}
      <Link href="/dashboard/redeem" className="block mb-8 rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.01]"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(109,40,217,0.15))', border: '1px solid rgba(124,58,237,0.35)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'rgba(124,58,237,0.3)' }}>+</div>
              <h2 className="text-xl font-bold" style={{ color: '#c4b5fd' }}>Receive New Method</h2>
            </div>
            <p className="text-sm" style={{ color: '#a78bfa' }}>Enter your 24-character code to unlock a method</p>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold mb-1">{loading ? '—' : s.value}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Methods */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Methods</h2>
          <Link href="/dashboard/methods" className="text-sm" style={{ color: '#a78bfa' }}>View all →</Link>
        </div>
        {loading ? (
          <div className="card text-center py-8" style={{ color: 'var(--text-secondary)' }}>Loading…</div>
        ) : methods.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-lg mb-2">No methods yet</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Redeem a code or purchase from the marketplace</p>
            <Link href="/dashboard/redeem" className="btn-primary">Receive Method</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {methods.slice(0, 4).map(m => (
              <Link key={m.id} href={`/dashboard/methods/${m.id}`} className="card hover:border-purple-500/40 transition-colors cursor-pointer" style={{ textDecoration: 'none' }}>
                {m.thumbnail_url && <img src={m.thumbnail_url} alt={m.name} className="w-full h-32 object-cover rounded-lg mb-3" onError={e => (e.currentTarget.style.display = 'none')} />}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold mb-1">{m.name}</h3>
                    <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{m.description}</p>
                  </div>
                  <span className="badge badge-purple flex-shrink-0">{m.source === 'code' ? 'Code' : 'Purchased'}</span>
                </div>
                <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {m.category} • Unlocked {new Date(m.unlocked_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Marketplace Preview */}
      {marketplace.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Marketplace</h2>
            <Link href="/dashboard/marketplace" className="text-sm" style={{ color: '#a78bfa' }}>Browse all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {marketplace.slice(0, 2).map(m => (
              <div key={m.id} className="card">
                {m.thumbnail_url && <img src={m.thumbnail_url} alt={m.name} className="w-full h-28 object-cover rounded-lg mb-3" onError={e => (e.currentTarget.style.display = 'none')} />}
                <h3 className="font-semibold mb-1">{m.name}</h3>
                <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{m.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold" style={{ color: '#a78bfa' }}>₹{(m.price / 100).toFixed(2)}</span>
                  <Link href={`/dashboard/marketplace/${m.id}`} className="btn-primary text-sm py-1.5 px-3">Buy Now</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
