import { Shell } from '../../../components/Shell';
import { createClient } from '../../../lib/supabase/server';
import InstagramReview from './review';
import { parseJobCaption } from '../../../lib/instagram/parseJobCaption';

export default async function AdminInstagramPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('instagram_job_imports').select('id, caption, permalink, media_type, media_url, thumbnail_url, posted_at, status, created_at, extracted_data').order('created_at', { ascending: false }).limit(50);
  const items = (data ?? []).map(item => {
    const parsed = parseJobCaption(item.caption || '');
    const stored = (item.extracted_data || {}) as Record<string, unknown>;
    const storedTitle = typeof stored.title === 'string' ? stored.title : '';
    const storedCompany = typeof stored.company === 'string' ? stored.company : '';
    const headline = (item.caption || '').split(/\r?\n/).map((line: string) => line.replace(/[^\p{L}\d| ]/gu, ' ').replace(/\s+/g, ' ').trim()).find(Boolean) || '';
    const inferredCompany = headline.match(/^(.+?)\s+is hiring\b/i)?.[1]?.trim() || headline.match(/^(.+?)\s+hiring\b/i)?.[1]?.trim() || '';
    return { ...item, extracted_data: { ...stored, ...parsed, title: parsed.title || storedTitle || 'Job opportunity', company: parsed.company || storedCompany || inferredCompany, location: parsed.location || (typeof stored.location === 'string' ? stored.location : '') } };
  });
  return <Shell admin><div className="admin-pro-page"><header className="admin-hero"><div><span className="admin-eyebrow">INSTAGRAM IMPORTS</span><h1>Instagram Job Posts</h1><p>Import posts privately, review them, then publish approved jobs.</p></div></header><InstagramReview initialItems={items}/></div></Shell>;
}
