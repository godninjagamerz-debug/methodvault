'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({ methods: 0, users: 0, purchases: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.listMethods().catch(() => []),
      adminApi.listUsers().catch(() => []),
      adminApi.listPurchases().catch(() => []),
    ]).then(([methods, users, purchases]) => {
      const revenue = purchases.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      setStats({ methods: methods.length, users: users.length, purchases: purchases.length, revenue });
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Methods', value: stats.methods, icon: '📋', href: '/admin/methods', color: '#7c3aed' },
    { label: 'Registered Users', value: stats.users, icon: '👥', href: '/admin/users', color: '#0ea5e9' },
    { label: 'Total Purchases', value: stats.purchases, icon: '💳', href: '/admin/purchases', color: '#10b981' },
    { label: 'Revenue', value: `₹${(stats.revenue / 100).toFixed(2)}`, icon: '💰', href: '/admin/purchases', color: '#f59e0b' },
  ];

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Overview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>MethodVault admin panel</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <Link key={s.label} href={s.href} className="card hover:border-purple-500/30 transition-colors" style={{ textDecoration: 'none' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-2xl">{s.icon}</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-secondary)' }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/admin/methods/new" className="btn-primary w-full justify-center">
              + Upload New Method
            </Link>
            <Link href="/admin/codes" className="btn-secondary w-full justify-center">
              🔑 Manage Codes
            </Link>
            <Link href="/admin/users" className="btn-secondary w-full justify-center">
              👥 View Users
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">System Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Code Format</span>
              <span className="font-mono">24-char A–Z 0–9</span>
            </div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Currency</span>
              <span>INR (prices in paise)</span>
            </div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payment Gateway</span>
              <span>Razorpay</span>
            </div>
            <div className="flex justify-between py-2">
              <span style={{ color: 'var(--text-secondary)' }}>Auth</span>
              <span>JWT Bearer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
