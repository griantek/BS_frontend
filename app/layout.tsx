import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";
import { Link } from "@heroui/link";
import clsx from "clsx";


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
  // Get the current pathname
  const isHomePage = typeof window !== 'undefined' ? window.location.pathname === '/' : false;

  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body>
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className={clsx(
            "relative flex flex-col h-screen min-h-screen bg-background font-sans antialiased",
            fontSans.variable,
          )}>
            {!isHomePage && <Navbar />}
            <main className={clsx(
              "container mx-auto flex-grow",
              isHomePage ? "" : "pt-16 px-6"
            )}>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
