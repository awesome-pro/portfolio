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
  title: "Abhinandan — Founding Software Engineer",
  description:
    "AI systems engineer specializing in multi-agent orchestration, LLM inference, and production AI infrastructure.",
  metadataBase: new URL("https://abhinandan.one"),
  openGraph: {
    title: "Abhinandan — Founding Software Engineer",
    description:
      "AI systems engineer specializing in multi-agent orchestration, LLM inference, and production AI infrastructure.",
    url: "https://abhinandan.one",
    siteName: "Abhinandan",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Abhinandan — Founding Software Engineer",
    description:
      "AI systems engineer specializing in multi-agent orchestration, LLM inference, and production AI infrastructure.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-background text-ink">{children}</body>
    </html>
  );
}
