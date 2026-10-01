import { useEffect, useState } from 'react';
import { Crown, Loader2, MoreHorizontal, Search, ShieldCheck } from 'lucide-react';
import {
  communityApi,
  type ApiCommunity,
  type CommunityMember,
  type MemberAction,
  type MembershipStatus,
} from '@/services/communityApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';
import { UserAvatar } from './CommunityAvatar';

interface Props {
  community: ApiCommunity;
  /** Called after approvals/removals so the header counts refresh. */
  onChanged: () => void;
}

export function MembersPanel({ community, onChanged }: Props) {
  const me = useAppSelector((s) => s.auth.user);
  const [tab, setTab] = useState<MembershipStatus>('active');
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [menuFor, setMenuFor] = useState('');
  const [error, setError] = useState('');

  const load = (nextPage = 1) => {
    setLoading(true);
    communityApi
      .members(community._id, { status: tab, search: search || undefined, page: nextPage })
      .then((res) => {
        setMembers((prev) => (nextPage === 1 ? res.members : [...prev, ...res.members]));
        setPage(res.page);
        setPages(res.pages);
        setTotal(res.total);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handle = window.setTimeout(() => load(1), 250);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search, community._id]);

  const act = async (member: CommunityMember, action: MemberAction) => {
    if ((action === 'ban' || action === 'remove') && !window.confirm(`${action === 'ban' ? 'Ban' : 'Remove'} ${member.user.name}?`)) return;
    setBusyId(member.user._id);
    setMenuFor('');
    setError('');
    try {
      await communityApi.manageMember(community._id, member.user._id, action);
      if (action === 'make_moderator' || action === 'remove_moderator') {
        setMembers((prev) =>
          prev.map((m) => (m.user._id === member.user._id ? { ...m, role: action === 'make_moderator' ? 'moderator' : 'member' } : m))
        );
      } else {
        setMembers((prev) => prev.filter((m) => m.user._id !== member.user._id));
        setTotal((t) => Math.max(0, t - 1));
      }
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  const tabs: { key: MembershipStatus; label: string }[] = [
    { key: 'active', label: `Members` },
    ...(community.canModerate
      ? [
          { key: 'pending' as MembershipStatus, label: `Requests${community.pendingRequestCount ? ` (${community.pendingRequestCount})` : ''}` },
          { key: 'banned' as MembershipStatus, label: 'Banned' },
        ]
      : []),
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-white/[0.05] p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn('rounded-full px-3.5 py-1.5 text-xs font-bold', tab === t.key ? 'bg-orange-500 text-white' : 'text-white/55 hover:text-white')}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="w-48 rounded-full border border-white/10 bg-navy-900/40 py-1.5 pl-8 pr-3 text-sm text-white placeholder:text-white/35 focus:border-orange-400 focus:outline-none"
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-white/45">{total.toLocaleString('en-IN')} {tab === 'active' ? 'members' : tab === 'pending' ? 'waiting for approval' : 'banned'}</p>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-3 divide-y divide-white/[0.06]">
        {members.map((m) => {
          const isSelf = m.user._id === me?._id;
          const canActOn =
            !isSelf && m.role !== 'admin' && community.canModerate && (community.isOwner || m.role === 'member');
          return (
            <div key={m.user._id} className="flex items-center gap-3 py-2.5">
              <UserAvatar user={m.user} size={38} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-white">
                  {m.user.name}
                  {m.role === 'admin' && <Crown size={13} className="text-yellow-400" aria-label="Owner" />}
                  {m.role === 'moderator' && <ShieldCheck size={13} className="text-sky-400" aria-label="Moderator" />}
                </p>
                <p className="text-[11px] capitalize text-white/40">
                  {m.role === 'admin' ? 'Owner' : m.role}
                  {m.user.role && ` · ${m.user.role}`}
                </p>
              </div>

              {busyId === m.user._id ? (
                <Loader2 size={16} className="animate-spin text-white/50" />
              ) : tab === 'pending' ? (
                <div className="flex gap-1.5">
                  <button onClick={() => act(m, 'approve')} className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600">
                    Approve
                  </button>
                  <button onClick={() => act(m, 'reject')} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/15">
                    Decline
                  </button>
                </div>
              ) : tab === 'banned' ? (
                <button onClick={() => act(m, 'unban')} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/15">
                  Unban
                </button>
              ) : (
                canActOn && (
                  <div className="relative">
                    <button onClick={() => setMenuFor(menuFor === m.user._id ? '' : m.user._id)} className="rounded-lg p-1.5 text-white/50 hover:bg-white/[0.06]">
                      <MoreHorizontal size={16} />
                    </button>
                    {menuFor === m.user._id && (
                      <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#1b1b1b] py-1 shadow-lifted">
                        {community.isOwner &&
                          (m.role === 'moderator' ? (
                            <MenuButton label="Remove moderator" onClick={() => act(m, 'remove_moderator')} />
                          ) : (
                            <MenuButton label="Make moderator" onClick={() => act(m, 'make_moderator')} />
                          ))}
                        <MenuButton label="Remove from community" onClick={() => act(m, 'remove')} />
                        <MenuButton label="Ban" danger onClick={() => act(m, 'ban')} />
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-4 text-white/40">
          <Loader2 size={18} className="animate-spin" />
        </div>
      )}
      {!loading && members.length === 0 && <p className="py-6 text-center text-sm text-white/40">Nobody here yet.</p>}
      {!loading && page < pages && (
        <button onClick={() => load(page + 1)} className="mt-2 w-full rounded-xl bg-white/[0.05] py-2 text-xs font-semibold text-white/70 hover:bg-white/10">
          Load more
        </button>
      )}
    </div>
  );
}

function MenuButton({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn('block w-full px-3 py-2 text-left text-sm hover:bg-white/[0.06]', danger ? 'text-red-400' : 'text-white/80')}>
      {label}
    </button>
  );
}