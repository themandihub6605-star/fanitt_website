# Fanitt — Platform Website (UI/UX)

A premium, production-ready marketing/spec site for the Fanitt creator-brand
collaboration platform. **UI/UX only** — no backend, API, auth, or database
calls are wired up yet (see `src/services/api.ts`).

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS (design tokens in `src/styles/theme.ts` — this is the single
  file to edit to re-theme the whole app: colors, type scale, spacing,
  radius, shadows, breakpoints, animation timings)
- Redux Toolkit for state (`src/store`)
- React Router v6
- Framer Motion for animation

## Getting started

```bash
npm install
npm run dev       # start local dev server
npm run build      # production build to dist/
npm run preview   # preview the production build
```

## Folder structure

```
src/
  components/      # Navbar, Footer, Logo + components/ui (Button, Card, Badge, Input,
                    #   Modal, SectionTitle, Loading, FeatureCard, Testimonial, FAQ, CTA...)
  layouts/          # MainLayout (Navbar + Footer wrapper)
  pages/            # Route-level pages (Home, NotFound)
  sections/         # One component per PDF section (Hero, CreatorModule, BrandModule, ...)
  store/            # Redux Toolkit store + slices
  hooks/            # useInView (scroll reveal), useCounter (animated numbers)
  services/         # API layer placeholder for future backend integration
  constants/        # All copy/content extracted from the functional spec PDF
  styles/           # theme.ts (design tokens) + globals.css
  types/            # Shared TypeScript types
  utils/            # cn() class-merging helper
```

## Design system

Every color, font, radius, shadow and breakpoint lives in
`src/styles/theme.ts` and flows into Tailwind via `tailwind.config.ts`.
Change a hex value there and it propagates across the entire site.

Brand palette: Orange `#F4511E`, Yellow `#FFD65C`, Navy `#232742`,
Cream `#FFF8EC`. Typefaces: Baloo 2 (display) + Plus Jakarta Sans (body/UI).
