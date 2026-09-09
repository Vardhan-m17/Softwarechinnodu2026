import { Shell } from '../../../components/Shell';
import { createClient } from '../../../lib/supabase/server';
import InstagramReview from './review';

export default async function AdminInstagramPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('instagram_job_imports').select('id, caption, permalink, media_type, media_url, thumbnail_url, posted_at, status, created_at').order('created_at', { ascending: false }).limit(50);
  return <Shell admin><div className="admin-pro-page"><header className="admin-hero"><div><span className="admin-eyebrow">INSTAGRAM IMPORTS</span><h1>Instagram Job Posts</h1><p>Import posts privately, review them, then publish approved jobs.</p></div></header><InstagramReview initialItems={data ?? []}/></div></Shell>;
}
