import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "HomeGuard AI — Protect Your First Home Before You Wire a Dollar",
  description:
    "AI-powered fraud detection built specifically for first-time home buyers. Scan wire instructions, emails, and PDFs before you lose everything.",
  keywords: "wire fraud, real estate fraud, home buyer protection, AI fraud detection, closing scam",
  openGraph: {
    title: "HomeGuard AI",
    description: "Don't wire a dollar without scanning it first.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${spaceMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
