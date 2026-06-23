import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "0–100 Tracker — Acceleration Leaderboard",
  description:
    "A live leaderboard ranking cars by their 0–100 km/h acceleration time, fastest to slowest.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen`}
      >
        <SiteHeader />
        <main className="container py-8">{children}</main>
        <footer className="border-t border-border/60 py-6 mt-10">
          <div className="container text-xs text-muted-foreground flex items-center justify-between">
            <span>0–100 Tracker</span>
            <span className="tabular-nums">Developed by Kensu</span>
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
