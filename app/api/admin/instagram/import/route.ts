import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { parseJobCaption } from '../../../../../lib/instagram/parseJobCaption';

export async function POST() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!token || !userId || token === 'replace_with_meta_access_token') return NextResponse.json({ error: 'Instagram credentials are not configured.' }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const params = new URLSearchParams({ fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp', limit: '50', access_token: token });
  const response = await fetch(`https://graph.instagram.com/${userId}/media?${params}`, { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok) return NextResponse.json({ error: payload.error?.message || 'Instagram API request failed.' }, { status: response.status });
  const records = (payload.data ?? []).map((item: Record<string, string>) => ({ instagram_media_id: item.id, caption: item.caption || '', media_type: item.media_type || null, media_url: item.media_url || null, thumbnail_url: item.thumbnail_url || null, permalink: item.permalink || null, posted_at: item.timestamp || null, extracted_data: parseJobCaption(item.caption || '') }));
  const { error } = records.length ? await supabase.from('instagram_job_imports').upsert(records, { onConflict: 'instagram_media_id', ignoreDuplicates: true }) : { error: null };
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ imported: records.length, status: 'pending_review' });
}
