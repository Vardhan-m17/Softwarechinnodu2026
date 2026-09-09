import Link from 'next/link';
import { Shell } from '../../../../components/Shell';
import JobImportEditor from './editor';
import { createClient } from '../../../../lib/supabase/server';

export default async function InstagramImportEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('instagram_job_imports').select('*').eq('id', id).maybeSingle();
  if (!data) return <Shell admin><div className="admin-pro-page"><div className="admin-empty">Import not found. <Link href="/admin/instagram">Back to Instagram imports</Link></div></div></Shell>;
  const extracted = data.extracted_data || {};
  return <Shell admin><div className="admin-pro-page"><header className="admin-hero"><div><span className="admin-eyebrow">JOB DETAILS</span><h1>Edit imported job</h1><p>Review the structured job details before publishing.</p></div><Link className="admin-secondary-action" href="/admin/instagram">← Back to imports</Link></header><JobImportEditor item={{ id: data.id, caption: data.caption || '', permalink: data.permalink, status: data.status, title: extracted.title || (data.caption || '').split('\n')[0] || 'Job opportunity', company: extracted.company || '', location: extracted.location || '', salary: extracted.salary || '', description: extracted.description || data.caption || '', skills: Array.isArray(extracted.skills) ? extracted.skills.join(', ') : extracted.skills || '', external_url: extracted.external_url || data.permalink || '' }}/></div></Shell>;
}
