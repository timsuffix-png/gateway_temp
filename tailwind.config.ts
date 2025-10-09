// tailwind.config.ts
import { type Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
   
      "3xl": "1920px",   
      "4xl": "2560px",   
    },
  },
  plugins: [],
} satisfies Config;
