/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        arcade: {
          darkest: '#070913',
          darker: '#0b0f1f',
          dark: '#11172e',
          card: '#151d3b',
          cardBorder: '#23305c',
        },
        neon: {
          cyan: '#00f0ff',
          cyanGlow: 'rgba(0, 240, 255, 0.4)',
          amber: '#ff7043',
          amberGlow: 'rgba(255, 112, 67, 0.4)',
          gold: '#fbbf24',
          goldGlow: 'rgba(251, 191, 36, 0.5)',
          purple: '#a855f7',
          green: '#10b981',
        }
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.35)',
        'neon-amber': '0 0 20px rgba(255, 112, 67, 0.35)',
        'neon-gold': '0 0 25px rgba(251, 191, 36, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
}
