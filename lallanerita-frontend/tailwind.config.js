/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {},
  		animation: {
  			marquee: 'marquee 15s linear infinite',
  		},
  		keyframes: {
  			marquee: {
  				'0%': { transform: 'translateX(100%)' },
  				'100%': { transform: 'translateX(-100%)' },
  			},
  		},
  	}
  },
  plugins: [import("tailwindcss-animate")],
}

