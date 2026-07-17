import { Container } from '@/components/ui/Container';
import { CTA } from '@/components/ui/CTA';

export function ClosingCTA() {
  return (
    <section className="py-section-mobile md:py-section">
      <Container>
        <CTA
          title="Ready to collaborate on Fanitt?"
          description="Whether you're a fan looking to connect, a creator ready to earn, or a brand ready to launch — start today."
          primaryLabel="Join Fanitt"
          secondaryLabel="Talk to our team"
        />
      </Container>
    </section>
  );
}
