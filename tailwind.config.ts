import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#060A14',
        surface: '#0B1120',
        elevated: '#111926',
        border: '#1A2335',
        'border-light': '#233045',
        primary: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dim: '#3B82F620',
        },
        gain: { DEFAULT: '#10B981', dim: '#10B98120' },
        loss: { DEFAULT: '#EF4444', dim: '#EF444420' },
        gold: { DEFAULT: '#F59E0B', dim: '#F59E0B20' },
        ink: {
          DEFAULT: '#F0F6FF',
          secondary: '#7B8FB0',
          muted: '#3D4E6B',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
