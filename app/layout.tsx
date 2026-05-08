import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CLIENTR, AI lead generation for creative agencies",
  description:
    "AI finds prospects, writes the outreach, saves everything in a clean dashboard. Built for solo designers and small agencies."
};

export const viewport: Viewport = {
  themeColor: "#08080F"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
