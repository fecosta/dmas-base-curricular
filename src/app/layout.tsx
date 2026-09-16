import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Kept in the root layout only: src/app/app/layout.tsx is imported directly by
// tests/admin-navigation.test.ts in a bare node environment, where a side-effectful
// font import would throw.
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "D+ Base Curricular",
  description: "Biblioteca curricular privada de la red Democracia+.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" className={inter.variable}><body>
    <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-white">Saltar al contenido</a>
    {children}
  </body></html>;
}
