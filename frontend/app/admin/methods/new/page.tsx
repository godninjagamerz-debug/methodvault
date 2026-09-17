import Link from 'next/link';
import MethodForm from '@/components/MethodForm';

export default function NewMethodPage() {
  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <Link href="/admin/methods" className="text-sm inline-flex items-center gap-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
          ← Methods
        </Link>
        <h1 className="text-3xl font-bold mb-1">Upload New Method</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Create and publish a new method</p>
      </div>
      <MethodForm mode="create" />
    </div>
  );
}
