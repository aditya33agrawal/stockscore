import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces are driven by CSS variables so a `.light` root flips the palette.
        ink: {
          950: "rgb(var(--ink-950) / <alpha-value>)",
          900: "rgb(var(--ink-900) / <alpha-value>)",
          800: "rgb(var(--ink-800) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
          600: "rgb(var(--ink-600) / <alpha-value>)",
          500: "rgb(var(--ink-500) / <alpha-value>)",
        },
        chalk: {
          50:  "rgb(var(--chalk-50) / <alpha-value>)",
          100: "rgb(var(--chalk-100) / <alpha-value>)",
          200: "rgb(var(--chalk-200) / <alpha-value>)",
          300: "rgb(var(--chalk-300) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft:    "rgb(var(--accent-soft) / <alpha-value>)",
          deep:    "rgb(var(--accent-deep) / <alpha-value>)",
        },
        violet: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft:    "rgb(var(--accent-soft) / <alpha-value>)",
        },
        warn: {
          DEFAULT: "rgb(var(--warn) / <alpha-value>)",
        },
        good: {
          DEFAULT: "rgb(var(--good) / <alpha-value>)",
          deep:    "rgb(var(--good-deep) / <alpha-value>)",
        },
        bad: {
          DEFAULT: "rgb(var(--bad) / <alpha-value>)",
          deep:    "rgb(var(--bad-deep) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans:  ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:  ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
        serif: ["Georgia", "serif"],
      },
      fontVariantNumeric: {
        tnum: "tabular-nums",
      },
    },
  },
  plugins: [],
};

export default config;
