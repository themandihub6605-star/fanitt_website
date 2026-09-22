import { Link } from 'react-router-dom';
import { Heart, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { notificationApi, type ApiNotification } from '@/services/notificationApi';
import { getUploadUrl } from '@/services/apiClient';

function timeAgo(dateString: string) {
  const mins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<ApiNotification[] | null>(null);

  useEffect(() => {
    notificationApi.getMy().then((d) => setItems(d.notifications));
  }, []);

  const handleClick = (n: ApiNotification) => {
    if (!n.isRead) notificationApi.markAsRead(n._id).catch(() => {});
  };

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-navy-800 shadow-lifted">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
        <p className="text-sm font-bold text-white">Notifications</p>
        <button
          onClick={() => notificationApi.markAllAsRead().then(() => setItems((prev) => prev?.map((n) => ({ ...n, isRead: true })) || null))}
          className="text-xs font-semibold text-orange-400 hover:underline"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {items === null ? (
          <p className="py-8 text-center text-sm text-white/40">Loading...</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">No notifications yet.</p>
        ) : (
          items.map((n) => {
            const thumb = n.post?.mediaItems?.[0];
            const target = n.type === 'follow' ? `/creator/${n.fromUser?._id}` : n.post ? `/post/${n.post._id}` : '#';

            return (
              <Link
                key={n._id}
                to={target}
                onClick={() => handleClick(n)}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 ${!n.isRead ? 'bg-orange-500/5' : ''}`}
              >
                <div className="relative shrink-0">
                  {n.fromUser?.avatarUrl ? (
                    <img src={n.fromUser.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
                      {n.fromUser?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy-800 text-white">
                    {n.type === 'like' ? <Heart size={11} className="fill-red-500 text-red-500" /> : <UserPlus size={11} className="text-orange-400" />}
                  </span>
                </div>

                <p className="min-w-0 flex-1 text-sm text-white/85">
                  <span className="font-bold text-white">{n.fromUser?.name}</span>{' '}
                  {n.type === 'like' ? 'liked your post' : 'started following you'}
                  <span className="ml-1.5 text-xs text-white/40">{timeAgo(n.createdAt)}</span>
                </p>

                {thumb && <img src={getUploadUrl(thumb.url)} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />}

                {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}