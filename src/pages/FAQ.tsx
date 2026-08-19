import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { cn } from '@/utils/cn';

const FAQS = [
  {
    q: 'What is Fanitt?',
    a: 'Fanitt is a platform where creators, brands, and fans collaborate — book live sessions with real creators, support them directly, or launch a brand campaign, with every payment protected until the work is done.',
  },
  {
    q: 'How do I sign up?',
    a: 'Click "Get Started" and sign in with your Google account. Once signed in, you\'ll choose your role — Fan, Creator, Brand, or Agency — and fill in a few details to complete your profile.',
  },
  {
    q: 'Do I need to be approved before I can use Fanitt?',
    a: 'Creator, Brand, and Agency accounts go through a quick review by our team before they get full access. Fans can start browsing and booking sessions right away.',
  },
  {
    q: 'How does payment protection work?',
    a: 'For brand campaigns, the budget is held in escrow by Fanitt until the work is confirmed complete. This protects both the Brand (work gets delivered) and the Creator (payment is guaranteed once approved).',
  },
  {
    q: 'What is the referral program?',
    a: 'If someone refers you to Fanitt using their referral code, that relationship is recorded. Depending on your roles, the person who referred you can earn a commission from your future earnings on the platform.',
  },
  {
    q: 'How do I withdraw my earnings?',
    a: 'From your Wallet page, click "Request Withdrawal" and enter your UPI ID or bank details along with the amount. Our team processes withdrawal requests and transfers the funds directly.',
  },
  {
    q: 'Can I become both a Creator and a Brand?',
    a: 'Each Fanitt account has one primary role at a time. If your needs change, reach out to our support team and we can help you transition your account.',
  },
  {
    q: 'How do I contact support?',
    a: 'You can reach us anytime at info@fanitt.com or +91 92014 69274. We typically respond within 24 hours.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="pt-28 pb-24">
      <Container className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Help Center</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Frequently Asked <span className="brand-gradient-text">Questions</span>
        </h1>
        <p className="mt-3 text-white/60">Can't find what you're looking for? Reach out on our Contact page.</p>

        <div className="mt-10 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.q} className="overflow-hidden rounded-2xl border border-white/10 bg-navy-800/60">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-white">{item.q}</span>
                  <ChevronDown size={18} className={cn('shrink-0 text-white/40 transition-transform', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4">
                    <p className="text-sm leading-relaxed text-white/60">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </div>
  );
}