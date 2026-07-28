import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationApi } from '@/services/notificationApi';

/** Bell icon that links straight to the /notifications page — no dropdown,
 * no popup, just a normal navigation link with a live unread-count dot. */
export function NotificationBellLink() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = () => {
      notificationApi
        .getMy(true)
        .then((d) => setUnreadCount(d.unreadCount))
        .catch(() => setUnreadCount(0));
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000); // poll every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      to="/notifications"
      aria-label="Notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-[#141414]" />
      )}
    </Link>
  );
}