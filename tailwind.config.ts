import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display-1': ['64px', { lineHeight: '1.0', letterSpacing: '-2.125px', fontWeight: '700' }],
        'display-2': ['54px', { lineHeight: '1.04', letterSpacing: '-1.875px', fontWeight: '700' }],
        'h1': ['40px', { lineHeight: '1.1', letterSpacing: '-1px', fontWeight: '700' }],
        'h2': ['26px', { lineHeight: '1.23', letterSpacing: '-0.625px', fontWeight: '700' }],
        'h3': ['22px', { lineHeight: '1.27', letterSpacing: '-0.25px', fontWeight: '700' }],
        'title': ['20px', { lineHeight: '1.4', letterSpacing: '-0.125px', fontWeight: '600' }],
        'body-md': ['16px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        'body-sm': ['15px', { lineHeight: '1.33', letterSpacing: '0', fontWeight: '400' }],
        'caption': ['14px', { lineHeight: '1.43', letterSpacing: '0', fontWeight: '400' }],
        'eyebrow': ['12px', { lineHeight: '1.33', letterSpacing: '0.125px', fontWeight: '600' }],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        notion: {
          primary: 'hsl(var(--notion-primary))',
          'primary-active': 'hsl(var(--notion-primary-active))',
          secondary: 'hsl(var(--notion-secondary))',
          canvas: 'hsl(var(--notion-canvas))',
          'canvas-soft': 'hsl(var(--notion-canvas-soft))',
          surface: 'hsl(var(--notion-surface))',
          ink: 'hsl(var(--notion-ink))',
          'ink-secondary': 'hsl(var(--notion-ink-secondary))',
          'ink-muted': 'hsl(var(--notion-ink-muted))',
          'ink-faint': 'hsl(var(--notion-ink-faint))',
          hairline: 'hsl(var(--notion-hairline))',
          accent: {
            sky: 'hsl(var(--notion-accent-sky))',
            purple: 'hsl(var(--notion-accent-purple))',
            'purple-deep': 'hsl(var(--notion-accent-purple-deep))',
            pink: 'hsl(var(--notion-accent-pink))',
            orange: 'hsl(var(--notion-accent-orange))',
            'orange-deep': 'hsl(var(--notion-accent-orange-deep))',
            teal: 'hsl(var(--notion-accent-teal))',
            green: 'hsl(var(--notion-accent-green))',
            brown: 'hsl(var(--notion-accent-brown))',
          }
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        xs: '4px',
        sm: '5px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        'notion-soft': 'rgba(0,0,0,0.01) 0 0.175px 1.041px, rgba(0,0,0,0.02) 0 0.8px 2.925px, rgba(0,0,0,0.027) 0 2.025px 7.847px, rgba(0,0,0,0.04) 0 4px 18px',
        'notion-elevated': 'rgba(0,0,0,0.02) 0 1px 2px, rgba(0,0,0,0.03) 0 2px 4px, rgba(0,0,0,0.04) 0 4px 8px, rgba(0,0,0,0.05) 0 8px 16px, rgba(0,0,0,0.05) 0 23px 52px',
        glow: '0 0 40px -10px var(--tw-shadow-color)',
      },
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '28px',
        xxl: '32px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
