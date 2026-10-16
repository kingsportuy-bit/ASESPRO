import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { SiteFooter, TopNavBar } from "@/components/layout";
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/seo";

import "./globals.css";

const switzer = localFont({
  src: "../public/fonts/Switzer-Variable.woff2",
  variable: "--font-switzer",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} | Inmobiliaria en Paso de los Toros`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/asespro-isotipo-favicon.svg?v=20261016", type: "image/svg+xml" }],
    apple: "/asespro-isotipo-favicon.svg?v=20261016",
  },
  openGraph: {
    title: `${SITE_NAME} | Inmobiliaria en Paso de los Toros`,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "es_UY",
    siteName: SITE_NAME,
    url: "/",
    images: [{ url: "/HERO_ASESPRO.png", alt: "Propiedades de ASESPRO en Paso de los Toros y Pueblo Centenario" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Inmobiliaria en Paso de los Toros`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/HERO_ASESPRO.png", alt: "Propiedades de ASESPRO en Paso de los Toros y Pueblo Centenario" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="es">
      <body className={switzer.className}>
        <div className="site-frame">
          <TopNavBar />
          <a href="#main-content" className="skip-link">
            Saltar al contenido principal
          </a>
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
