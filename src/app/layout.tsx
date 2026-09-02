import type { Metadata } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

// Display font for headings: a sharp, geometric grotesque for the
// modern private-banking look.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MansaFi: The private bank for humans and AI agents",
  description:
    "MansaFi is the financial layer of the agent economy: a non-custodial neobank on Robinhood Chain where every transfer stays encrypted by default, settlement lands in 100ms blocks, and AI agents hold their own accounts under spend limits you control. Private by default. Verifiable by design.",
  openGraph: {
    title: "MansaFi: The private bank for humans and AI agents",
    description:
      "MansaFi is the financial layer of the agent economy: a non-custodial neobank on Robinhood Chain where every transfer stays encrypted by default, settlement lands in 100ms blocks, and AI agents hold their own accounts under spend limits you control. Private by default. Verifiable by design.",
    url: "https://mansafi.xyz",
    siteName: "MansaFi",
    type: "website",
    images: [
      {
        url: "https://mansafi.xyz/images/og.jpg",
        width: 1200,
        height: 630,
        alt: "MansaFi: The private bank for humans and AI agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@mansafixyz",
    creator: "@mansafixyz",
    title: "MansaFi: The private bank for humans and AI agents",
    description:
      "MansaFi is the financial layer of the agent economy: a non-custodial neobank on Robinhood Chain where every transfer stays encrypted by default, settlement lands in 100ms blocks, and AI agents hold their own accounts under spend limits you control. Private by default. Verifiable by design.",
    images: ["https://mansafi.xyz/images/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${spaceGrotesk.variable} antialiased`}>
      <body className="min-h-full flex flex-col" style={{ backgroundColor: "#0A0A0A", color: "rgb(248, 248, 248)" }}>
        {children}
      </body>
    </html>
  );
}
