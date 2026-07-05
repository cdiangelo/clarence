import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './data/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F7F6F1',
        card: '#FFFFFF',
        ink: {
          DEFAULT: '#23282A',
          soft: '#6A7072',
          muted: '#9BA3A5',
        },
        turf: {
          DEFAULT: '#2F6B44',
          wash: '#E8F0E9',
          light: '#4A8A5E',
          dark: '#1E4A2E',
        },
        sand: { DEFAULT: '#E7E3D6', dark: '#C4B48E' },
        flag: { DEFAULT: '#C2492E', wash: '#F5E8E4' },
        sky: { DEFAULT: '#3B7DC4', wash: '#E4EEF8' },
        gold: { DEFAULT: '#B8860B', wash: '#F5EDD4' },
        border: '#E2E0D8',
      },
      fontFamily: {
        display: ['Archivo', 'sans-serif'],
        body: ['Karla', 'sans-serif'],
        mono: ['"Spline Sans Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        card: '0 1px 4px 0 rgba(35,40,42,0.07), 0 0 0 1px rgba(35,40,42,0.04)',
        elevated: '0 4px 16px 0 rgba(35,40,42,0.10), 0 0 0 1px rgba(35,40,42,0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
