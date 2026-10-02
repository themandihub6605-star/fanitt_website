import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import {
  Room,
  RoomEvent,
  Track,
  type Participant,
  type RemoteTrack,
  type TrackPublication,
} from 'livekit-client';
import { apiClient, getApiErrorMessage } from '@/services/apiClient';
import type { ApiEnvelope } from '@/types/api';

// Virtual Meet room in the browser (LiveKit) — same room the app joins.
// No Zoom, no passcode. Host starts it; booked people join once it's live.

interface JoinResponse {
  meet: { _id: string; title: string; isLive: boolean };
  connection: { url: string; token: string };
  role: 'host' | 'guest';
}

function initials(name: string) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}

/** One person's video (or their initial when the camera is off). */
function ParticipantTile({ participant, isLocal }: { participant: Participant; isLocal: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const rerender = () => force((n) => n + 1);
    participant.on('trackMuted', rerender);
    participant.on('trackUnmuted', rerender);
    participant.on('trackSubscribed', rerender);
    participant.on('trackUnsubscribed', rerender);
    participant.on('localTrackPublished', rerender);
    participant.on('isSpeakingChanged', rerender);
    return () => {
      participant.off('trackMuted', rerender);
      participant.off('trackUnmuted', rerender);
      participant.off('trackSubscribed', rerender);
      participant.off('trackUnsubscribed', rerender);
      participant.off('localTrackPublished', rerender);
      participant.off('isSpeakingChanged', rerender);
    };
  }, [participant]);

  const camera = participant.getTrackPublication(Track.Source.Camera);
  const mic = participant.getTrackPublication(Track.Source.Microphone);
  const videoTrack = camera && !camera.isMuted ? camera.track : undefined;
  const audioTrack = !isLocal && mic ? mic.track : undefined;

  useEffect(() => {
    const el = videoRef.current;
    if (videoTrack && el) {
      videoTrack.attach(el);
      return () => {
        videoTrack.detach(el);
      };
    }
    return undefined;
  }, [videoTrack]);

  useEffect(() => {
    const el = audioRef.current;
    if (audioTrack && el) {
      audioTrack.attach(el);
      return () => {
        audioTrack.detach(el);
      };
    }
    return undefined;
  }, [audioTrack]);

  const name = isLocal ? 'You' : participant.name || 'Guest';
  const isHost = (participant.metadata || '').includes('"host"');
  const micOff = !mic || mic.isMuted;

  return (
    <div
      className={`relative aspect-video overflow-hidden rounded-2xl bg-[#1B1B26] ring-2 transition ${
        participant.isSpeaking ? 'ring-emerald-500' : 'ring-transparent'
      }`}
    >
      {videoTrack ? (
        <video ref={videoRef} autoPlay playsInline muted={isLocal} className={`h-full w-full object-cover ${isLocal ? '-scale-x-100' : ''}`} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/25 text-3xl font-bold text-white">{initials(name)}</span>
        </div>
      )}
      {audioTrack && <audio ref={audioRef} autoPlay />}
      <span className="absolute bottom-2 left-2 flex max-w-[85%] items-center gap-1 truncate rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white">
        {micOff && <MicOff size={12} />}
        {isHost ? `${name} · Host` : name}
      </span>
    </div>
  );
}

export default function LiveSessionRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const roomRef = useRef<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [title, setTitle] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [status, setStatus] = useState<'connecting' | 'live' | 'ended' | 'error'>('connecting');
  const [error, setError] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const refresh = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    setParticipants([room.localParticipant, ...Array.from(room.remoteParticipants.values())]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    room
      .on(RoomEvent.ParticipantConnected, refresh)
      .on(RoomEvent.ParticipantDisconnected, refresh)
      .on(RoomEvent.TrackSubscribed, (_t: RemoteTrack, _p: TrackPublication) => refresh())
      .on(RoomEvent.TrackUnsubscribed, refresh)
      .on(RoomEvent.LocalTrackPublished, refresh)
      .on(RoomEvent.Disconnected, () => {
        if (!cancelled) setStatus((s) => (s === 'error' ? s : 'ended'));
      });

    (async () => {
      try {
        const res = await apiClient.post<ApiEnvelope<JoinResponse>>(`/store/meets/${id}/join`);
        const data = res.data.data;
        if (cancelled) return;
        setTitle(data.meet.title);
        setIsHost(data.role === 'host');
        await room.connect(data.connection.url, data.connection.token);
        await room.localParticipant.setMicrophoneEnabled(true);
        await room.localParticipant.setCameraEnabled(true).catch(() => setCamOn(false));
        if (cancelled) return;
        refresh();
        setStatus('live');
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      room.disconnect();
      roomRef.current = null;
    };
  }, [id, refresh]);

  const toggleMic = async () => {
    const next = !micOn;
    await roomRef.current?.localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  };

  const toggleCam = async () => {
    const next = !camOn;
    await roomRef.current?.localParticipant.setCameraEnabled(next);
    setCamOn(next);
  };

  const leave = async () => {
    if (isHost && status === 'live' && window.confirm('End the meeting for everyone? Press Cancel to just leave.')) {
      try {
        await apiClient.post(`/store/meets/${id}/end`);
      } catch {
        // Leaving still works.
      }
    }
    roomRef.current?.disconnect();
    navigate(-1);
  };

  const cols = participants.length <= 1 ? 'grid-cols-1' : participants.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 lg:grid-cols-3';

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0B12] text-white">
      <header className="flex items-center gap-3 px-4 py-3">
        <button onClick={leave} className="rounded-lg p-2 hover:bg-white/10" aria-label="Leave">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <p className="truncate font-semibold">{title || 'Virtual Meet'}</p>
          <p className="text-xs text-white/60">{status === 'live' ? `${participants.length} in the meeting` : ' '}</p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-3 pb-3">
        {status === 'connecting' && (
          <div className="flex flex-col items-center gap-3 text-white/70">
            <Loader2 className="animate-spin" size={32} />
            <p>Joining the meeting…</p>
          </div>
        )}
        {(status === 'error' || status === 'ended') && (
          <div className="flex max-w-sm flex-col items-center gap-4 text-center">
            <AlertCircle size={40} className="text-white/50" />
            <p>{status === 'ended' ? 'This meeting has ended.' : error}</p>
            <button onClick={() => navigate(-1)} className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold hover:bg-white/20">
              Go back
            </button>
          </div>
        )}
        {status === 'live' && (
          <div className={`grid w-full max-w-6xl gap-3 ${cols}`}>
            {participants.map((p) => (
              <ParticipantTile key={p.identity} participant={p} isLocal={p === roomRef.current?.localParticipant} />
            ))}
          </div>
        )}
      </main>

      {status === 'live' && (
        <footer className="flex items-center justify-center gap-4 pb-6">
          <button onClick={toggleMic} className={`rounded-full p-4 ${micOn ? 'bg-white/15 hover:bg-white/25' : 'bg-rose-600'}`} aria-label={micOn ? 'Mute' : 'Unmute'}>
            {micOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          <button onClick={toggleCam} className={`rounded-full p-4 ${camOn ? 'bg-white/15 hover:bg-white/25' : 'bg-rose-600'}`} aria-label={camOn ? 'Stop video' : 'Start video'}>
            {camOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
          <button onClick={leave} className="rounded-full bg-rose-600 p-4 hover:bg-rose-700" aria-label="Leave">
            <PhoneOff size={22} />
          </button>
        </footer>
      )}
    </div>
  );
}