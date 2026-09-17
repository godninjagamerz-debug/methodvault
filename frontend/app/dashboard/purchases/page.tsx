'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { purchasesApi, Purchase } from '@/lib/api';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    purchasesApi.listPurchases().then(setPurchases).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statusBadge = (status: string) => {
    if (status === 'paid') return <span className="badge badge-green">Paid</span>;
    if (status === 'failed') return <span className="badge badge-red">Failed</span>;
    return <span className="badge badge-yellow">Pending</span>;
  };

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">My Purchases</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Your purchase history</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-16 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">💳</div>
          <h2 className="text-xl font-semibold mb-2">No purchases yet</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Browse the marketplace to find methods you&apos;d like to purchase</p>
          <Link href="/dashboard/marketplace" className="btn-primary">Browse Marketplace</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map(p => (
            <div key={p.id} className="card flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold">{p.method_name || 'Unknown Method'}</h3>
                  {statusBadge(p.status)}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Order: {p.razorpay_order_id} • {new Date(p.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-lg" style={{ color: '#a78bfa' }}>₹{(p.amount / 100).toFixed(2)}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.currency}</div>
              </div>
              {p.status === 'paid' && (
                <Link href={`/dashboard/methods/${p.method_id}`} className="btn-secondary text-sm py-1.5 px-3">View →</Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
