import type { Metadata } from "next";
import { ADLaM_Display } from "next/font/google";
import "./globals.css";

const adlamSans = ADLaM_Display({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: "400",
});

const adlamMono = ADLaM_Display({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: "400",
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
      <body className={`${adlamSans.variable} ${adlamMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
