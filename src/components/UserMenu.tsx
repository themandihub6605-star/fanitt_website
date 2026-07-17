import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, LogOut, ChevronDown, CalendarCheck, FileText, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  const dashboardHref = user.role === 'creator' ? '/dashboard/creator' : user.role === 'brand' ? '/dashboard/brand' : user.role === 'agency' ? '/dashboard/agency' : null;
  const profileHref = user.role === 'creator' ? '/dashboard/creator/edit' : user.role === 'brand' ? '/dashboard/brand/edit' : user.role === 'agency' ? '/dashboard/agency/edit' : '/profile';

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 hover:bg-white/10 sm:pr-2.5">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-[100px] truncate text-sm font-semibold text-white/80 sm:inline">{user.name}</span>
        <ChevronDown size={14} className="hidden text-white/50 sm:inline" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-lifted"
          >
            <div className="border-b border-white/10 px-4 py-3">
              <p className="truncate text-sm font-bold text-white">{user.name}</p>
              <p className="truncate text-xs text-white/50">{user.email}</p>
              <span className="mt-1.5 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/60">
                {user.role}
              </span>
            </div>
            <div className="p-1.5">
              {dashboardHref && (
                <Link
                  to={dashboardHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10"
                >
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
              )}
              <Link
                to={profileHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                <UserCircle size={15} /> My Profile
              </Link>
              <Link
                to="/bookings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                <CalendarCheck size={15} /> My Bookings
              </Link>
              {user.role === 'creator' && (
                <Link
                  to="/proposals"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10"
                >
                  <FileText size={15} /> My Proposals
                </Link>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-300 hover:bg-red-500/10"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}