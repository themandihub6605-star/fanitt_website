import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { sessionApi, type ApiSession } from '@/services/sessionApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';

export default function LiveSessionRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const [session, setSession] = useState<ApiSession | null>(null);
  const [status, setStatus] = useState<'loading' | 'joining' | 'in-meeting' | 'error'>('loading');
  const [error, setError] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (!id || startedRef.current) return;
    startedRef.current = true;

    async function loadAndJoin() {
      try {
        console.log('[live-session] step 1: fetching session', id);
        const sessionData = await sessionApi.getById(id!);
        setSession(sessionData);
        console.log('[live-session] session fetched', sessionData);

        const isHost = sessionData.creator.user._id === user?._id;

        if (!sessionData.isLive && isHost) {
          console.log('[live-session] step 2: going live');
          await sessionApi.goLive(id!);
        } else if (!sessionData.isLive && !isHost) {
          setError('This session has not started yet. Please check back at the scheduled time.');
          setStatus('error');
          return;
        }

        console.log('[live-session] step 3: fetching join token');
        const { signature, meetingNumber, sdkKey, password } = await sessionApi.getJoinToken(id!);
        console.log('[live-session] join token received', { meetingNumber, sdkKey, hasPassword: Boolean(password) });

        setStatus('joining');

        console.log('[live-session] step 4: loading Zoom SDK module');

        if (!(window as unknown as { _?: unknown })._) {
          const lodashModule = await import('lodash');
          (window as unknown as { _?: unknown })._ = lodashModule.default;
          console.log('[live-session] lodash attached to window._');
        }

        const { ZoomMtg } = await import('@zoom/meetingsdk');
        console.log('[live-session] Zoom SDK module loaded', ZoomMtg);

        console.log('[live-session] step 5: setZoomJSLib / preLoadWasm / prepareWebSDK');
        ZoomMtg.setZoomJSLib('https://source.zoom.us/3.9.0/lib', '/av');
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();
        console.log('[live-session] SDK prepared, calling init');

        ZoomMtg.init({
          leaveUrl: window.location.origin + '/',
          patchJsMedia: true,
          success: (initSuccess: unknown) => {
            console.log('[live-session] init success', initSuccess);
            ZoomMtg.join({
              signature,
              sdkKey,
              meetingNumber,
              passWord: password,
              userName: user?.name || 'Guest',
              userEmail: user?.email || '',
              success: (joinSuccess: unknown) => {
                console.log('[live-session] join success', joinSuccess);
                setStatus('in-meeting');
              },
              error: (err: unknown) => {
                console.error('[live-session] JOIN FAILED — full error object below:', err);
                setError(`Failed to join: ${JSON.stringify(err)}`);
                setStatus('error');
              },
            });
          },
          error: (err: unknown) => {
            console.error('[live-session] INIT FAILED — full error object below:', err);
            setError(`Failed to initialize: ${JSON.stringify(err)}`);
            setStatus('error');
          },
        });
      } catch (err) {
        console.error('[live-session] CAUGHT EXCEPTION — full error object below:', err);
        setError(getApiErrorMessage(err));
        setStatus('error');
      }
    }

    loadAndJoin();
  }, [id, user]);

  if (status === 'loading' || status === 'joining') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0A0A0A] text-white/70">
        <Loader2 size={32} className="animate-spin text-orange-400" />
        <p className="text-sm">{status === 'loading' ? 'Preparing your session...' : 'Joining the live room...'}</p>
        {session && <p className="text-xs text-white/40">{session.title}</p>}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0A0A0A] px-6 text-center">
        <AlertCircle size={32} className="text-red-400" />
        <p className="max-w-sm text-sm text-white/70">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
        >
          <ArrowLeft size={14} /> Go back
        </button>
      </div>
    );
  }

  return null;
}