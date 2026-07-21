import { useEffect, useState, type PropsWithChildren, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Radio,
  MessageSquare,
  Wallet,
  CalendarCheck,
  FileText,
  Users2,
  Crown,
  UserCog,
  Search,
  Coins,
  Video,
  Megaphone,
  Bell,
  Settings,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { UserMenu } from '@/components/UserMenu';
import { MobileTabBar } from '@/components/MobileTabBar';
import { walletApi } from '@/services/walletApi';
import { chatApi } from '@/services/chatApi';
import { notificationApi } from '@/services/notificationApi';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

/**
 * Sidebar + topbar shell used for logged-in dashboard/app pages, matching the
 * reference product's desktop sidebar layout. Every link points at a real,
 * existing route — nothing here is a placeholder feature.
 */
export function DashboardShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const isCreator = user?.role === 'creator';
  const isBrand = user?.role === 'brand';
  const isAgency = user?.role === 'agency';

  const [search, setSearch] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    walletApi.getMy().then((w) => setWalletBalance(w.balance)).catch(() => setWalletBalance(null));
    chatApi
      .listConversations()
      .then((convos) => setUnreadMessages(convos.reduce((sum, c) => sum + (c.unreadCount || 0), 0)))
      .catch(() => setUnreadMessages(0));
    notificationApi.getMy(true).then((d) => setUnreadNotifications(d.unreadCount)).catch(() => setUnreadNotifications(0));
  }, [location.pathname]);

  const homeHref = isCreator ? '/dashboard/creator' : isBrand ? '/dashboard/brand' : isAgency ? '/dashboard/agency' : '/dashboard/brand';
  const editProfileHref = isCreator ? '/dashboard/creator/edit' : isBrand ? '/dashboard/brand/edit' : '/dashboard/agency/edit';

  const NAV = isAgency
    ? [
        { href: homeHref, label: 'Dashboard', icon: LayoutDashboard },
        { href: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages },
        { href: '/notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
        { href: '/wallet', label: 'Wallet', icon: Wallet },
        { href: editProfileHref, label: 'My Profile', icon: UserCog },
        { href: '/settings', label: 'Settings', icon: Settings },
      ]
    : [
        { href: homeHref, label: 'Dashboard', icon: LayoutDashboard },
        { href: '/explore', label: 'Discover', icon: Compass },
        { href: '/sessions', label: 'Live', icon: Radio },
        { href: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages },
        { href: '/notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
        { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
        isCreator
          ? { href: '/proposals', label: 'My Proposals', icon: FileText }
          : { href: '/campaigns', label: 'Campaigns', icon: FileText },
        { href: '/communities', label: 'Communities', icon: Users2 },
        { href: '/wallet', label: 'Wallet', icon: Wallet },
        { href: editProfileHref, label: 'My Profile', icon: UserCog },
        { href: '/settings', label: 'Settings', icon: Settings },
      ];

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/explore?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-navy-800/40 px-4 py-6 lg:flex">
        <Link to="/" className="mb-8 px-2">
          <Logo className="h-8 w-auto" />
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-orange-500/15 text-orange-300' : 'text-white/60 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon size={18} />
                <span className="flex-1">{item.label}</span>
                {!!item.badge && (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-pink-500/10 p-4">
          <div className="flex items-center gap-2 text-orange-300">
            <Crown size={16} />
            <span className="text-sm font-bold">Fanitt Pro</span>
          </div>
          <p className="mt-1.5 text-xs leading-snug text-white/50">
            Unlock advanced tools and grow your audience faster.
          </p>
        </div>

        {user && (
          <div className="mt-5 flex items-center gap-2.5 border-t border-white/10 pt-4 px-1">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/20 text-sm font-bold text-orange-300">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-white/40">@{user.name.toLowerCase().replace(/\s+/g, '')}</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-[#0A0A0A]/90 px-4 backdrop-blur-xl sm:px-6">
          <Link to="/" className="shrink-0 lg:hidden">
            <Logo className="h-7 w-auto" />
          </Link>

          <form onSubmit={handleSearch} className="hidden max-w-md flex-1 lg:block">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creators, brands, or topics"
                className="w-full rounded-full border border-white/10 bg-navy-800/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
            {isCreator ? (
              <Link
                to="/dashboard/creator?action=create-session"
                className="hidden items-center gap-1.5 rounded-full border border-red-500/30 px-3.5 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 sm:flex"
              >
                <Video size={13} /> Go Live
              </Link>
            ) : isBrand ? (
              <Link
                to="/campaigns/new"
                className="hidden items-center gap-1.5 rounded-full border border-orange-500/30 px-3.5 py-2 text-xs font-bold text-orange-400 hover:bg-orange-500/10 sm:flex"
              >
                <Megaphone size={13} /> New Campaign
              </Link>
            ) : null}

            {walletBalance !== null && (
              <Link to="/wallet" className="flex items-center gap-1.5 rounded-full border border-white/10 bg-navy-800/60 px-3 py-2 text-xs font-bold text-yellow-300 hover:border-yellow-400/40">
                <Coins size={14} /> {Math.round(walletBalance / 100).toLocaleString('en-IN')}
              </Link>
            )}

            <NotificationsDropdown />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 pb-24 lg:pb-10">{children}</main>
      </div>

      <MobileTabBar />
    </div>
  );
}