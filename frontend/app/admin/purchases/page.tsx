'use client';
import { useEffect, useState } from 'react';
import { adminApi, Purchase } from '@/lib/api';

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    adminApi.listPurchases().then(setPurchases).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = purchases.filter(p => filterStatus === 'all' || p.status === filterStatus);

  const revenue = purchases.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  const counts = {
    all: purchases.length,
    paid: purchases.filter(p => p.status === 'paid').length,
    created: purchases.filter(p => p.status === 'created').length,
    failed: purchases.filter(p => p.status === 'failed').length,
  };

  const statusBadge = (status: string) => {
    if (status === 'paid') return <span className="badge badge-green">Paid</span>;
    if (status === 'failed') return <span className="badge badge-red">Failed</span>;
    return <span className="badge badge-yellow">Pending</span>;
  };

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Purchases</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Total revenue: <span className="font-semibold" style={{ color: '#4ade80' }}>₹{(revenue / 100).toFixed(2)}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: counts.all, color: '#9090aa' },
          { label: 'Paid', value: counts.paid, color: '#4ade80' },
          { label: 'Pending', value: counts.created, color: '#facc15' },
          { label: 'Failed', value: counts.failed, color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'paid', 'created', 'failed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterStatus === s ? 'bg-purple-600 text-white' : 'btn-secondary'}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-14 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">💳</div>
          <p className="text-lg">{purchases.length === 0 ? 'No purchases yet' : 'No purchases match filter'}</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['USER', 'METHOD', 'AMOUNT', 'STATUS', 'RAZORPAY ORDER', 'DATE'].map(h => (
                  <th key={h} className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="px-4 py-3 text-sm">{(p as Purchase & { user_email?: string }).user_email || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium">{p.method_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold" style={{ color: p.status === 'paid' ? '#4ade80' : 'inherit' }}>
                      ₹{(p.amount / 100).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{p.razorpay_order_id}</span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(p.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
