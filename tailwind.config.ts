import type { Config } from 'tailwindcss';
import { colors, typography, radius, shadows, breakpoints, spacing } from './src/styles/theme';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: breakpoints,
    extend: {
      colors: {
        orange: colors.orange,
        pink: colors.pink,
        yellow: colors.yellow,
        navy: colors.navy,
        cream: colors.cream,
        teal: colors.teal,
        success: colors.success,
        danger: colors.danger,
        ink: colors.navy,
      },
      fontFamily: {
        display: typography.fontDisplay.split(',').map((f) => f.trim().replace(/'/g, '')),
        body: typography.fontBody.split(',').map((f) => f.trim().replace(/'/g, '')),
      },
      fontSize: typography.scale,
      borderRadius: radius,
      boxShadow: shadows,
      spacing: {
        section: spacing.section.y,
        'section-mobile': spacing.section.yMobile,
        gutter: spacing.gutter,
      },
      backgroundImage: {
        'sunrise-gradient': 'linear-gradient(135deg, #FF5A1F 0%, #F9436E 55%, #EC2A78 100%)',
        'brand-gradient': 'linear-gradient(135deg, #FF6A1F 0%, #F9436E 60%, #EC2A78 100%)',
        'navy-gradient': 'linear-gradient(160deg, #141414 0%, #0A0A0A 100%)',
        'radial-glow': 'radial-gradient(circle at top right, rgba(255,90,31,0.18), transparent 60%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 5s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        gradientShift: 'gradientShift 12s ease infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
