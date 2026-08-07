/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          bg: '#FBF7F0',
          card: '#FFFFFF',
          border: '#E8E0D3',
          text: '#2B2620',
          subtext: '#8A8070',
        },
        night: {
          bg: '#1C1A17',
          card: '#26231F',
          border: '#3A362F',
          text: '#F5EFE6',
        },
        accent: {
          green: '#3F5D48',
          gold: '#B8935A',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
        serif: ['"Noto Serif KR"', 'serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
