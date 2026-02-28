import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        'xs': '480px',      // Extra small devices (large phones)
        'sm': '640px',      // Small devices (default)
        'md': '768px',      // Medium devices (tablets, default)
        'lg': '1024px',     // Large devices (laptops, default)
        'xl': '1280px',     // Extra large devices (desktops, default)
        '2xl': '1536px',    // 2X large devices (large desktops, default)
        '3xl': '1920px',    // 3X large devices (ultra-wide monitors)
      },
      colors: {
        border: "hsl(var(--border))",
        "border-subtle": "hsl(var(--border-subtle))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--surface-foreground))",
        },
        courthouse: {
          DEFAULT: "#000000",
          foreground: "#ffffff",
          accent: "#9b2c2c",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "hsl(var(--card-hover))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          border: "hsl(var(--sidebar-border))",
        },
        /* PRD 3.1 — Status semantic colors */
        status: {
          critical: "hsl(var(--status-critical))",
          warning: "hsl(var(--status-warning))",
          operational: "hsl(var(--status-operational))",
          info: "hsl(var(--status-info))",
          neutral: "hsl(var(--status-neutral))",
        },
        /* PRD 3.1 — Text hierarchy */
        text: {
          primary: "hsl(var(--text-primary))",
          secondary: "hsl(var(--text-secondary))",
          muted: "hsl(var(--text-muted))",
        },
        "color-accent": "hsl(var(--color-accent))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      // Safe area spacing utilities
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Safe area plugin
    function({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.pt-safe': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.pb-safe': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.pl-safe': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.pr-safe': {
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.mt-safe': {
          'margin-top': 'env(safe-area-inset-top)',
        },
        '.mb-safe': {
          'margin-bottom': 'env(safe-area-inset-bottom)',
        },
        '.h-screen-safe': {
          'height': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        },
        '.min-h-screen-safe': {
          'min-height': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        },
      });
    },
  ],
} satisfies Config;