import { useEffect, useState } from 'react';
import { Bell, CalendarCheck, Gift, ShieldCheck, Megaphone, Loader2, AlertCircle, CheckCheck } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { notificationApi, type ApiNotification } from '@/services/notificationApi';
import { getApiErrorMessage } from '@/services/apiClient';
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
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    notificationApi
      .getMy()
      .then((d) => setNotifications(d.notifications))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleMarkAll = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClickNotification = async (n: ApiNotification) => {
    if (n.isRead) return;
    await notificationApi.markAsRead(n._id);
    setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="pt-8 pb-16">
      <Container className="!max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Notifications</h1>
            <p className="mt-1 text-sm text-white/60">{unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAll} className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 hover:border-orange-400/40 hover:text-white">
              <CheckCheck size={15} /> Mark all as read
            </button>
          )}
        </div>

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading notifications...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/60">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">Couldn't load notifications — {error}</p>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="mt-16 text-center text-white/50">
            <Bell size={28} className="mx-auto mb-3 text-white/30" />
            <p className="text-sm">No notifications yet.</p>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <div className="mt-6 space-y-2">
            {notifications.map((n) => {
              const Icon = ICON_MAP[n.type] || Bell;
              return (
                <button
                  key={n._id}
                  onClick={() => handleClickNotification(n)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                    n.isRead ? 'border-white/10 bg-navy-800/40' : 'border-orange-500/20 bg-orange-500/[0.04]'
                  )}
                >
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', toneForType(n.type))}>
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{n.title}</p>
                    <p className="mt-0.5 text-sm text-white/60">{n.message}</p>
                    <p className="mt-1 text-xs text-white/40">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500" />}
                </button>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
