import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#08080F",
        surface: "#0F0F1A",
        "surface-2": "#161624",
        "surface-3": "#1C1C2E",
        border: "rgba(255,255,255,0.06)",
        "border-strong": "rgba(255,255,255,0.12)",
        accent: "#6366F1",
        "accent-2": "#8B5CF6",
        "accent-glow": "rgba(99,102,241,0.15)",
        "accent-subtle": "rgba(99,102,241,0.06)",
        text: "#F0F0FF",
        muted: "rgba(240,240,255,0.45)",
        faint: "rgba(240,240,255,0.18)",
        success: "#10B981",
        "success-fg": "#34D399",
        warning: "#F59E0B",
        "warning-fg": "#FCD34D",
        danger: "#EF4444",
        "danger-fg": "#F87171",
        info: "#00D4FF"
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        mono: [
          "SF Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace"
        ]
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        md: "12px",
        lg: "16px",
        xl: "20px"
      },
      boxShadow: {
        accent: "0 0 24px -4px rgba(99,102,241,0.4)",
        "accent-sm": "0 0 12px -4px rgba(99,102,241,0.3)",
        "accent-lg":
          "0 8px 40px rgba(99,102,241,0.18), 0 0 0 1px rgba(99,102,241,0.08)",
        "btn-primary": "0 4px 24px rgba(99,102,241,0.35)",
        "btn-primary-hover": "0 8px 32px rgba(99,102,241,0.5)",
        panel: "0 24px 60px -20px rgba(0,0,0,0.7)",
        dropdown: "0 8px 32px rgba(0,0,0,0.4)"
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #6366F1, #8B5CF6)",
        "accent-line":
          "linear-gradient(90deg, transparent, #6366F1, transparent)"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" }
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" }
        },
        "wordmark-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        "fade-in": "fade-in 240ms cubic-bezier(0.2,0.8,0.2,1)",
        "slide-up": "slide-up 280ms cubic-bezier(0.2,0.8,0.2,1)",
        "slide-in-right": "slide-in-right 280ms cubic-bezier(0.2,0.8,0.2,1)",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
        "wordmark-pulse": "wordmark-pulse 2s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite"
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.2,0.8,0.2,1)"
      }
    }
  },
  plugins: []
};

export default config;
