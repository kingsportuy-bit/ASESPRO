"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

        <Link href="/contacto" className={styles.cta}>
          Consultar
        </Link>
      </div>
    </nav>
  );
}
