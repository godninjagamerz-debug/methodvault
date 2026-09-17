'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { adminApi, Method } from '@/lib/api';
import MethodForm from '@/components/MethodForm';

export default function EditMethodPage({ params }: { params: { id: string } }) {
  const [method, setMethod] = useState<Method | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === '1';

  useEffect(() => {
    adminApi.getMethod(params.id)
      .then(setMethod)
      .catch(() => setError('Method not found'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="spinner w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
    </div>
  );

  if (error || !method) return (
    <div className="p-8"><div className="card text-center py-10">
      <p className="mb-4">Method not found</p>
      <Link href="/admin/methods" className="btn-secondary">← Back</Link>
    </div></div>
  );

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <Link href="/admin/methods" className="text-sm inline-flex items-center gap-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
          ← Methods
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Edit Method</h1>
        </div>
        {justCreated && (
          <div className="mt-3 rounded-lg p-3 text-sm inline-flex items-center gap-2"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
            ✓ Method created! Now you can edit it further or <Link href={`/admin/methods/${params.id}/codes`} style={{ color: '#4ade80', textDecoration: 'underline' }}>generate codes</Link>.
          </div>
        )}
      </div>
      <div className="flex gap-4 mb-6">
        <Link href={`/admin/methods/${params.id}/codes`} className="btn-secondary text-sm">
          🔑 Manage Codes
        </Link>
      </div>
      <MethodForm initial={method} methodId={params.id} mode="edit" />
    </div>
  );
}
