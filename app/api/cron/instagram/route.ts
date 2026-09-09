import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { parseJobCaption } from '../../../../lib/instagram/parseJobCaption';

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !userId || !serviceKey) return NextResponse.json({ error: 'Instagram cron environment variables are missing.' }, { status: 503 });
  const params = new URLSearchParams({ fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp', limit: '50', access_token: token });
  const response = await fetch(`https://graph.instagram.com/${userId}/media?${params}`, { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok) return NextResponse.json({ error: payload.error?.message || 'Instagram API request failed.' }, { status: response.status });
  const records = (payload.data ?? []).map((item: Record<string, string>) => ({ instagram_media_id: item.id, caption: item.caption || '', media_type: item.media_type || null, media_url: item.media_url || null, thumbnail_url: item.thumbnail_url || null, permalink: item.permalink || null, posted_at: item.timestamp || null, extracted_data: parseJobCaption(item.caption || ''), status: 'pending' }));
  const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { error } = records.length ? await supabase.from('instagram_job_imports').upsert(records, { onConflict: 'instagram_media_id', ignoreDuplicates: true }) : { error: null };
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ imported: records.length, status: 'pending_review' });
}
