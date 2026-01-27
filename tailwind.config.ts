import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#dfb569"
        },
        surface: {
          base: "#0f0f0f",
          card: "#1a1a1a",
          muted: "#141414"
        },
        text: {
          primary: "#f8f5ef",
          muted: "#cbbfa6"
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      boxShadow: {
        card: "0 20px 50px -30px rgba(0,0,0,0.75)",
        soft: "0 10px 30px -20px rgba(0,0,0,0.6)"
      },
      borderRadius: {
        xl: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
