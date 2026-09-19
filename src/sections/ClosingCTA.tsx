import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { CTA } from '@/components/ui/CTA';
import { useAppSelector } from '@/store/hooks';

// Same rule as the Hero's primary CTA: a logged-in user goes straight to
// their own dashboard, never back through the get-started/signup flow
// they've already completed. Fan has no dashboard of its own, so it falls
// back to get-started same as a logged-out visitor.
function dashboardHrefFor(role?: string) {
  if (role === 'creator') return '/dashboard/creator';
  if (role === 'brand') return '/dashboard/brand';
  if (role === 'agency') return '/dashboard/agency';
  return '/get-started';
}

export function ClosingCTA() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const primaryHref = isAuthenticated ? dashboardHrefFor(user?.role) : '/get-started';

  return (
    <section className="py-section-mobile md:py-section">
      <Container>
        <CTA
          title="Ready to collaborate on Fanitt?"
          description="Whether you're a fan looking to connect, a creator ready to earn, or a brand ready to launch — start today."
          primaryLabel={isAuthenticated ? 'Go to Dashboard' : 'Join Fanitt'}
          secondaryLabel="Talk to our team"
          onPrimaryClick={() => navigate(primaryHref)}
          onSecondaryClick={() => navigate('/contact')}
          primaryClassName="!bg-orange-500 hover:!bg-orange-400 !bg-none"
        />
      </Container>
    </section>
  );
}