import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Skinners brand palette
        "blanc-casse": "#F7F3EE",
        carbone: "#1C1917",
        pierre: "#7C7269",
        sable: "#C8BAA9",
        ivoire: "#EDE6DB",
        terre: "#3D342C",
        // Semantic aliases
        brand: {
          bg: "#F7F3EE",
          text: "#1C1917",
          secondary: "#7C7269",
          accent: "#C8BAA9",
          card: "#EDE6DB",
          dark: "#3D342C",
        },
      },
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["Poppins", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        skinners: "0.25em",
      },
    },
  },
  plugins: [],
};

export default config;
