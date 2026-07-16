import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { chatApi, type ApiConversation, type ApiMessage } from '@/services/chatApi';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

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
  const user = useAppSelector((s) => s.auth.user);
  const bottomRef = useRef<HTMLDivElement>(null);

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
    if (!activeId) return;
    setLoadingThread(true);
    chatApi
      .getMessages(activeId)
      .then(setMessages)
      .finally(() => setLoadingThread(false));

    const interval = setInterval(() => {
      chatApi.getMessages(activeId).then(setMessages);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

 const handleSend = async () => {
    if (!activeId || !text.trim() || sending) return;
    const textToSend = text.trim();
    setText('');
    setSending(true);
    try {
      const message = await chatApi.sendMessage(activeId, textToSend);
      setMessages((prev) => [...prev, message]);
      loadConversations();
    } finally {
      setSending(false);
    }
  };

  const activeConversation = conversations.find((c) => c._id === activeId);
  const otherParticipant = activeConversation?.participants.find((p) => p._id !== user?._id);

  return (
    <div className="pt-24 pb-8">
      <Container className="!max-w-5xl">
        <div className="grid h-[75vh] grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:grid-cols-[280px_1fr]">
          <div className={cn('border-white/10 sm:border-r', activeId ? 'hidden sm:block' : 'block')}>
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
                        'flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]',
                        activeId === c._id && 'bg-white/[0.05]'
                      )}
                    >
                      {other?.avatarUrl ? (
                        <img src={other.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-sm font-bold text-orange-300">
                          {other?.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-white">{other?.name}</p>
                          {c.unreadCount > 0 && (
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-white/50">{c.lastMessage || 'No messages yet'}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className={cn('flex flex-col', !activeId ? 'hidden sm:flex' : 'flex')}>
            {!activeId ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-white/40">
                <MessageCircle size={28} />
                <p className="text-sm">Select a conversation</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-white/10 p-4">
                  <button onClick={() => setActiveId(null)} className="text-white/60 sm:hidden">
                    ←
                  </button>
                  <p className="font-bold text-white">{otherParticipant?.name}</p>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                  {loadingThread ? (
                    <div className="flex items-center justify-center py-10 text-white/40">
                      <Loader2 size={20} className="animate-spin" />
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMine = m.sender === user?._id;
                      return (
                        <motion.div
                          key={m._id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
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

                <div className="flex items-center gap-2 border-t border-white/10 p-3">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
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
    </div>
  );
}