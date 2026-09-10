import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "D+ Base Curricular",
  description: "Biblioteca curricular privada de la red Democracia+.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>
    <a href="#contenido" className="sr-only focus:not-sr-only">Saltar al contenido</a>
    {children}
  </body></html>;
}
