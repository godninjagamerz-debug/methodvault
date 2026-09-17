'use client';
import { useEffect, useState } from 'react';
import { adminApi, User } from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi.listUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    !search || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Users</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{users.length} registered users</p>
        </div>
        <input
          type="text"
          className="input-base"
          style={{ maxWidth: '260px' }}
          placeholder="Search by email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-14 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-lg">{users.length === 0 ? 'No users registered yet' : 'No users match your search'}</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['USER', 'ROLE', 'JOINED', 'ID'].map(h => (
                  <th key={h} className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: u.role === 'admin' ? 'rgba(124,58,237,0.25)' : 'rgba(14,165,233,0.15)', color: u.role === 'admin' ? '#a78bfa' : '#38bdf8' }}>
                        {u.email[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-gray'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(u.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{u.id}</span>
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
