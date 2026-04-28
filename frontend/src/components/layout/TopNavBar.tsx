"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import styles from "./TopNavBar.module.css";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/alquiler", label: "Alquiler" },
  { href: "/venta", label: "Venta" },
  { href: "/servicio-limpieza", label: "Servicio de Limpieza" },
  { href: "/contacto", label: "Contacto" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function TopNavBar(): JSX.Element {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={styles.wrap} aria-label="Navegacion principal">
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <img src="/LOGO_ASESPRO_transparente_horizontal.png" alt="ASESPRO" className={styles.logoDesktop} />
          <img src="/LOGO_ASESPRO_transparente_horizontal_moible.png" alt="ASESPRO" className={styles.logoMobile} />
        </Link>

        <div className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${isActivePath(pathname, item.href) ? styles.linkActive : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className={styles.mobileToggle}
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>

        <Link href="/contacto" className={styles.cta}>
          Consultar
        </Link>
      </div>

      <div className={`${styles.mobileOverlay} ${menuOpen ? styles.mobileOverlayOpen : ""}`} onClick={() => setMenuOpen(false)} />
      <aside className={`${styles.mobilePanel} ${menuOpen ? styles.mobilePanelOpen : ""}`} aria-hidden={!menuOpen}>
        <div className={styles.mobileHead}>
          <strong>ASESPRO</strong>
          <button type="button" className={styles.mobileClose} aria-label="Cerrar menu" onClick={() => setMenuOpen(false)}>
            ✕
          </button>
        </div>
        <div className={styles.mobileNav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={`mobile-${item.href}`}
              href={item.href}
              className={`${styles.mobileLink} ${isActivePath(pathname, item.href) ? styles.mobileLinkActive : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contacto" className={styles.mobileCta} onClick={() => setMenuOpen(false)}>
            Consultar ahora
          </Link>
        </div>
      </aside>
    </nav>
  );
}
