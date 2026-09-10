import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shell } from '../../../../../components/Shell';
import { createClient } from '../../../../../lib/supabase/server';
import EditJobForm from './form';

export default async function EditJobPage({ params }: { params: Promise<{ jobId: string }> }) { const { jobId } = await params; const supabase = await createClient(); const { data: job } = await supabase.from('jobs').select('id,title,company,location,description,skills').eq('id', jobId).maybeSingle(); if (!job) notFound(); return <Shell admin><div className="admin-pro-page job-create-page"><header className="admin-hero"><div><span className="admin-eyebrow">JOBS MANAGEMENT</span><h1>Edit Job</h1><p>Update the details below and save your changes.</p></div><Link className="admin-secondary-action" href={`/admin/jobs/${job.id}`}>Cancel</Link></header><EditJobForm job={job}/></div></Shell>; }
