import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Growth Mentor",
  description: "Turn a ten-year vision into measurable weekly progress.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
