/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0F17',
          surface: '#131B2E',
          border: '#232F48',
          divider: '#1E293B',
        },
        light: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
        },
        brand: {
          primary: '#3B82F6',
          primaryHover: '#2563EB',
          primaryDark: '#1D4ED8',
        },
        conversion: {
          green: '#10B981',
          greenHover: '#059669',
        },
        platform: {
          youtube: '#EF4444',
          instagram: '#E1306C',
        },
        status: {
          pending: '#F59E0B',
          error: '#DC2626',
        },
      },
    },
  },
  plugins: [],
};
