import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";

import { SiteFooter, TopNavBar } from "@/components/layout";
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/seo";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} Inmobiliaria`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: '/LOGO_ASESPRO_NAV_MOBILE_20260429.png',
    apple: '/LOGO_ASESPRO_NAV_MOBILE_20260429.png',
  },
  openGraph: {
    title: `${SITE_NAME} Inmobiliaria`,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "es_UY",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} Inmobiliaria`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="es">
      <body className={manrope.className}>
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
