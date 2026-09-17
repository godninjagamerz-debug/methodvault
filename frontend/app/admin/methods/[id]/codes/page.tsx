'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminApi, Method, MethodCode } from '@/lib/api';

const BATCH_SIZES = [1, 5, 10, 50, 100];

export default function MethodCodesPage({ params }: { params: { id: string } }) {
  const [method, setMethod] = useState<Method | null>(null);
  const [codes, setCodes] = useState<MethodCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [batchSize, setBatchSize] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const [m, c] = await Promise.all([
      adminApi.getMethod(params.id),
      adminApi.listCodes(params.id),
    ]);
    setMethod(m);
    setCodes(c);
  }, [params.id]);

  useEffect(() => {
    refresh().catch(console.error).finally(() => setLoading(false));
  }, [refresh]);

  async function handleGenerate() {
    setError('');
    setGenerating(true);
    try {
      await adminApi.generateCodes(params.id, batchSize);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate codes');
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke(codeId: string) {
    if (!confirm('Revoke this code? It will no longer be redeemable.')) return;
    try {
      const updated = await adminApi.revokeCode(codeId);
      setCodes(prev => prev.map(c => c.id === codeId ? updated : c));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Revoke failed');
    }
  }

  function copyCode(code: MethodCode) {
    navigator.clipboard.writeText(code.code);
    setCopiedId(code.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function copyAllUnused() {
    const unused = codes.filter(c => c.status === 'unused').map(c => c.code);
    await navigator.clipboard.writeText(unused.join('\n'));
  }

  const filtered = filterStatus === 'all' ? codes : codes.filter(c => c.status === filterStatus);
  const counts = {
    all: codes.length,
    unused: codes.filter(c => c.status === 'unused').length,
    redeemed: codes.filter(c => c.status === 'redeemed').length,
    revoked: codes.filter(c => c.status === 'revoked').length,
  };

  const statusBadge = (status: string) => {
    if (status === 'unused') return <span className="badge badge-green">Unused</span>;
    if (status === 'redeemed') return <span className="badge badge-purple">Redeemed</span>;
    return <span className="badge badge-red">Revoked</span>;
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="spinner w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <Link href="/admin/methods" className="text-sm inline-flex items-center gap-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
          ← Methods
        </Link>
        <h1 className="text-3xl font-bold mb-1">Codes — {method?.name}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Generate and manage 24-character unlock codes</p>
      </div>

      {/* Generate */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-4">Generate New Codes</h2>
        {error && (
          <div className="rounded-lg p-3 text-sm mb-4" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Batch size:</span>
          {BATCH_SIZES.map(n => (
            <button
              key={n}
              onClick={() => setBatchSize(n)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${batchSize === n ? 'bg-purple-600 text-white' : 'btn-secondary'}`}
            >
              {n}
            </button>
          ))}
          <button onClick={handleGenerate} disabled={generating} className="btn-primary ml-auto">
            {generating ? (
              <span className="spinner inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : `Generate ${batchSize} Code${batchSize > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2">
          {(['all', 'unused', 'redeemed', 'revoked'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterStatus === s ? 'bg-purple-600 text-white' : 'btn-secondary'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
            </button>
          ))}
        </div>
        {counts.unused > 0 && (
          <button onClick={copyAllUnused} className="btn-secondary text-sm py-1.5 px-3">
            📋 Copy All Unused ({counts.unused})
          </button>
        )}
      </div>

      {/* Codes table */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-lg mb-2">No {filterStatus === 'all' ? '' : filterStatus} codes</p>
          {filterStatus === 'all' && <p style={{ color: 'var(--text-secondary)' }}>Generate codes above to get started</p>}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--text-secondary)' }}>CODE</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--text-secondary)' }}>STATUS</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--text-secondary)' }}>REDEEMED BY</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--text-secondary)' }}>CREATED</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--text-secondary)' }}>ACTIONS</th>
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
                  <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {c.redeemed_by_email || '—'}
                    {c.redeemed_at && <div className="text-xs">{new Date(c.redeemed_at).toLocaleDateString()}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyCode(c)}
                        className="btn-secondary text-xs py-1 px-2.5"
                      >
                        {copiedId === c.id ? '✓ Copied' : '📋 Copy'}
                      </button>
                      {c.status === 'unused' && (
                        <button
                          onClick={() => handleRevoke(c.id)}
                          className="btn-danger text-xs py-1 px-2.5"
                        >
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
