import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Media Team Tracker", template: "%s · Media Team Tracker" },
  description: "Plan, assign and track the church media team's weekly work.",
  icons: { icon: "/pwa-icon/192", apple: "/pwa-icon/180" },
  appleWebApp: { capable: true, title: "Media Tracker", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0283f3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets the bottom tab bar respect the iPhone home indicator
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        {children}
        <Toaster position="top-center" />
        <PwaRegister />
      </body>
    </html>
  );
}