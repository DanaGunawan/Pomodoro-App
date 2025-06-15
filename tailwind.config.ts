import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
      screens: {
      sm: '640px',
      md: '768px', // used for hiding/showing mobile/desktop menus
      lg: '1024px',
    },
  },
  plugins: [],
}

export default config
