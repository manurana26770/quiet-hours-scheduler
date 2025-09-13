import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      typography: {
        DEFAULT: {
          css: {
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            h1: {
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontWeight: "600",
              letterSpacing: "-0.025em",
            },
            h2: {
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontWeight: "600",
              letterSpacing: "-0.025em",
            },
            h3: {
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontWeight: "600",
              letterSpacing: "-0.025em",
            },
            h4: {
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontWeight: "600",
              letterSpacing: "-0.025em",
            },
            h5: {
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontWeight: "600",
              letterSpacing: "-0.025em",
            },
            h6: {
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontWeight: "600",
              letterSpacing: "-0.025em",
            },
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
