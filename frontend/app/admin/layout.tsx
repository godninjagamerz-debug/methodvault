'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/admin', label: 'Overview', icon: '⊞', exact: true },
  { href: '/admin/methods', label: 'Methods', icon: '📋' },
  { href: '/admin/codes', label: 'Codes', icon: '🔑' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/purchases', label: 'Purchases', icon: '💳' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
    if (!loading && user?.role !== 'admin') router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border)', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <span className="font-bold">MethodVault</span>
              <div className="text-xs" style={{ color: '#a78bfa' }}>Admin Dashboard</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa' }}>
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs" style={{ color: '#a78bfa' }}>Admin</p>
            </div>
          </div>
          <button onClick={() => { logout(); router.push('/auth/login'); }} className="btn-secondary w-full justify-center text-sm py-2">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
