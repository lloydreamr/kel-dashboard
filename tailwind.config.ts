import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS 4 Configuration
 *
 * Note: Tailwind 4 uses CSS-first configuration via @theme in globals.css.
 * This file provides compatibility with tooling and documents design tokens.
 *
 * Design Tokens (defined in globals.css):
 * - Primary (sage): #86A789
 * - Background: #F9F7F4
 * - Foreground: #1a1a1a
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Kel Dashboard Design Tokens
        primary: '#86A789',
        background: '#F9F7F4',
        foreground: '#1a1a1a',
        muted: {
          DEFAULT: '#f1f5f9',
          foreground: '#64748b',
        },
        border: '#e2e8f0',
        ring: '#86A789',
      },
    },
  },
  plugins: [],
};

// Note: Tailwind config files require export default
export default config;
