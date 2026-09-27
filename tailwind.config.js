/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F6F8',
        surface: {
          DEFAULT: '#F4F6F8',
          elevated: '#FFFFFF',
          subtle: '#EDF1F5',
        },
        ink: {
          DEFAULT: '#171A1F',
          muted: '#56616F',
          subtle: '#8F9CA9',
        },
        border: {
          DEFAULT: '#D8DEE6',
          control: '#7C8796',
          subtle: '#E6EBF0',
        },
        accent: {
          DEFAULT: '#0F766E',
          hover: '#115E59',
          light: '#CCFBF1',
          subtle: '#F0FDFA',
        },
        semantic: {
          success: '#166534',
          'success-bg': '#F0FDF4',
          'success-border': '#BBF7D0',
          warning: '#92400E',
          'warning-bg': '#FFFBEB',
          'warning-border': '#FDE68A',
          danger: '#B42318',
          'danger-bg': '#FEF2F2',
          'danger-border': '#FECACA',
        },
      },
      borderRadius: {
        'input': '10px',
        'button': '14px',
        'card': '20px',
        'hero': '24px',
      },
      boxShadow: {
        'neu-elevated': '8px 8px 20px #dce1e6, -8px -8px 20px #ffffff',
        'neu-card': '4px 4px 14px #e2e8f0, -4px -4px 14px #ffffff',
        'neu-flat': '2px 2px 6px #e2e8f0, -2px -2px 6px #ffffff',
        'neu-inset': 'inset 3px 3px 7px #dce1e6, inset -3px -3px 7px #ffffff',
        'neu-button': '3px 3px 8px #dce1e6, -3px -3px 8px #ffffff',
        'neu-button-active': 'inset 2px 2px 5px #dce1e6, inset -2px -2px 5px #ffffff',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
