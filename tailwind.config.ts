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
          950: "#03060F",
          900: "#070C1A",
          800: "#0C1426",
          700: "#132035",
          600: "#1E3050",
          500: "#2E4060",
        },
        chalk: {
          50:  "#E8F4FF",
          100: "#DAEAF8",
          200: "#B8D0EC",
          300: "#7090B0",
        },
        accent: {
          DEFAULT: "#00D2FF",
          soft:    "#38E8FF",
          deep:    "#0099CC",
        },
        violet: {
          DEFAULT: "#7C3AED",
          soft:    "#9B6BF5",
        },
        warn: {
          DEFAULT: "#F59E0B",
        },
        bad: {
          DEFAULT: "#F87171",
          deep:    "#DC2626",
        },
      },
      fontFamily: {
        sans:  ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
        serif: ["Georgia", "serif"],
      },
      fontVariantNumeric: {
        tnum: "tabular-nums",
      },
      boxShadow: {
        "glow-cyan":   "0 0 40px rgba(0,210,255,0.15)",
        "glow-violet": "0 0 40px rgba(124,58,237,0.15)",
        "glow-sm":     "0 0 20px rgba(0,210,255,0.2)",
      },
      backgroundImage: {
        "grad-cyan-violet": "linear-gradient(135deg, #00D2FF, #7C3AED)",
        "grad-score-high":  "linear-gradient(90deg, #00D2FF, #7C3AED)",
        "grad-score-mid":   "linear-gradient(90deg, #F59E0B, #FBBF24)",
      },
    },
  },
  plugins: [],
};

export default config;
