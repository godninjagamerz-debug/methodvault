'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, Method } from '@/lib/api';

interface MethodFormProps {
  initial?: Partial<Method>;
  methodId?: string;
  mode: 'create' | 'edit';
}

export default function MethodForm({ initial = {}, methodId, mode }: MethodFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState(initial.name || '');
  const [description, setDescription] = useState(initial.description || '');
  const [category, setCategory] = useState(initial.category || '');
  const [priceRupees, setPriceRupees] = useState(initial.price !== undefined ? String(initial.price / 100) : '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initial.thumbnail_url || '');
  const [content, setContent] = useState(initial.content || '');
  const [published, setPublished] = useState(initial.published ?? false);
  const [marketplaceListed, setMarketplaceListed] = useState(initial.marketplace_listed ?? false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const priceNum = parseFloat(priceRupees);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Price must be a valid non-negative number');
      return;
    }
    const priceInPaise = Math.round(priceNum * 100);

    const payload: Partial<Method> = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price: priceInPaise,
      thumbnail_url: thumbnailUrl.trim() || undefined,
      content: content.trim(),
      published,
      marketplace_listed: marketplaceListed,
    };

    setLoading(true);
    try {
      if (mode === 'create') {
        const created = await adminApi.createMethod(payload);
        router.push(`/admin/methods/${created.id}/edit?created=1`);
      } else {
        await adminApi.updateMethod(methodId!, payload);
        setSuccess('Method updated successfully');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
          {success}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title *</label>
          <input type="text" className="input-base" placeholder="Method name" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Category</label>
          <input type="text" className="input-base" placeholder="e.g. Marketing, Sales, Growth" value={category} onChange={e => setCategory(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Price (₹)</label>
          <input type="number" className="input-base" placeholder="499.00" min="0" step="0.01" value={priceRupees} onChange={e => setPriceRupees(e.target.value)} required />
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Stored as {priceRupees ? Math.round(parseFloat(priceRupees) * 100) : 0} paise
          </p>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
          <textarea className="input-base" rows={3} placeholder="Brief description shown in listings and marketplace" value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Thumbnail URL</label>
          <input type="url" className="input-base" placeholder="https://..." value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} />
          {thumbnailUrl && (
            <img src={thumbnailUrl} alt="thumbnail preview" className="mt-2 h-32 w-auto rounded-lg object-cover"
              onError={e => { e.currentTarget.style.display = 'none'; }} />
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Full Method Content
            <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>
              (HTML supported — only shown to users who own this method)
            </span>
          </label>
          <textarea
            className="input-base font-mono text-sm"
            rows={16}
            placeholder="Write the full method content here. HTML is supported for formatting."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {content.length.toLocaleString()} characters
          </p>
        </div>
      </div>

      {/* Toggles */}
      <div className="card space-y-4">
        <h3 className="font-medium">Visibility Settings</h3>

        <label className="flex items-center justify-between cursor-pointer group">
          <div>
            <div className="font-medium">Published</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              When enabled, this method is visible to users who own it
            </div>
          </div>
          <div
            onClick={() => setPublished(!published)}
            className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
            style={{ background: published ? '#7c3aed' : 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
          >
            <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all"
              style={{ left: published ? '28px' : '4px' }} />
          </div>
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="font-medium">List in Marketplace</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              When enabled, this method appears in the public marketplace for purchase
            </div>
          </div>
          <div
            onClick={() => setMarketplaceListed(!marketplaceListed)}
            className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
            style={{ background: marketplaceListed ? '#7c3aed' : 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
          >
            <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all"
              style={{ left: marketplaceListed ? '28px' : '4px' }} />
          </div>
        </label>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary px-8 py-2.5" disabled={loading}>
          {loading ? (
            <span className="spinner inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : mode === 'create' ? 'Create Method' : 'Save Changes'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.push('/admin/methods')}>
          Cancel
        </button>
      </div>
    </form>
  );
}
