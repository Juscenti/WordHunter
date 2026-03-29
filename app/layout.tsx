import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Word Hunt Solver",
  description: "Solve Word Hunt puzzles by finding all valid words on the board.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
