import type { Metadata } from "next";
import { Instrument_Serif, Archivo, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "0–100 · Acceleration board",
  description:
    "A live ranking of cars by their 0–100 km/h time, quickest first.",
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
        className={`${instrumentSerif.variable} ${archivo.variable} ${spaceMono.variable} font-sans min-h-screen`}
      >
        <div className="grain" aria-hidden />
        <SiteHeader />
        <main className="container py-8">{children}</main>
        <footer className="border-t border-border/60 py-6 mt-10">
          <div className="container flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-display text-sm">0–100</span>
            <span className="flex items-center gap-1.5">
              Built by
              <a
                href="https://github.com/farhanj21"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                Kensu
              </a>
              <span className="text-muted-foreground/50">&</span>
              <a
                href="https://github.com/vroslmend"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                Vroslmend
              </a>
            </span>
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
