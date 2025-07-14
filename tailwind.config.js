import plugin from 'tailwindcss/plugin'

export default {
  prefix: 'tw-',
  important: '.nexus-widget',
  safelist: [
    'tw-cursor-pointer',
    'tw-fill-gray-200',
    'tw-stroke-gray-400',
    'tw-stroke-[0.8]',
    'hover:tw-fill-blue-500',
    'focus:tw-fill-blue-500',
    'active:tw-fill-blue-500',
  ],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {},
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.tw-touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.tw-touch-none': {
          'touch-action': 'none',
        },
        '.tw-touch-pan-x': {
          'touch-action': 'pan-x',
        },
        '.tw-touch-pan-y': {
          'touch-action': 'pan-y',
        },
        '.tw-touch-auto': {
          'touch-action': 'auto',
        },
      });
    }),
  ],
};

