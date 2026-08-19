import { Container } from '@/components/ui/Container';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'When you create an account on Fanitt, we collect information such as your name, email address, phone number, and role (Fan, Creator, Brand, or Agency). If you sign up as a Creator, Brand, or Agency, we may also collect additional details like your category, portfolio links, company information, and identity/address documents for verification purposes.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use the information you provide to create and manage your account, process bookings and payments, verify Creator/Brand/Agency accounts, send you notifications about your activity, and improve the Fanitt platform. We never sell your personal data to third parties.',
  },
  {
    title: '3. Payments & Escrow',
    body: 'Payments made on Fanitt (for sessions, donations, or brand campaigns) are processed through our payment partner, Razorpay. Funds for brand campaigns are held in escrow until work is confirmed complete. We do not store your card or bank details directly — these are handled securely by our payment processor.',
  },
  {
    title: '4. Referral Program',
    body: 'If you use a referral code at signup, we record which account referred you so that referral commissions can be calculated and paid out accurately. This relationship is stored against your account and is used only for commission tracking.',
  },
  {
    title: '5. Data Sharing',
    body: 'We share your information only where necessary — with our payment processor to complete transactions, and with other users when required for the service to function (for example, a Brand and Creator can see each other\'s public profile and contact details once a campaign is confirmed).',
  },
  {
    title: '6. Your Rights',
    body: 'You can update your profile information at any time from your account settings. If you wish to deactivate your account or request deletion of your data, you can do so from your account settings or by contacting us directly.',
  },
  {
    title: '7. Cookies & Sessions',
    body: 'We use cookies and local storage to keep you signed in and remember your preferences. These are essential for the platform to function and are not used for third-party advertising.',
  },
  {
    title: '8. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. Significant changes will be communicated via a notification on the platform or by email.',
  },
  {
    title: '9. Contact Us',
    body: 'If you have any questions about this Privacy Policy or how your data is handled, reach out to us at info@fanitt.com or +91 92014 69274.',
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="pt-28 pb-24">
      <Container className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Legal</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Privacy <span className="brand-gradient-text">Policy</span>
        </h1>
        <p className="mt-3 text-sm text-white/50">Last updated: January 2026</p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{section.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}