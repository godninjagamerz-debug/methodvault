'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { myApi, Method } from '@/lib/api';

export default function MethodDetailPage({ params }: { params: { id: string } }) {
  const [method, setMethod] = useState<Method | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    myApi.getMethod(params.id)
      .then(setMethod)
      .catch(err => setError(err.message || 'Failed to load method'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="spinner w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
    </div>
  );

  if (error) return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="card text-center py-10">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <Link href="/dashboard/methods" className="btn-secondary">Back to My Methods</Link>
      </div>
    </div>
  );

  if (!method) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto fade-in">
      <div className="mb-6">
        <Link href="/dashboard/methods" className="text-sm inline-flex items-center gap-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
          ← My Methods
        </Link>
        <div className="flex items-start gap-4">
          {method.thumbnail_url && (
            <img src={method.thumbnail_url} alt={method.name} className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
              onError={e => (e.currentTarget.style.display = 'none')} />
          )}
          <div>
            <h1 className="text-3xl font-bold mb-2">{method.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{method.description}</p>
            <div className="flex items-center gap-3 mt-3">
              {method.category && <span className="badge badge-gray">{method.category}</span>}
              <span className="badge badge-green">✓ Owned</span>
            </div>
          </div>
        </div>
      </div>

      {method.content && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            Method Content
          </h2>
          <div
            className="prose-custom"
            style={{ color: 'var(--text-primary)', lineHeight: '1.8' }}
            dangerouslySetInnerHTML={{ __html: method.content }}
          />
        </div>
      )}
    </div>
  );
}
