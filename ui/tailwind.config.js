/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ["Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        accent: {
          DEFAULT: "#4f46e5",
          hover: "#4338ca",
          soft: "#eef2ff",
          border: "#c7d2fe",
        },
        ink: {
          900: "#0b1020",
          800: "#1e2438",
          700: "#334155",
        },
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, rgba(79,70,229,0.10) 0%, rgba(168,85,247,0.10) 100%)",
        "hero-mesh":
          "radial-gradient(ellipse 1200px 600px at 50% -10%, rgba(79,70,229,0.10), transparent 60%), radial-gradient(ellipse 800px 500px at 90% 110%, rgba(168,85,247,0.08), transparent 60%)",
        "app-mesh":
          "radial-gradient(ellipse 900px 500px at 0% 0%, rgba(99,102,241,0.06), transparent 60%), radial-gradient(ellipse 700px 500px at 100% 0%, rgba(168,85,247,0.05), transparent 60%), radial-gradient(ellipse 700px 400px at 50% 100%, rgba(236,72,153,0.04), transparent 60%)",
        "sidebar-grad":
          "linear-gradient(180deg, #ffffff 0%, #fbfaff 60%, #f6f4ff 100%)",
        "shine":
          "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.04)",
        card: "0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px -2px rgb(15 23 42 / 0.05)",
        cardHover:
          "0 2px 4px rgb(15 23 42 / 0.06), 0 16px 32px -4px rgb(15 23 42 / 0.10)",
        cardLift:
          "0 4px 8px rgb(15 23 42 / 0.05), 0 24px 48px -12px rgb(79 70 229 / 0.18)",
        glow: "0 8px 24px -8px rgba(79,70,229,0.45)",
        glowLg: "0 18px 40px -12px rgba(79,70,229,0.55)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.6)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.96)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        shine: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(79,70,229,0.45)" },
          "50%": { boxShadow: "0 0 0 14px rgba(79,70,229,0)" },
        },
        progress: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 360ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        fadeIn: "fadeIn 320ms ease-out both",
        scaleIn: "scaleIn 320ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        shimmer: "shimmer 1.6s linear infinite",
        shine: "shine 1.8s ease-in-out infinite",
        float: "float 4.5s ease-in-out infinite",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
        progress: "progress 1.6s ease-in-out infinite",
        spinSlow: "spinSlow 10s linear infinite",
      },
    },
  },
  plugins: [],
};
