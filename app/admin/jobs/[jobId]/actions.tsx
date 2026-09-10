'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function JobLifecycleActions({ jobId }: { jobId: string }) { const router = useRouter(); const [busy, setBusy] = useState(false); async function act(action: string) { if (action === 'delete' && !confirm('Are you sure you want to delete this job?')) return; setBusy(true); const response = await fetch('/api/admin/jobs/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: jobId, action }) }); const result = await response.json(); if (!response.ok) alert(result.error || 'Action failed'); else if (action === 'delete') router.push('/admin/jobs'); else router.refresh(); setBusy(false); } return <div className="job-details-actions"><button disabled={busy} onClick={() => act('pause')}>Pause</button><button className="danger-action" disabled={busy} onClick={() => act('delete')}>Delete</button></div>; }
