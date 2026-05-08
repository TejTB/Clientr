import Link from "next/link";

export function Wordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-[15px] tracking-[0.15em]",
    md: "text-[20px] tracking-[0.15em]",
    lg: "text-[28px] tracking-[0.15em]"
  };
  return (
    <Link
      href="/"
      className={`wordmark-glow inline-block font-bold text-accent ${sizes[size]}`}
      aria-label="CLIENTR home"
    >
      CLIENTR
    </Link>
  );
}
