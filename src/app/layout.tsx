import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parallax - Meet every version of your taste",
  description:
    "A Qloo-grounded council that helps the different eras of you decide what to watch, eat, buy, or do next.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
