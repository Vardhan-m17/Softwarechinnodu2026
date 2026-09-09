import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const { id } = await request.json();
  const { data: item, error: itemError } = await supabase.from('instagram_job_imports').select('*').eq('id', id).maybeSingle();
  if (itemError || !item) return NextResponse.json({ error: itemError?.message || 'Import not found.' }, { status: 404 });
  const title = (item.caption || 'Instagram job opportunity').split('\n').map((line: string) => line.trim()).find(Boolean) || 'Instagram job opportunity';
  const { data: job, error } = await supabase.from('jobs').insert({ title: title.slice(0, 160), company: 'Instagram post', description: item.caption || 'Imported from Instagram.', source: 'Instagram Posts', external_url: item.permalink, skills: [] }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from('instagram_job_imports').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id);
  return NextResponse.json({ jobId: job.id });
}
