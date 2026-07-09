import type { Metadata } from "next";
import { Instrument_Serif, Archivo, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { ChatAssistant } from "@/components/chat/chat-assistant";
import { FooterCredits } from "@/components/footer-credits";

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
  title: "0–100 · Acceleration Board",
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
        <footer className="mt-1 border-t border-border/60">
          {/* The empty third column mirrors the sign-off column so the credits
              sit in the true horizontal center, in line with the sign-off. */}
          <div className="container grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-3">
            {/* Editorial sign-off */}
            <p className="hidden font-display text-lg tracking-tight sm:block sm:text-xl">
              Quickest <span className="italic">first</span>
              <span className="text-primary">.</span>
            </p>

            {/* Credits — centered in the footer, in line with the sign-off */}
            <FooterCredits />
          </div>
        </footer>
        <ChatAssistant />
        <Toaster />
      </body>
    </html>
  );
}
