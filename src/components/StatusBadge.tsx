import { cn } from '@/utils/cn';

const TONE_MAP: Record<string, string> = {
  success: 'bg-teal-500/15 text-teal-300',
  released: 'bg-teal-500/15 text-teal-300',
  verified: 'bg-teal-500/15 text-teal-300',
  confirmed: 'bg-teal-500/15 text-teal-300',
  approved: 'bg-teal-500/15 text-teal-300',
  completed: 'bg-teal-500/15 text-teal-300',
  accepted: 'bg-teal-500/15 text-teal-300',
  open: 'bg-teal-500/15 text-teal-300',

  pending: 'bg-yellow-400/15 text-yellow-300',
  in_progress: 'bg-yellow-400/15 text-yellow-300',
  in_escrow: 'bg-yellow-400/15 text-yellow-300',
  submitted: 'bg-yellow-400/15 text-yellow-300',

  failed: 'bg-red-500/15 text-red-400',
  rejected: 'bg-red-500/15 text-red-400',
  disputed: 'bg-red-500/15 text-red-400',
  cancelled: 'bg-red-500/15 text-red-400',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE_MAP[status] || 'bg-white/10 text-white/60';
  return (
    <span className={cn('inline-block shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', tone)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}