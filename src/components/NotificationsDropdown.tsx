import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CalendarCheck, Gift, ShieldCheck, Megaphone, Loader2 } from 'lucide-react';
import { notificationApi, type ApiNotification } from '@/services/notificationApi';
import { cn } from '@/utils/cn';

const ICON_MAP: Record<string, typeof CalendarCheck> = {
  session_booking: CalendarCheck,
  session_reminder: CalendarCheck,
  payment_success: ShieldCheck,
  donation_received: Gift,
  collaboration_invitation: Megaphone,
  campaign_update: Megaphone,
  payout_released: ShieldCheck,
  account_verified: ShieldCheck,
  feedback_received: Bell,
  general: Bell,
};

const toneForType = (type: string) => {
  if (['payment_success', 'payout_released', 'account_verified'].includes(type)) return 'bg-teal-500/15 text-teal-300';
  if (['donation_received'].includes(type)) return 'bg-orange-500/15 text-orange-400';
  return 'bg-yellow-400/15 text-yellow-300';
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationApi.getMy();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently ignore — notifications are non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every minute
    return () => clearInterval(interval);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-[#141414]" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-lifted"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-bold text-white">Notifications</p>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs font-semibold text-orange-400 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 divide-y divide-white/5 overflow-y-auto">
              {loading && notifications.length === 0 && (
                <div className="flex items-center justify-center py-8 text-white/40">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              )}
              {!loading && notifications.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-white/40">No notifications yet</p>
              )}
              {notifications.map((n) => {
                const Icon = ICON_MAP[n.type] || Bell;
                return (
                  <div key={n._id} className={cn('flex gap-3 px-4 py-3 hover:bg-navy-800/45', !n.isRead && 'bg-white/[0.02]')}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toneForType(n.type)}`}>
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white/90">{n.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/60">{n.message}</p>
                      <p className="mt-1 text-[10px] text-white/40">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
