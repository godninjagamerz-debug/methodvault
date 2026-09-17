'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/dashboard/methods', label: 'My Methods', icon: '📚' },
  { href: '/dashboard/marketplace', label: 'Marketplace', icon: '🛒' },
  { href: '/dashboard/purchases', label: 'Purchases', icon: '💳' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
    if (!loading && user?.role === 'admin') router.replace('/admin');
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="spinner w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
    </div>;
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col glass border-r-0" style={{ borderRight: '1px solid var(--border)', minHeight: '100vh' }}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-lg">MethodVault</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}>
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="pt-4">
            <Link href="/dashboard/redeem" className={`sidebar-link ${pathname === '/dashboard/redeem' ? 'active' : ''}`}
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(109,40,217,0.1))', border: '1px solid rgba(124,58,237,0.3)', color: '#c4b5fd' }}>
              <span className="text-base">+</span>
              <span className="font-semibold">Receive New Method</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Member</p>
            </div>
          </div>
          <button onClick={() => { logout(); router.push('/auth/login'); }} className="btn-secondary w-full justify-center text-sm py-2">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
