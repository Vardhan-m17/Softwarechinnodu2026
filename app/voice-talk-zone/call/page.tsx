'use client';
import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

function VoiceCallPageContent() {
  const session = useSearchParams().get('session');
  const router = useRouter();
  const [connected, setConnected] = useState(false); const [muted, setMuted] = useState(false); const [micActive, setMicActive] = useState(false); const [speaker, setSpeaker] = useState(true); const [held, setHeld] = useState(false); const [error, setError] = useState(''); const [seconds, setSeconds] = useState(0);
  const stream = useRef<MediaStream | null>(null); const peer = useRef<RTCPeerConnection | null>(null); const signal = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null); const remoteAudio = useRef<HTMLAudioElement | null>(null); const music = useRef<HTMLAudioElement | null>(null);
  const routeChecked = useRef(false);
  useEffect(() => {
    if (!session || routeChecked.current) return;
    routeChecked.current = true;
    const key = `voice-call-open:${session}`;
    if (sessionStorage.getItem(key) === '1') {
      sessionStorage.removeItem(key);
      router.replace('/voice-talk-zone');
      return;
    }
    sessionStorage.setItem(key, '1');
  }, [session, router]);
  useEffect(() => {
    if (!session) return; const supabase = createClient(); let stopped = false; const connectingMusic = new Audio('/magpiemusic-corporate-inspiration-ambient-535044.mp3'); connectingMusic.loop = true; connectingMusic.volume = 0.45; music.current = connectingMusic; void connectingMusic.play().catch(() => undefined);
    const startRtc = async (partner: string) => { if (stopped || peer.current || partner === session) return; try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true }); const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }); const pendingCandidates: RTCIceCandidateInit[] = []; peer.current = pc; stream.current.getTracks().forEach(track => pc.addTrack(track, stream.current!));
      pc.ontrack = event => { if (remoteAudio.current) { remoteAudio.current.srcObject = event.streams[0]; void remoteAudio.current.play().catch(() => undefined); } };
      const room = supabase.channel(`voice-webrtc-${[session, partner].sort().join('-')}`); signal.current = room;
      room.on('broadcast', { event: 'signal' }, ({ payload }) => { if (payload.from === session || payload.type !== 'hangup') return; pc.close(); peer.current = null; void supabase.rpc('requeue_voice_session', { p_session_id: session }); setConnected(false); setHeld(false); setError(''); stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; void connectingMusic.play().catch(() => undefined); });
      room.on('broadcast', { event: 'signal' }, async ({ payload }) => { if (payload.from === session) return; if (payload.type === 'hangup') { pc.close(); setConnected(false); setHeld(false); setError(''); void connectingMusic.play().catch(() => undefined); return; } if (payload.type === 'hold') { setHeld(payload.value); if (music.current) { if (payload.value) void music.current.play().catch(() => undefined); else music.current.pause(); } return; } if (payload.type === 'offer') { if (pc.signalingState !== 'stable') return; await pc.setRemoteDescription(payload.description); for (const candidate of pendingCandidates.splice(0)) await pc.addIceCandidate(candidate); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); await room.send({ type: 'broadcast', event: 'signal', payload: { type: 'answer', from: session, description: answer } }); } else if (payload.type === 'answer') { if (pc.signalingState === 'have-local-offer') { await pc.setRemoteDescription(payload.description); for (const candidate of pendingCandidates.splice(0)) await pc.addIceCandidate(candidate); } } else if (payload.type === 'candidate' && payload.candidate) { if (pc.remoteDescription) await pc.addIceCandidate(payload.candidate); else pendingCandidates.push(payload.candidate); } }).subscribe(async status => { if (status === 'SUBSCRIBED' && session > partner) { const offer = await pc.createOffer(); await pc.setLocalDescription(offer); const sendOffer = () => void room.send({ type: 'broadcast', event: 'signal', payload: { type: 'offer', from: session, description: pc.localDescription } }); sendOffer(); window.setTimeout(sendOffer, 1000); window.setTimeout(sendOffer, 3000); window.setTimeout(sendOffer, 6000); } });
      pc.onicecandidate = event => { if (event.candidate) void room.send({ type: 'broadcast', event: 'signal', payload: { type: 'candidate', from: session, candidate: event.candidate } }); };
      pc.onconnectionstatechange = () => { if (pc.connectionState === 'connected') { connectingMusic.pause(); setConnected(true); } if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) { void supabase.rpc('requeue_voice_session', { p_session_id: session }); setConnected(false); setHeld(false); setError(''); stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; peer.current = null; void connectingMusic.play().catch(() => undefined); } };
    } catch { setError('Microphone permission is required for a live call.'); } };
    const poll = async () => { const { error: rpcError } = await supabase.rpc('match_voice_partner', { p_session_id: session }); if (rpcError) { setError('Run the latest voice SQL migration in Supabase.'); return; } const { data } = await supabase.rpc('get_voice_session_details', { p_session_id: session }); const row = Array.isArray(data) ? data[0] : data; if (row?.status === 'matched') { let partner = row.partner_session_id; if (!partner) { const { data: matches } = await supabase.from('voice_practice_sessions').select('id').eq('status', 'matched').neq('id', session).order('started_at', { ascending: false }).limit(1); partner = matches?.[0]?.id; } if (partner) await startRtc(partner); } };
    void poll(); const timer = window.setInterval(() => void poll(), 2000); const closeSession = () => { void supabase.rpc('cancel_voice_session', { p_session_id: session }); }; window.addEventListener('pagehide', closeSession); return () => { stopped = true; window.clearInterval(timer); closeSession(); window.removeEventListener('pagehide', closeSession); connectingMusic.pause(); connectingMusic.currentTime = 0; stream.current?.getTracks().forEach(track => track.stop()); peer.current?.close(); if (signal.current) void supabase.removeChannel(signal.current); music.current = null; };
  }, [session, router]);
  useEffect(() => { if (!connected) return; const timer = window.setInterval(() => setSeconds(value => value + 1), 1000); return () => window.clearInterval(timer); }, [connected]);
  useEffect(() => { const timer = window.setInterval(() => { const track = stream.current?.getAudioTracks()[0]; setMicActive(Boolean(track && track.readyState === 'live' && track.enabled && !muted)); }, 250); return () => window.clearInterval(timer); }, [muted]);
  async function toggleMute() { if (!stream.current) { try { stream.current = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { setError('Allow microphone access in the browser.'); return; } } const next = !muted; stream.current.getAudioTracks().forEach(track => { track.enabled = !next; }); setMuted(next); }
  function toggleSpeaker() { const next = !speaker; if (remoteAudio.current) remoteAudio.current.volume = next ? 1 : 0; setSpeaker(next); }
  function hangUp() { if (signal.current && session) void signal.current.send({ type: 'broadcast', event: 'signal', payload: { type: 'hangup', from: session } }); stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; peer.current?.close(); peer.current = null; if (remoteAudio.current) remoteAudio.current.srcObject = null; setMicActive(false); setConnected(false); }
  function toggleHold() { const next = !held; setHeld(next); if (music.current) { if (next) void music.current.play().catch(() => undefined); else music.current.pause(); } if (signal.current && session) void signal.current.send({ type: 'broadcast', event: 'signal', payload: { type: 'hold', from: session, value: next } }); }
  const elapsed = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <main className="voice-call-page"><audio ref={remoteAudio} autoPlay /><section className="voice-call-card connected-call"><div className="call-controls"><button className={micActive ? 'mic-active' : ''} onClick={toggleMute} aria-label="Mute microphone">{muted ? '🔇' : '🎙️'}</button><button onClick={toggleSpeaker} aria-label="Toggle speaker">{speaker ? '🔊' : '🔇'}</button><button className="call-play" disabled={!connected} aria-label={held ? 'Resume call' : 'Hold call'} onClick={toggleHold}>{held ? '▶' : '⏸'}</button><Link href="/voice-talk-zone" className="call-end" aria-label="End call" onClick={hangUp}>☎</Link></div>{connected ? <div className="connected-status"><strong>{held ? 'Call on hold' : 'Live call connected'}</strong><b>{elapsed}</b></div> : <div className="searching-call-status"><strong>{error || 'Connecting...'}</strong><small>Waiting for another participant...</small></div>}<div className="practice-panel"><strong>{held ? 'Hold music playing' : 'Live voice call'}</strong><small>{held ? 'Your partner is temporarily on hold.' : 'Your microphone is connected directly to the other participant.'}</small></div><Link href="/voice-talk-zone" className="voice-call-cancel" onClick={hangUp}>End call and go back</Link></section></main>;
}

export default function VoiceCallPage() {
  return <Suspense fallback={<main className="voice-call-loading">Loading voice call…</main>}><VoiceCallPageContent /></Suspense>;
}
