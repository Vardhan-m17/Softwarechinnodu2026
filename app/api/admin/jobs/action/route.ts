import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const allowed = new Set(['approve', 'reject', 'pause', 'resume', 'repost', 'delete']);
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const body = await request.json() as { id?: string; action?: string };
  if (!body.id || !body.action || !allowed.has(body.action)) return NextResponse.json({ error: 'Invalid job action.' }, { status: 400 });
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const writer = serviceKey ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey) : supabase;
  if (body.action === 'delete') {
    const { error } = await writer.from('jobs').delete().eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, action: 'delete' });
  }
  const status = body.action === 'approve' || body.action === 'resume' || body.action === 'repost' ? 'active' : body.action === 'reject' ? 'rejected' : 'paused';
  const { error } = await writer.from('jobs').update({ status, updated_at: new Date().toISOString() }).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, action: body.action, status });
}
