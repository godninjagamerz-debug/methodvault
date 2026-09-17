'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi, Method } from '@/lib/api';

export default function AdminMethodsPage() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    adminApi.listMethods().then(setMethods).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await adminApi.deleteMethod(id);
      setMethods(prev => prev.filter(m => m.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  async function togglePublished(m: Method) {
    try {
      const updated = await adminApi.updateMethod(m.id, { published: !m.published });
      setMethods(prev => prev.map(x => x.id === m.id ? updated : x));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function toggleMarketplace(m: Method) {
    try {
      const updated = await adminApi.updateMethod(m.id, { marketplace_listed: !m.marketplace_listed });
      setMethods(prev => prev.map(x => x.id === m.id ? updated : x));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  }

  return (
    <div className="p-8 fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Methods</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{methods.length} total methods</p>
        </div>
        <Link href="/admin/methods/new" className="btn-primary">+ Upload New Method</Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
        </div>
      ) : methods.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold mb-2">No methods yet</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Create your first method to get started</p>
          <Link href="/admin/methods/new" className="btn-primary">Create Method</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map(m => (
            <div key={m.id} className="card flex items-center gap-4">
              {m.thumbnail_url ? (
                <img src={m.thumbnail_url} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  onError={e => (e.currentTarget.style.display = 'none')} />
              ) : (
                <div className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center text-xl"
                  style={{ background: 'rgba(124,58,237,0.15)' }}>📄</div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{m.name}</h3>
                  <span className={`badge ${m.published ? 'badge-green' : 'badge-gray'}`}>
                    {m.published ? 'Published' : 'Draft'}
                  </span>
                  {m.marketplace_listed && <span className="badge badge-purple">Marketplace</span>}
                </div>
                <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{m.description}</p>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {m.category && <span>{m.category}</span>}
                  <span>₹{(m.price / 100).toFixed(2)}</span>
                  <span>{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => togglePublished(m)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${m.published ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' : 'border-gray-500/30 text-gray-400 hover:bg-gray-500/10'}`}
                >
                  {m.published ? '✓ Published' : '○ Draft'}
                </button>
                <button
                  onClick={() => toggleMarketplace(m)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${m.marketplace_listed ? 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10' : 'border-gray-500/30 text-gray-400 hover:bg-gray-500/10'}`}
                >
                  {m.marketplace_listed ? '🛒 Listed' : '○ Unlisted'}
                </button>
                <Link href={`/admin/methods/${m.id}/codes`} className="btn-secondary text-xs py-1.5 px-3">
                  🔑 Codes
                </Link>
                <Link href={`/admin/methods/${m.id}/edit`} className="btn-secondary text-xs py-1.5 px-3">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(m.id, m.name)}
                  disabled={deleting === m.id}
                  className="btn-danger text-xs py-1.5 px-3"
                >
                  {deleting === m.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
