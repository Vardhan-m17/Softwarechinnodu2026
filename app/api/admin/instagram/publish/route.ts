import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const body = await request.json();
  const { id, job } = body;
  const { data: item, error: itemError } = await supabase.from('instagram_job_imports').select('*').eq('id', id).maybeSingle();
  if (itemError || !item) return NextResponse.json({ error: itemError?.message || 'Import not found.' }, { status: 404 });
  const title = job?.title || (item.caption || 'Instagram job opportunity').split('\n').map((line: string) => line.trim()).find(Boolean) || 'Instagram job opportunity';
  const description = `${job?.description || item.caption || 'Imported from Instagram.'}${job?.salary ? `\nSalary/Stipend: ${job.salary}` : ''}`;
  const jobRecord = { title: title.slice(0, 160), company: job?.company || 'Instagram source', location: job?.location || null, salary: job?.salary || null, description, skills: Array.isArray(job?.skills) ? job.skills : typeof job?.skills === 'string' ? job.skills.split(',').map((skill: string) => skill.trim()).filter(Boolean) : [], source: 'Instagram Posts', external_url: job?.external_url || item.permalink };
  let { data: publishedJob, error } = await supabase.from('jobs').insert(jobRecord).select('id').single();
  if (error && /salary|schema cache/i.test(error.message)) {
    const { salary: _salary, ...legacyRecord } = jobRecord;
    const fallback = await supabase.from('jobs').insert(legacyRecord).select('id').single();
    publishedJob = fallback.data; error = fallback.error;
  }
  if (error || !publishedJob) return NextResponse.json({ error: error?.message || 'Could not publish job.' }, { status: 500 });
  await supabase.from('instagram_job_imports').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id);
  return NextResponse.json({ jobId: publishedJob.id });
}
