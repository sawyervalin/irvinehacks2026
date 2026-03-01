import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
