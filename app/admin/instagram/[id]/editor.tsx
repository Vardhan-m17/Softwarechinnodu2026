'use client';
import Link from 'next/link';
import { useState } from 'react';

type Item = { id: string; caption: string; permalink: string | null; status: string; title: string; company: string; location: string; salary: string; description: string; skills: string; external_url: string };
export default function JobImportEditor({ item }: { item: Item }) {
  const [form, setForm] = useState(item); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  function set(field: keyof Item, value: string) { setForm({ ...form, [field]: value }); }
  async function publish() { setBusy(true); const response = await fetch('/api/admin/instagram/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, job: { ...form, skills: form.skills.split(',').map(skill => skill.trim()).filter(Boolean) } }) }); const result = await response.json(); setMessage(response.ok ? `Published successfully. Job ID: ${result.jobId}` : result.error); setBusy(false); }
  async function remove() { if (!confirm('Delete this imported job draft?')) return; setBusy(true); await fetch('/api/admin/instagram/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) }); window.location.href = '/admin/instagram'; }
  return <section className="admin-panel-pro job-detail-editor"><div className="job-detail-editor-head"><div><small>STRUCTURED JOB DRAFT</small><h2>{form.title || 'Untitled job'}</h2></div><span className="status-chip">{form.status}</span></div><div className="job-detail-form">{(['title','company','location','salary','skills','external_url'] as const).map(field => <label key={field}>{field.replace('_', ' ')}<input value={form[field]} onChange={event => set(field, event.target.value)}/></label>)}<label className="wide">description<textarea value={form.description} onChange={event => set('description', event.target.value)}/></label></div><div className="job-detail-actions"><button className="button" onClick={publish} disabled={busy}>Publish job</button><button className="danger-action" onClick={remove} disabled={busy}>Delete</button>{item.permalink && <Link href={item.permalink} target="_blank">View Instagram source ↗</Link>}</div>{message && <p className="admin-empty">{message}</p>}</section>;
}
