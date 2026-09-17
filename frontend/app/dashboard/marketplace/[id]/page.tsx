'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { marketplaceApi, purchasesApi, Method } from '@/lib/api';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}
interface RazorpayInstance { open(): void; }

export default function MarketplaceDetailPage({ params }: { params: { id: string } }) {
  const [method, setMethod] = useState<Method | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    marketplaceApi.getMethod(params.id)
      .then(setMethod)
      .catch(() => setError('Method not found'))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleBuy() {
    if (!method) return;
    setError('');
    setBuying(true);

    try {
      const order = await purchasesApi.createOrder(method.id);

      // Dynamically load Razorpay script
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load payment gateway'));
          document.body.appendChild(script);
        });
      }

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'MethodVault',
        description: method.name,
        order_id: order.razorpay_order_id,
        handler: async (response) => {
          try {
            await purchasesApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            router.push(`/dashboard/methods/${method.id}?unlocked=1`);
          } catch (verifyErr: unknown) {
            setError(verifyErr instanceof Error ? verifyErr.message : 'Payment verification failed');
          } finally {
            setBuying(false);
          }
        },
        theme: { color: '#7c3aed' },
        modal: { ondismiss: () => setBuying(false) },
      });
      rzp.open();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
      setBuying(false);
    }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="spinner w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!method) return (
    <div className="p-8"><div className="card text-center py-10">
      <p className="text-xl mb-4">Method not found</p>
      <Link href="/dashboard/marketplace" className="btn-secondary">← Back</Link>
    </div></div>
  );

  return (
    <div className="p-8 max-w-3xl mx-auto fade-in">
      <Link href="/dashboard/marketplace" className="text-sm inline-flex items-center gap-1 mb-6" style={{ color: 'var(--text-secondary)' }}>
        ← Marketplace
      </Link>

      {method.thumbnail_url && (
        <img src={method.thumbnail_url} alt={method.name} className="w-full h-56 object-cover rounded-2xl mb-6"
          onError={e => (e.currentTarget.style.display = 'none')} />
      )}

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{method.name}</h1>
          <div className="flex items-center gap-3">
            {method.category && <span className="badge badge-gray">{method.category}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-3xl font-bold mb-1" style={{ color: '#a78bfa' }}>₹{(method.price / 100).toFixed(2)}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>One-time purchase</div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold mb-3">About this Method</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>{method.description}</p>
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm mb-4" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(109,40,217,0.08))', border: '1px solid rgba(124,58,237,0.3)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-lg mb-1">Get Instant Access</p>
            <p className="text-sm" style={{ color: '#a78bfa' }}>Secure payment via Razorpay</p>
          </div>
          <button
            onClick={handleBuy}
            disabled={buying}
            className="btn-primary text-base px-6 py-3"
          >
            {buying ? (
              <span className="spinner inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : `Buy for ₹${(method.price / 100).toFixed(2)}`}
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span>🔒 Secure payment</span>
        <span>•</span>
        <span>⚡ Instant access</span>
        <span>•</span>
        <span>♾️ Lifetime ownership</span>
      </div>
    </div>
  );
}
