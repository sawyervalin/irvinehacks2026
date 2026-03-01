import type { Metadata } from "next";
import { ADLaM_Display, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import "./globals.css";

const display = ADLaM_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const body = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
