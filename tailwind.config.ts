import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070B14",
          900: "#0B1220",
          800: "#101828",
          700: "#1A2233",
          600: "#2A3447",
          500: "#475569",
        },
        chalk: {
          50: "#F8FAFC",
          100: "#EEF2F7",
          200: "#D6DEEA",
          300: "#9FB0C8",
        },
        accent: {
          DEFAULT: "#10B981",
          soft: "#34D399",
          deep: "#059669",
        },
        warn: {
          DEFAULT: "#F59E0B",
        },
        bad: {
          DEFAULT: "#F87171",
          deep: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
        serif: ["Source Serif Pro", "Georgia", "serif"],
      },
      fontVariantNumeric: {
        tnum: "tabular-nums",
      },
    },
  },
  plugins: [],
};

export default config;
