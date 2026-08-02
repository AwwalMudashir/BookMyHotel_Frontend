import { BadgeCheck, Building2, Globe2, RefreshCcw, ShieldCheck, Sparkles } from 'lucide-react';

// Grounded in features that actually exist in this app — not generic marketing claims.
const features = [
  {
    icon: Globe2,
    title: 'See prices your way',
    description: 'Every price converts live into your chosen currency, wherever you’re browsing from.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Stripe checkout',
    description: 'Payments are processed by Stripe with 3D Secure verification — your card details never touch our servers.',
  },
  {
    icon: BadgeCheck,
    title: 'Reviews you can trust',
    description: 'Only guests who’ve actually completed a stay can leave a review — no fakes, no exceptions.',
  },
  {
    icon: Building2,
    title: 'A network worth exploring',
    description: 'Four world-class hotel chains with branches across Asia and Europe, all in one place.',
  },
  {
    icon: RefreshCcw,
    title: 'Flexible cancellation',
    description: 'Plans change — cancel an eligible booking anytime before check-in, no phone calls needed.',
  },
  {
    icon: Sparkles,
    title: 'Add what makes it a trip',
    description: 'Spa, dining, airport transfers, and local tours — bundle the extras straight into your booking.',
  },
];

const SiteFeatures = () => (
  <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0A7C6E]">Why BookMyHotel</p>
      <h2 className="mt-2 font-[Playfair_Display] text-3xl font-semibold text-[#1A1A2E] sm:text-4xl">Built for how you actually travel</h2>
    </div>

    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F5F3] text-[#0A7C6E]">
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="mt-4 font-semibold text-[#1A1A2E]">{title}</h3>
          <p className="mt-1.5 text-sm leading-6 text-[#6B7280]">{description}</p>
        </div>
      ))}
    </div>
  </section>
);

export default SiteFeatures;
