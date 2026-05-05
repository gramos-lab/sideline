import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF9',
        surface: '#FFFFFF',
        ink: '#18181B',
        border: {
          subtle: '#E8E6E1',
          emphasis: '#D4D2CC',
          hairline: '#F4F4F1',
        },
        text: {
          primary: '#18181B',
          secondary: '#52525B',
          tertiary: '#71717A',
          quaternary: '#A1A1AA',
        },
        muted: '#D4D4D8',
        today: '#FDE68A',
        status: {
          unassigned: { dot: '#A1A1AA', fill: '#F4F4F1', text: '#71717A', border: '#E8E6E1' },
          notified: { dot: '#CA8A04', fill: '#FEF9E7', text: '#854D0E', border: '#FDE68A' },
          'initial-yes': { dot: '#2563EB', fill: '#EFF4FF', text: '#1E3A8A', border: '#BFDBFE' },
          confirmed: { dot: '#16A34A', fill: '#ECFDF5', text: '#14532D', border: '#A7F3D0' },
          callout: { dot: '#EA580C', fill: '#FFF1E6', text: '#9A3412', border: '#FED7AA' },
          unfilled: { dot: '#DC2626', fill: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-jbm)', 'ui-monospace', 'SF Mono', 'monospace'],
      },
      fontSize: {
        'page-title': ['17px', { lineHeight: '22px', fontWeight: '600', letterSpacing: '-0.02em' }],
        'day-header': ['11px', { lineHeight: '16px', fontWeight: '700', letterSpacing: '0.08em' }],
        'section-label': ['11px', { lineHeight: '16px', fontWeight: '700', letterSpacing: '0.08em' }],
        'micro-label': ['10px', { lineHeight: '14px', fontWeight: '600', letterSpacing: '0.04em' }],
        'card-body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'row': ['15px', { lineHeight: '24px', fontWeight: '400' }],
        'row-emphasis': ['15px', { lineHeight: '24px', fontWeight: '500' }],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
        cardOrange: '0 1px 3px rgba(234,88,12,0.06), 0 4px 16px rgba(234,88,12,0.06)',
        modal: '0 32px 64px rgba(0,0,0,0.25)',
        toast: '0 10px 32px rgba(0,0,0,0.2)',
        dropdown: '0 8px 24px rgba(0,0,0,0.08)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        slPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        slPulseBg: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(234,88,12,0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(234,88,12,0.18)' },
        },
        slExpand: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slFade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slPop: {
          '0%': { opacity: '0', transform: 'scale(0.97) translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slToast: {
          '0%': { opacity: '0', transform: 'translateX(-50%) translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'sl-pulse': 'slPulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'sl-pulse-bg': 'slPulseBg 1.6s cubic-bezier(0.4,0,0.6,1) infinite',
        'sl-expand': 'slExpand 200ms cubic-bezier(0.16,1,0.3,1)',
        'sl-fade': 'slFade 160ms ease',
        'sl-pop': 'slPop 200ms cubic-bezier(0.16,1,0.3,1)',
        'sl-toast': 'slToast 200ms cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
};

export default config;
