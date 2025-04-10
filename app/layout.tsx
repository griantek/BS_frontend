import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";
import { Link } from "@heroui/link";
import clsx from "clsx";
import { NavigationLoadingProvider } from '@/contexts/NavigationLoadingContext';
import { Suspense } from "react";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body>
        <NavigationLoadingProvider>
          <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
            <Suspense fallback={<div>Loading...</div>}>
              <div className={clsx(
                "relative flex flex-col min-h-screen bg-background font-sans antialiased",
                fontSans.variable,
              )}>
                <Navbar />
                <main className="flex-grow">{children}</main>
              </div>
            </Suspense>
          </Providers>
        </NavigationLoadingProvider>
      </body>
    </html>
  );
}
