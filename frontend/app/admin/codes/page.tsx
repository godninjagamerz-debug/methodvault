'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi, Method, MethodCode } from '@/lib/api';

interface CodeWithMethod extends MethodCode {
  method_name: string;
  method_id: string;
}

export default function AdminCodesPage() {
  const [allCodes, setAllCodes] = useState<CodeWithMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const methods = await adminApi.listMethods();
      const codeArrays = await Promise.all(
        methods.map(async (m: Method) => {
          const codes = await adminApi.listCodes(m.id);
          return codes.map((c: MethodCode) => ({ ...c, method_name: m.name, method_id: m.id }));
        })
      );
      setAllCodes(codeArrays.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    }
    load().catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleRevoke(codeId: string) {
    if (!confirm('Revoke this code?')) return;
    try {
      const updated = await adminApi.revokeCode(codeId);
      setAllCodes(prev => prev.map(c => c.id === codeId ? { ...c, ...updated } : c));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Revoke failed');
    }
  }

  function copyCode(c: CodeWithMethod) {
    navigator.clipboard.writeText(c.code);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const counts = {
    all: allCodes.length,
    unused: allCodes.filter(c => c.status === 'unused').length,
    redeemed: allCodes.filter(c => c.status === 'redeemed').length,
    revoked: allCodes.filter(c => c.status === 'revoked').length,
  };

  const filtered = allCodes
    .filter(c => filterStatus === 'all' || c.status === filterStatus)
    .filter(c => !search || c.code.includes(search.toUpperCase()) || c.method_name.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (status: string) => {
    if (status === 'unused') return <span className="badge badge-green">Unused</span>;
    if (status === 'redeemed') return <span className="badge badge-purple">Redeemed</span>;
    return <span className="badge badge-red">Revoked</span>;
  };

  return (
    <div className="p-8 fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">All Codes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {counts.unused} unused · {counts.redeemed} redeemed · {counts.revoked} revoked
          </p>
        </div>
        <Link href="/admin/methods" className="btn-secondary">Generate Codes →</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: counts.all, color: '#9090aa' },
          { label: 'Unused', value: counts.unused, color: '#4ade80' },
          { label: 'Redeemed', value: counts.redeemed, color: '#a78bfa' },
          { label: 'Revoked', value: counts.revoked, color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-2">
          {(['all', 'unused', 'redeemed', 'revoked'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterStatus === s ? 'bg-purple-600 text-white' : 'btn-secondary'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="input-base ml-auto"
          style={{ maxWidth: '240px' }}
          placeholder="Search code or method…"
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
          <p className="text-lg mb-2">No codes found</p>
          <p style={{ color: 'var(--text-secondary)' }}>
            {allCodes.length === 0 ? 'Generate codes from the Methods page' : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['CODE', 'METHOD', 'STATUS', 'REDEEMED BY', 'CREATED', 'ACTIONS'].map(h => (
                  <th key={h} className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm tracking-wider" style={{ color: c.status === 'unused' ? '#c4b5fd' : 'var(--text-secondary)' }}>
                      {c.code.match(/.{1,6}/g)?.join(' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/methods/${c.method_id}/codes`} className="text-sm hover:text-purple-400 transition-colors">
                      {c.method_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {c.redeemed_by_email || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => copyCode(c)} className="btn-secondary text-xs py-1 px-2.5">
                        {copiedId === c.id ? '✓' : '📋'}
                      </button>
                      {c.status === 'unused' && (
                        <button onClick={() => handleRevoke(c.id)} className="btn-danger text-xs py-1 px-2.5">
                          Revoke
                        </button>
                      )}
                    </div>
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
