import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function adminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function importMedia(mediaId: string) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Instagram webhook credentials are not configured.');
  const params = new URLSearchParams({ fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp', access_token: token });
  const response = await fetch(`https://graph.instagram.com/${mediaId}?${params}`, { cache: 'no-store' });
  const media = await response.json();
  if (!response.ok) throw new Error(media.error?.message || 'Could not fetch Instagram media.');
  const { error } = await adminClient().from('instagram_job_imports').upsert({ instagram_media_id: media.id, caption: media.caption || '', media_type: media.media_type || null, media_url: media.media_url || null, thumbnail_url: media.thumbnail_url || null, permalink: media.permalink || null, posted_at: media.timestamp || null, extracted_data: {}, status: 'pending' }, { onConflict: 'instagram_media_id', ignoreDuplicates: true });
  if (error) throw error;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('hub.verify_token') !== process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) return new NextResponse('Forbidden', { status: 403 });
  return new NextResponse(url.searchParams.get('hub.challenge') || '', { status: 200 });
}

export async function POST(request: Request) {
  const payload = await request.json();
  if (payload.object !== 'instagram') return NextResponse.json({ received: true });
  for (const entry of payload.entry || []) for (const change of entry.changes || []) {
    const mediaId = change.value?.media_id || change.value?.id;
    if (mediaId && change.field === 'media') await importMedia(mediaId);
  }
  return NextResponse.json({ received: true });
}
