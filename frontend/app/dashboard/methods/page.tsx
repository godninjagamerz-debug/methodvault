'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { myApi, UserMethod } from '@/lib/api';

export default function MyMethodsPage() {
  const [methods, setMethods] = useState<UserMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    myApi.listMethods().then(setMethods).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Methods</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Methods you&apos;ve unlocked</p>
        </div>
        <Link href="/dashboard/redeem" className="btn-primary">+ Receive Method</Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-48 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      ) : methods.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-semibold mb-2">No methods yet</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Redeem a code or purchase a method from the marketplace
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/redeem" className="btn-primary">Redeem Code</Link>
            <Link href="/dashboard/marketplace" className="btn-secondary">Browse Marketplace</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map(m => (
            <Link key={m.id} href={`/dashboard/methods/${m.id}`}
              className="card hover:border-purple-500/40 transition-all cursor-pointer group"
              style={{ textDecoration: 'none' }}>
              <div className="flex gap-4">
                {m.thumbnail_url ? (
                  <img src={m.thumbnail_url} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" onError={e => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <div className="w-20 h-20 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl"
                    style={{ background: 'rgba(124,58,237,0.15)' }}>📄</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold group-hover:text-purple-300 transition-colors">{m.name}</h3>
                    <span className={`badge flex-shrink-0 ${m.source === 'code' ? 'badge-purple' : 'badge-green'}`}>
                      {m.source === 'code' ? 'Code' : 'Purchased'}
                    </span>
                  </div>
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{m.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {m.category && <span className="badge badge-gray">{m.category}</span>}
                    <span>Unlocked {new Date(m.unlocked_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
