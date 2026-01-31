import type { Metadata, Viewport } from "next";
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

// 1. Configure PWA Metadata
export const metadata: Metadata = {
  title: "SRM Social",
  description: "Find your squad at SRM.",
  manifest: "/manifest.json", // Links to your PWA manifest
  icons: {
    apple: "/icon-192.png", // Icon for iPhones
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SRM Social",
  },
};

// 2. Configure Viewport (Prevent Zooming for App-like feel)
export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents pinch-to-zoom
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}