import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: "#f6efe2",
        ink: "#172033",
        mint: "#d6f4e7",
        moss: "#0f766e",
        ember: "#f97316",
        gold: "#d4a24a",
      },
      boxShadow: {
        glow: "0 24px 80px rgba(23, 32, 51, 0.14)",
      },
      backgroundImage: {
        "app-radial":
          "radial-gradient(circle at top left, rgba(16, 185, 129, 0.18), transparent 28%), radial-gradient(circle at top right, rgba(251, 146, 60, 0.16), transparent 28%)",
      },
    },
  },
  plugins: [],
};

export default config;

