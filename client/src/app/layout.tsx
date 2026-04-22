import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/shared/config/metadata";
import { QueryProvider } from "@/shared/providers/QueryProvider";
import { Toaster } from "@/shared/components/ui/sonner";
import { AuthProvider } from "@/shared/providers/AuthProvider";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { SelectionTranslator } from "@/features/translation/ui/SelectionTranslator";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  openGraph: siteConfig.openGraph,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider delayDuration={400}>
              {children}
              <SelectionTranslator />
            </TooltipProvider>
          </AuthProvider>
        </QueryProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
