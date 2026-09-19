import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { bookingApi, type ApiBooking } from '@/services/bookingApi';
import { getApiErrorMessage } from '@/services/apiClient';

function canJoinNow(scheduledAt: string) {
  const diffMinutes = (new Date(scheduledAt).getTime() - Date.now()) / 60000;
  return diffMinutes <= 10;
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    bookingApi
      .myBookings()
      .then(setBookings)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-28 pb-24">
      <Container>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">My Bookings</h1>
        <p className="mt-1 text-sm text-white/60">Sessions you've booked — join links appear 10 minutes before start time.</p>

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading your bookings...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/60">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <p className="mt-16 text-center text-white/50">You haven't booked any sessions yet.</p>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {bookings
              .filter((b) => b.status === 'confirmed')
              .map((b, i) => (
                <motion.div
                  key={b._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-navy-800/60 p-5"
                >
                  <p className="text-sm font-bold text-white">{b.session.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-white/50">
                    <Clock size={12} /> {new Date(b.session.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>

                  {canJoinNow(b.session.scheduledAt) ? (
                    <button
                      onClick={() => navigate(`/sessions/${b.session._id}/live`)}
                      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-500 py-2.5 text-xs font-bold text-white hover:bg-red-600"
                    >
                      <Video size={13} /> Join Live Session
                    </button>
                  ) : (
                    <p className="mt-4 text-center text-xs text-white/40">Join link appears 10 min before start</p>
                  )}
                </motion.div>
              ))}
          </div>
        )}
      </Container>
    </div>
  );
}
