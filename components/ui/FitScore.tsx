import type { CSSProperties } from "react";

type Tier = "exceptional" | "strong" | "ok" | "weak";

const tones: Record<Tier, { bg: string; color: string; border: string }> = {
  exceptional: {
    bg: "rgba(16,185,129,0.12)",
    color: "#34D399",
    border: "rgba(16,185,129,0.25)"
  },
  strong: {
    bg: "rgba(99,102,241,0.12)",
    color: "#818CF8",
    border: "rgba(99,102,241,0.25)"
  },
  ok: {
    bg: "rgba(245,158,11,0.12)",
    color: "#FCD34D",
    border: "rgba(245,158,11,0.25)"
  },
  weak: {
    bg: "rgba(239,68,68,0.12)",
    color: "#F87171",
    border: "rgba(239,68,68,0.25)"
  }
};

function tierForScore(score: number): Tier {
  if (score >= 9) return "exceptional";
  if (score >= 7) return "strong";
  if (score === 6) return "ok";
  return "weak";
}

export function FitScore({
  score,
  size = "md"
}: {
  score: number | null | undefined;
  size?: "sm" | "md";
}) {
  if (score == null || !Number.isFinite(score)) return null;
  const palette = tones[tierForScore(score)];
  const style: CSSProperties = {
    backgroundColor: palette.bg,
    color: palette.color,
    borderColor: palette.border,
    padding: size === "sm" ? "2px 8px" : "3px 10px",
    fontSize: size === "sm" ? "11px" : "12px",
    fontWeight: 700,
    letterSpacing: "0.01em"
  };
  return (
    <span
      className="inline-flex items-center rounded-full border leading-none tabular-nums"
      style={style}
      title={`Fit score ${score}/10`}
    >
      {score}/10
    </span>
  );
}
