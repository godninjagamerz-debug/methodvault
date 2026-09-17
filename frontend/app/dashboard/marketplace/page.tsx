'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { marketplaceApi, Method } from '@/lib/api';

export default function MarketplacePage() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    marketplaceApi.listMethods().then(setMethods).catch(console.error).finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(methods.map(m => m.category).filter(Boolean)))];
  const filtered = category === 'All' ? methods : methods.filter(m => m.category === category);

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Marketplace</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Browse and purchase premium methods</p>
      </div>

      {/* Category filter */}
      {!loading && methods.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${category === cat ? 'bg-purple-600 text-white' : 'btn-secondary'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-64 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold mb-2">No methods available</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Check back soon for new methods</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <div key={m.id} className="card flex flex-col hover:border-purple-500/40 transition-colors">
              {m.thumbnail_url ? (
                <img src={m.thumbnail_url} alt={m.name} className="w-full h-40 object-cover rounded-lg mb-4" onError={e => (e.currentTarget.style.display = 'none')} />
              ) : (
                <div className="w-full h-40 rounded-lg mb-4 flex items-center justify-center text-3xl"
                  style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(109,40,217,0.1))' }}>📋</div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-lg leading-tight">{m.name}</h3>
                  {m.category && <span className="badge badge-gray flex-shrink-0">{m.category}</span>}
                </div>
                <p className="text-sm line-clamp-3 mb-4" style={{ color: 'var(--text-secondary)' }}>{m.description}</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xl font-bold" style={{ color: '#a78bfa' }}>₹{(m.price / 100).toFixed(2)}</span>
                <Link href={`/dashboard/marketplace/${m.id}`} className="btn-primary text-sm py-2 px-4">Buy Now</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
