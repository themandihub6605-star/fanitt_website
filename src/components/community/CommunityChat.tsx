import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, Trash2, MessagesSquare } from 'lucide-react';
import { communityApi, type ApiCommunity, type CommunityMessage } from '@/services/communityApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { getSocket } from '@/services/socket';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';
import { UserAvatar } from './CommunityAvatar';

interface Props {
  community: ApiCommunity;
}

/** Live group chat for members (Socket.IO with REST fallback). */
export function CommunityChat({ community }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingName, setTypingName] = useState('');
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number>();
  const lastTypingSent = useRef(0);
  const messagesRef = useRef<CommunityMessage[]>([]);
  messagesRef.current = messages;

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    });
  };

  const addMessage = useCallback((message: CommunityMessage) => {
    setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
    scrollToBottom();
  }, []);

  // Initial history + mark read
  useEffect(() => {
    setLoading(true);
    communityApi
      .chat(community._id)
      .then((res) => {
        setMessages(res.messages);
        setHasMore(res.hasMore);
        scrollToBottom(false);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
    communityApi.markChatRead(community._id).catch(() => {});
  }, [community._id]);

  // Live updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const join = () => socket.emit('community_join', { communityId: community._id });
    join();
    socket.on('connect', join);

    const onMessage = ({ communityId, message }: { communityId: string; message: CommunityMessage }) => {
      if (communityId !== community._id) return;
      addMessage(message);
      if (message.sender?._id !== user?._id) communityApi.markChatRead(community._id).catch(() => {});
      setTypingName('');
    };
    const onRemoved = ({ communityId, messageId }: { communityId: string; messageId: string }) => {
      if (communityId !== community._id) return;
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, isRemoved: true, text: '' } : m)));
    };
    const onTyping = ({ communityId, userId }: { communityId: string; userId: string }) => {
      if (communityId !== community._id || userId === user?._id) return;
      const who = messagesRef.current.find((m) => m.sender?._id === userId)?.sender?.name || 'Someone';
      setTypingName(who);
      window.clearTimeout(typingTimer.current);
      typingTimer.current = window.setTimeout(() => setTypingName(''), 3000);
    };

    socket.on('community_message', onMessage);
    socket.on('community_message_removed', onRemoved);
    socket.on('community_typing', onTyping);
    return () => {
      socket.emit('community_leave', { communityId: community._id });
      socket.off('connect', join);
      socket.off('community_message', onMessage);
      socket.off('community_message_removed', onRemoved);
      socket.off('community_typing', onTyping);
    };
  }, [community._id, user?._id, addMessage]);

  const loadOlder = async () => {
    if (!messages.length) return;
    setLoadingOlder(true);
    const el = listRef.current;
    const prevHeight = el?.scrollHeight || 0;
    try {
      const res = await communityApi.chat(community._id, messages[0].createdAt);
      setMessages((prev) => [...res.messages, ...prev]);
      setHasMore(res.hasMore);
      // Keep the view where it was.
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingOlder(false);
    }
  };

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setSending(true);
    setError('');
    setText('');
    try {
      const socket = getSocket();
      if (socket?.connected) {
        const ack = await new Promise<{ success: boolean; message?: CommunityMessage | string }>((resolve) => {
          const timeout = window.setTimeout(() => resolve({ success: false }), 8000);
          socket.emit('community_send', { communityId: community._id, text: value }, (res: { success: boolean; message?: CommunityMessage | string }) => {
            window.clearTimeout(timeout);
            resolve(res);
          });
        });
        if (ack.success && ack.message && typeof ack.message !== 'string') {
          addMessage(ack.message);
          return;
        }
      }
      addMessage(await communityApi.sendChat(community._id, value));
    } catch (err) {
      setError(getApiErrorMessage(err));
      setText(value);
    } finally {
      setSending(false);
    }
  };

  const onType = (value: string) => {
    setText(value);
    const now = Date.now();
    if (now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      getSocket()?.emit('community_typing', { communityId: community._id });
    }
  };

  const remove = async (message: CommunityMessage) => {
    try {
      await communityApi.deleteChat(community._id, message._id);
      setMessages((prev) => prev.map((m) => (m._id === message._id ? { ...m, isRemoved: true, text: '' } : m)));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="flex h-[70vh] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-navy-800/60">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-white/40">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-white/45">
            <MessagesSquare size={28} />
            <p className="text-sm">No messages yet. Say hello to the community!</p>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center">
                <button onClick={loadOlder} disabled={loadingOlder} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 hover:bg-white/15">
                  {loadingOlder ? 'Loading…' : 'Load older messages'}
                </button>
              </div>
            )}
            {messages.map((m, i) => {
              const mine = m.sender?._id === user?._id;
              const grouped = i > 0 && messages[i - 1].sender?._id === m.sender?._id;
              const canDelete = !m.isRemoved && (mine || community.canModerate);
              return (
                <div key={m._id} className={cn('group flex items-end gap-2', mine && 'flex-row-reverse', grouped && '-mt-2')}>
                  {!mine && (grouped ? <span className="w-8" /> : <UserAvatar user={m.sender} size={32} />)}
                  <div className={cn('max-w-[75%]', mine && 'text-right')}>
                    {!mine && !grouped && <p className="mb-0.5 pl-1 text-[11px] font-semibold text-white/50">{m.sender?.name}</p>}
                    <div
                      className={cn(
                        'inline-block rounded-2xl px-3.5 py-2 text-left text-sm',
                        m.isRemoved
                          ? 'border border-dashed border-white/15 italic text-white/40'
                          : mine
                          ? 'rounded-br-md bg-orange-500 text-white'
                          : 'rounded-bl-md bg-white/[0.08] text-white/90'
                      )}
                    >
                      {m.isRemoved ? 'Message removed' : <span className="whitespace-pre-wrap break-words">{m.text}</span>}
                    </div>
                    <p className="mt-0.5 px-1 text-[10px] text-white/35">
                      {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  {canDelete && (
                    <button onClick={() => remove(m)} className="mb-5 hidden rounded-md p-1 text-white/30 hover:text-red-400 group-hover:block" aria-label="Delete message">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        {typingName && <p className="mb-1 pl-2 text-[11px] text-orange-300">{typingName} is typing…</p>}
        {error && <p className="mb-1 pl-2 text-[11px] text-red-400">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            maxLength={2000}
            placeholder="Message the community…"
            className="flex-1 rounded-full border border-white/10 bg-navy-900/40 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-orange-400 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white disabled:opacity-40"
            aria-label="Send message"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}