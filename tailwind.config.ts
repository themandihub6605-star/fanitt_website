import type { Config } from 'tailwindcss';
import { colors, typography, radius, shadows, breakpoints, spacing } from './src/styles/theme';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: breakpoints,
    extend: {
      colors: {
        orange: colors.orange,
        yellow: colors.yellow,
        navy: colors.navy,
        cream: colors.cream,
        teal: colors.teal,
        success: colors.success,
        danger: colors.danger,
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
        'sunrise-gradient': 'linear-gradient(135deg, #F4511E 0%, #FF9C74 50%, #FFD65C 100%)',
        'navy-gradient': 'linear-gradient(160deg, #232742 0%, #181A2E 100%)',
        'radial-glow': 'radial-gradient(circle at top right, rgba(255,214,92,0.25), transparent 60%)',
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
