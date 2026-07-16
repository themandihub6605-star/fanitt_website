/**
 * ─────────────────────────────────────────────────────────────
 *  FANITT DESIGN SYSTEM — SINGLE SOURCE OF TRUTH
 * ─────────────────────────────────────────────────────────────
 *  Every color, font, spacing, radius and shadow used anywhere
 *  in the app should be derived from this file. Tailwind reads
 *  these tokens via tailwind.config.ts — change a value here
 *  and it propagates everywhere automatically.
 * ───────────────────────────────────────────────────────────── */

export const colors = {
  // Brand core (from Fanitt identity)
  orange: {
    50: '#FFF3EE',
    100: '#FFE1D3',
    200: '#FFC1A6',
    300: '#FF9C74',
    400: '#F97244',
    500: '#F4511E', // primary
    600: '#DC4415',
    700: '#B8390F',
    800: '#8F2C0C',
    900: '#6B2109',
  },
  yellow: {
    50: '#FFFBEF',
    100: '#FFF4CF',
    200: '#FFEA9F',
    300: '#FFDE7A',
    400: '#FFD65C', // accent
    500: '#F5C42E',
    600: '#D9A616',
  },
  navy: {
    50: '#F1F1F5',
    100: '#DADAE3',
    200: '#B3B3C6',
    300: '#8686A3',
    400: '#565679',
    500: '#3A3A5C',
    600: '#2C2D4A',
    700: '#232742', // base
    800: '#181A2E',
    900: '#101120',
  },
  cream: {
    DEFAULT: '#FFF8EC',
    soft: '#FFFCF6',
    deep: '#FBEFDA',
  },
  teal: {
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
  },
  white: '#FFFFFF',
  success: '#1FAA6D',
  danger: '#E5484D',
} as const;

export const typography = {
  fontDisplay: "'Sora', system-ui, sans-serif",
  fontBody: "'Inter', system-ui, sans-serif",
  scale: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
  },
} as const;

export const spacing = {
  section: {
    y: '6rem',       // vertical rhythm between sections (desktop)
    yMobile: '3.5rem',
  },
  gutter: '1.5rem',
} as const;

export const radius = {
  sm: '0.5rem',
  md: '0.875rem',
  lg: '1.25rem',
  xl: '1.75rem',
  '2xl': '2.25rem',
  full: '9999px',
} as const;

export const shadows = {
  soft: '0 2px 8px rgba(35, 39, 66, 0.06)',
  card: '0 8px 24px rgba(35, 39, 66, 0.08)',
  lifted: '0 20px 45px rgba(35, 39, 66, 0.14)',
  glow: '0 0 0 1px rgba(244, 81, 30, 0.15), 0 8px 30px rgba(244, 81, 30, 0.18)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1440px',
} as const;

export const animation = {
  fast: '150ms',
  base: '250ms',
  slow: '450ms',
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

const theme = { colors, typography, spacing, radius, shadows, breakpoints, animation };
export default theme;
