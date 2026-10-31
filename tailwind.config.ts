import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0c12",
        canvas: "#10131c",
        panel: "#171b27",
        line: "#2b3242",
        mist: "#9da8bd",
        cloud: "#eef2ff",
        coral: "#ff876f",
        cyan: "#62d9d4",
        lilac: "#b7a3ff",
        lime: "#c5e87c",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,.07), 0 18px 60px rgba(0,0,0,.24)",
      },
    },
  },
  plugins: [],
};

export default config;
