import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Loader2, MessageCircle, X } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { chatApi, type ApiConversation, type ApiMessage } from '@/services/chatApi';
import { getSocket } from '@/services/socket';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

function Avatar({
  name,
  avatarUrl,
  size = 'h-8 w-8',
  onClick,
}: {
  name?: string;
  avatarUrl?: string;
  size?: string;
  onClick?: () => void;
}) {
  const clickable = Boolean(avatarUrl && onClick);
  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      className={cn(size, 'shrink-0 overflow-hidden rounded-full', clickable && 'cursor-pointer hover:opacity-80')}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
          {name?.charAt(0).toUpperCase() || '?'}
        </span>
      )}
    </button>
  );
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const startWithUserId = searchParams.get('with');

  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [text, setText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const user = useAppSelector((s) => s.auth.user);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const loadConversations = () => {
    chatApi
      .listConversations()
      .then(setConversations)
      .finally(() => setLoadingList(false));
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!startWithUserId) return;
    chatApi.startConversation(startWithUserId).then((conv) => {
      setActiveId(conv._id);
      loadConversations();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startWithUserId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = ({ conversationId, message }: { conversationId: string; message: ApiMessage }) => {
      if (conversationId === activeIdRef.current) {
        setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
      }
      loadConversations();
    };

    const handleMessagesRead = ({ conversationId }: { conversationId: string }) => {
      if (conversationId !== activeIdRef.current) return;
      setMessages((prev) => prev.map((m) => (m.sender === user?._id ? { ...m, isRead: true } : m)));
    };

    const handleTyping = ({ conversationId }: { conversationId: string }) => {
      if (conversationId !== activeIdRef.current) return;
      setOtherTyping(true);
    };

    const handleTypingStop = ({ conversationId }: { conversationId: string }) => {
      if (conversationId !== activeIdRef.current) return;
      setOtherTyping(false);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('typing', handleTyping);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('typing', handleTyping);
      socket.off('typing_stop', handleTypingStop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  useEffect(() => {
    if (!activeId) return;
    setOtherTyping(false);
    setLoadingThread(true);
    chatApi
      .getMessages(activeId)
      .then(setMessages)
      .finally(() => setLoadingThread(false));
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const emitTypingStop = () => {
    if (!activeId) return;
    const socket = getSocket();
    socket?.emit('typing_stop', { conversationId: activeId });
  };

  const handleTextChange = (value: string) => {
    setText(value);
    if (!activeId) return;
    const socket = getSocket();
    socket?.emit('typing_start', { conversationId: activeId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(emitTypingStop, 1500);
  };

  const handleSend = () => {
    if (!activeId || !text.trim() || sending) return;
    const socket = getSocket();
    if (!socket) return;

    const textToSend = text.trim();
    setText('');
    emitTypingStop();
    setSending(true);

    socket.emit('send_message', { conversationId: activeId, text: textToSend }, (res: { success: boolean; error?: string }) => {
      setSending(false);
      if (!res.success) {
        setText(textToSend);
      }
    });
  };

  const activeConversation = conversations.find((c) => c._id === activeId);
  const otherParticipant = activeConversation?.participants.find((p) => p._id !== user?._id);

  return (
    <div className="w-full overflow-x-hidden pt-24 pb-8">
      <Container className="!max-w-5xl">
        <div className="grid h-[75vh] w-full min-w-0 grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-navy-800/45 sm:grid-cols-[280px_1fr]">
          <div className={cn('min-w-0 border-white/10 sm:border-r', activeId ? 'hidden sm:block' : 'block')}>
            <div className="border-b border-white/10 p-4">
              <h1 className="text-lg font-bold text-white">Messages</h1>
            </div>
            <div className="h-[calc(75vh-61px)] overflow-y-auto">
              {loadingList ? (
                <div className="flex items-center justify-center py-10 text-white/40">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="p-4 text-sm text-white/40">No conversations yet.</p>
              ) : (
                conversations.map((c) => {
                  const other = c.participants.find((p) => p._id !== user?._id);
                  return (
                    <button
                      key={c._id}
                      onClick={() => setActiveId(c._id)}
                      className={cn(
                        'flex w-full min-w-0 items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-navy-800/45',
                        activeId === c._id && 'bg-navy-800/60'
                      )}
                    >
                      <Avatar name={other?.name} avatarUrl={other?.avatarUrl} size="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <p className="min-w-0 truncate text-sm font-bold text-white">{other?.name}</p>
                          {c.unreadCount > 0 && (
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="min-w-0 truncate text-xs text-white/50">{c.lastMessage || 'No messages yet'}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className={cn('flex min-w-0 flex-col', !activeId ? 'hidden sm:flex' : 'flex')}>
            {!activeId ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-white/40">
                <MessageCircle size={28} />
                <p className="text-sm">Select a conversation</p>
              </div>
            ) : (
              <>
                <div className="flex min-w-0 items-center gap-3 border-b border-white/10 p-4">
                  <button onClick={() => setActiveId(null)} className="shrink-0 text-white/60 sm:hidden">
                    ←
                  </button>
                  <Avatar
                    name={otherParticipant?.name}
                    avatarUrl={otherParticipant?.avatarUrl}
                    size="h-9 w-9"
                    onClick={() => otherParticipant?.avatarUrl && setLightboxUrl(otherParticipant.avatarUrl)}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{otherParticipant?.name}</p>
                    {otherTyping && <p className="text-xs text-orange-300">typing...</p>}
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-4">
                  {loadingThread ? (
                    <div className="flex items-center justify-center py-10 text-white/40">
                      <Loader2 size={20} className="animate-spin" />
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMine = m.sender === user?._id;
                      const senderInfo = isMine ? user : otherParticipant;
                      return (
                        <motion.div
                          key={m._id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn('flex min-w-0 items-end gap-2', isMine ? 'flex-row-reverse' : 'flex-row')}
                        >
                          <Avatar
                            name={senderInfo?.name}
                            avatarUrl={senderInfo?.avatarUrl}
                            size="h-7 w-7"
                            onClick={() => senderInfo?.avatarUrl && setLightboxUrl(senderInfo.avatarUrl)}
                          />
                          <div
                            className={cn(
                              'max-w-[70%] shrink rounded-2xl px-4 py-2.5 text-sm break-words',
                              isMine ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/90'
                            )}
                          >
                            {m.text}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="flex min-w-0 items-center gap-2 border-t border-white/10 p-3">
                  <input
                    value={text}
                    onChange={(e) => handleTextChange(e.target.value)}
                    onBlur={emitTypingStop}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !text.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={lightboxUrl}
              alt=""
              className="max-h-[85vh] max-w-full rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}