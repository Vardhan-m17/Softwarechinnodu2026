'use client';

import { useEffect, useRef, useState } from 'react';
import { Shell } from '../../components/Shell';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

type Mode = 'random' | 'opposite' | 'partner';

export default function VoiceTalkZone() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('random');
  const [gender, setGender] = useState('Select Gender');
  const [partnerCode, setPartnerCode] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());
  const [partnerAction, setPartnerAction] = useState<'create' | 'join'>('create');
  const [busy, setBusy] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [genderPromptOpen, setGenderPromptOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<Mode>('random');
  const [message, setMessage] = useState('');
  const [counts, setCounts] = useState({ male: 196, female: 75 });
  const sessionId = useRef<string | null>(null);
  const sharedCounts = useRef({ male: 200, female: 75 });
  const connectingMusic = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const refreshCounts = async () => { const { data } = await supabase.rpc('get_voice_counts'); const row = Array.isArray(data) ? data[0] : data; if (row) { sharedCounts.current = { male: Number(row.male) || 200, female: Number(row.female) || 75 }; } };
    void refreshCounts();
    const sharedTicker = window.setInterval(() => { const step = Math.floor(Date.now() / 4000); const variation = ((step * 17) % 9) - 4; setCounts({ male: Math.max(1, sharedCounts.current.male + variation), female: Math.max(1, sharedCounts.current.female + (((step * 11) % 7) - 3)) }); }, 4000);
    const channel = supabase.channel('voice-talk-zone-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_presence' }, refreshCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_practice_sessions' }, refreshCounts)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'voice_practice_sessions' }, payload => {
        if (payload.new.id === sessionId.current && payload.new.status === 'matched') {
          connectingMusic.current?.pause();
          if (connectingMusic.current) connectingMusic.current.currentTime = 0;
          setMessage('Your partner is ready. Microphone access will be requested next.');
          setBusy(false);
        }
      }).subscribe();
    return () => { window.clearInterval(sharedTicker); connectingMusic.current?.pause(); supabase.removeChannel(channel); };
  }, []);
  useEffect(() => {
    const opposite = document.querySelector('.mode-grid button.opposite');
    if (!opposite) return;
    const openPremium = (event: Event) => { event.stopImmediatePropagation(); void startTalking('opposite'); };
    opposite.addEventListener('click', openPremium, true);
    return () => opposite.removeEventListener('click', openPremium, true);
  });
  useEffect(() => {
    const subscribe = document.querySelector('.premium-subscribe');
    if (!subscribe) return;
    const openPayment = (event: Event) => {
      event.preventDefault(); event.stopImmediatePropagation();
      if (document.querySelector('.payment-contact-overlay')) return;
      const overlay = document.createElement('div'); overlay.className = 'payment-contact-overlay';
      overlay.innerHTML = '<section class="payment-contact-card"><button class="payment-close">×</button><h2>Contact details</h2><p>Enter mobile &amp; email to continue</p><input class="payment-mobile" type="tel" placeholder="🇮🇳 +91  Mobile number"><small class="payment-error"></small><input type="email" value="" placeholder="Email address"><button class="payment-continue">Continue</button></section>';
      document.body.appendChild(overlay);
      overlay.querySelector('.payment-close')?.addEventListener('click', () => overlay.remove());
      overlay.querySelector('.payment-continue')?.addEventListener('click', () => { const mobile = overlay.querySelector('.payment-mobile') as HTMLInputElement; const error = overlay.querySelector('.payment-error') as HTMLElement; if (!mobile.value.trim()) { error.textContent = 'ⓘ Please enter your mobile number'; mobile.focus(); return; } error.textContent = ''; });
    };
    subscribe.addEventListener('click', openPayment, true);
    return () => subscribe.removeEventListener('click', openPayment, true);
  });
  useEffect(() => {
    const row = document.querySelector('.code-row');
    if (!row || row.querySelector('.copy-code-button')) return;
    const copy = document.createElement('button');
    copy.type = 'button'; copy.className = 'copy-code-button'; copy.setAttribute('aria-label', 'Copy partner code'); copy.textContent = '⧉';
    copy.addEventListener('click', async () => { await copyPartnerCode(); copy.textContent = '✓'; window.setTimeout(() => { copy.textContent = '⧉'; }, 1500); });
    row.appendChild(copy);
    const createTab = document.querySelector('.partner-tabs button:first-child');
    const keepCode = (event: Event) => { event.stopImmediatePropagation(); setPartnerAction('create'); };
    createTab?.addEventListener('click', keepCode, true);
    return () => { copy.remove(); createTab?.removeEventListener('click', keepCode, true); };
  }, []);

  async function startTalking(requestedMode: Mode = mode) {
    setMode(requestedMode);
    if (requestedMode === 'opposite') { setPremiumOpen(true); return; }
    if (gender === 'Select Gender') { setPendingMode(requestedMode); setGenderPromptOpen(true); return; }
    if (requestedMode === 'partner' && partnerAction === 'join' && !partnerCode.trim()) { setMessage('Enter a partner code to join a private call.'); return; }
    setBusy(true); setMessage('');
    if (!connectingMusic.current) connectingMusic.current = new Audio('/magpiemusic-corporate-inspiration-ambient-535044.mp3');
    connectingMusic.current.loop = true;
    connectingMusic.current.currentTime = 0;
    void connectingMusic.current.play().catch(() => setMessage('Connecting…'));
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('voice_presence').upsert({ user_id: user.id, gender: gender === 'Select Gender' ? null : gender.toLowerCase(), is_available: true, updated_at: new Date().toISOString() });
    const { data, error: sessionError } = await supabase.from('voice_practice_sessions').insert({ user_id: user?.id ?? null, mode: requestedMode, preferred_gender: gender === 'Select Gender' ? null : gender.toLowerCase(), partner_code: requestedMode === 'partner' ? partnerCode.trim().toUpperCase() || null : null, status: 'waiting' }).select('id').single();
    if (sessionError || !data?.id) {
      setBusy(false);
      setMessage(`Could not create a call session: ${sessionError?.message || 'unknown database error'}`);
      return;
    }
    sessionId.current = data?.id ?? null;
    if (data?.id) await supabase.rpc('match_voice_partner', { p_session_id: data.id });
    // Guests may be blocked by Supabase RLS, but they can still use the call UI.
    const callUrl = data?.id
      ? `/voice-talk-zone/call?session=${encodeURIComponent(data.id)}`
      : '/voice-talk-zone/call';
    router.push(callUrl);
    setBusy(false);
  }

  function createCode() { setPartnerAction('create'); setPartnerCode(Math.random().toString(36).slice(2, 8).toUpperCase()); }
  function selectCreateCode() { setPartnerAction('create'); }
  async function copyPartnerCode() { await navigator.clipboard.writeText(partnerCode); setMessage('Partner code copied.'); }
  function selectJoinCode() { setPartnerAction('join'); setPartnerCode(''); setMessage('Enter your partner code to join a private call.'); }

  if (genderPromptOpen) return <Shell publicMode><div className="gender-choice-page"><section className="gender-prompt-card"><h2>Select your gender</h2><p>This helps us find the right practice partner.</p><label><input type="radio" name="gender" value="Male" onChange={event => setGender(event.target.value)} /> Male</label><label><input type="radio" name="gender" value="Female" onChange={event => setGender(event.target.value)} /> Female</label><label><input type="radio" name="gender" value="Other" onChange={event => setGender(event.target.value)} /> Other</label><button className="gender-continue" disabled={gender === 'Select Gender'} onClick={() => { setGenderPromptOpen(false); void startTalking(pendingMode); }}>Continue</button><button className="gender-cancel" onClick={() => setGenderPromptOpen(false)}>Cancel</button></section></div></Shell>;

  return <Shell publicMode><div className="voice-page"><header className="voice-brand"><div><span className="voice-logo">♪</span><strong>SoftwareChinnodu</strong><small>Talk Zone — Practice Now</small></div><button className="gender-button" onClick={() => setGender(gender === 'Select Gender' ? 'Male' : 'Select Gender')}>⚥　{gender}</button></header><div className="voice-layout"><main><section className="voice-card voice-start"><div className="voice-tabs"><button className="selected">💡 TALK ZONE</button><button onClick={() => setMode('random')}>🎲 Random Mode</button></div><div className="ready-panel"><div className="presence"><span>●　{counts.male}+ <b>Male</b></span><span>●　{counts.female}+ <b>Female</b></span></div><h2>Ready to Practice 🎙️</h2><p>Tap “Start Talking” to connect with someone</p></div><button className="voice-primary" onClick={() => startTalking('random')} disabled={busy}>☎　{busy ? 'Connecting…' : 'Start Talking'}</button>{message && <p className="voice-message">{message}</p>}</section><section className="voice-card partner-card"><div className="partner-heading">♧ <span><b>Partner Practice</b><small>Unlimited 1:1 practice with your own partner — private, nothing saved</small></span></div><div className="partner-tabs"><button type="button" onClick={createCode} className={partnerAction === 'create' ? 'active' : ''}>Create Code</button><button type="button" onClick={selectJoinCode} className={partnerAction === 'join' ? 'active' : ''}>Join Code</button></div><div className="code-row"><input value={partnerCode} onChange={e => setPartnerCode(e.target.value)} placeholder="Enter partner code"/><button onClick={createCode}>🎲</button></div><button className="voice-primary" onClick={() => startTalking('partner')} disabled={busy}>⚿　Start Talking</button></section><section className="voice-card mode-card"><h3>Choose Your Practice Mode</h3><div className="mode-grid"><button className={mode === 'random' ? 'active' : ''} onClick={() => setMode('random')}>🎲<b>Random Match</b><small>Anyone online</small></button><button className={mode === 'opposite' ? 'active opposite' : ''} onClick={() => setMode('opposite')}>⚡<b>Opposite Gender</b><small>Male ↔ Female</small></button></div></section><section className="voice-card info-card"><span>💡 HOW IT WORKS</span><h2>Confidence comes from real practice, not theory</h2><p>Every call connects you with a real person — no scripts, no judgement. The more you practice, the more natural your English becomes in interviews and at work.</p><div className="steps"><b>🎯<small>Select a mode</small></b><i>→</i><b>🎙️<small>Get matched instantly</small></b><i>→</i><b>🚀<small>Build fluency fast</small></b></div></section><section className="voice-card about-voice"><span>💡 TALK ZONE</span><h2>Practice English &amp; build real confidence</h2><p>Connect with real people, practice conversations, and get interview-ready through live voice calls — completely free. No scripts, no recordings, just real practice.</p><div><b>♧ Real People Only</b><b>♙ Voice Only — Safe</b><b>♨ 100% Free</b></div></section></main><aside className="voice-tip"><b>Practice tip</b><p>Try to speak for at least 5 minutes per call without stopping. The more you push through awkward silences, the faster your fluency builds.</p></aside></div></div>{premiumOpen && <div className="premium-overlay" role="dialog" aria-modal="true"><section className="premium-modal"><button className="premium-close" aria-label="Close" onClick={() => setPremiumOpen(false)}>×</button><header><strong>Premium Feature</strong><small>English Practice - Opposite Gender</small></header><div className="premium-body"><span className="premium-lightning">⚡</span><div className="premium-price"><b>₹99</b><span>/ month</span></div><del>₹399</del><div className="premium-fields"><input type="email" placeholder="Your Email" aria-label="Your Email"/><input type="tel" placeholder="Phone (optional)" aria-label="Phone (optional)"/></div><button className="premium-subscribe" onClick={() => setMessage('Subscription checkout will open here.')}>Subscribe Now - ₹99</button><button className="premium-restore" onClick={() => setMessage('No previous purchase was found.')}>Already subscribed? Restore purchase</button></div></section></div>}</Shell>;
}








