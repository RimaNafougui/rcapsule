const { heroui } = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-in-out",
        "slide-up": "slideUp 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      letterSpacing: {
        tighter: "-0.05em",
        tight: "-0.025em",
        widest: "0.15em",
        "super-wide": "0.2em",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: {
              DEFAULT: "#FFFFFF",
              foreground: "#171717",
            },
            primary: {
              DEFAULT: "#171717",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#E5E5E5",
              foreground: "#171717",
            },
            default: {
              50: "#FAFAFA",
              100: "#F5F5F5",
              200: "#E5E5E5",
              300: "#D4D4D4",
              400: "#A3A3A3",
              500: "#737373",
              600: "#525252",
              700: "#404040",
              800: "#262626",
              900: "#171717",
            },
            focus: "#171717",
            danger: {
              DEFAULT: "#DC2626",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#16A34A",
              foreground: "#FFFFFF",
            },
            warning: {
              DEFAULT: "#EA580C",
              foreground: "#FFFFFF",
            },
          },
        },
        dark: {
          colors: {
            background: {
              DEFAULT: "#000000",
              foreground: "#EDEDED",
            },
            primary: {
              DEFAULT: "#FFFFFF",
              foreground: "#000000",
            },
            secondary: {
              DEFAULT: "#262626",
              foreground: "#FFFFFF",
            },
            default: {
              50: "#0A0A0A",
              100: "#171717",
              200: "#262626",
              300: "#404040",
              400: "#525252",
              500: "#737373",
              600: "#A3A3A3",
              700: "#D4D4D4",
              800: "#E5E5E5",
              900: "#FAFAFA",
            },
            focus: "#FFFFFF",
            danger: {
              DEFAULT: "#EF4444",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#22C55E",
              foreground: "#000000",
            },
            warning: {
              DEFAULT: "#F97316",
              foreground: "#000000",
            },
          },
        },
      },
      layout: {
        radius: {
          small: "0px",
          medium: "0px",
          large: "0px",
        },
        borderWidth: {
          small: "1px",
          medium: "2px",
          large: "3px",
        },
      },
    }),
  ],
};

module.exports = config;
