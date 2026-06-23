import type { Metadata } from "next";
import { Fraunces, Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var d=t? t==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();",
          }}
        />
      </head>
      <body
        className={`${fraunces.variable} ${archivo.variable} ${plexMono.variable} font-sans min-h-screen`}
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
