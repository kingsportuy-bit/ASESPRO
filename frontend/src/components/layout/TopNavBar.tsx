"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import styles from "./TopNavBar.module.css";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/alquiler", label: "Alquiler" },
  { href: "/venta", label: "Venta" },
  { href: "/contacto", label: "Contacto" },
];

const CLEANING_SITE = "https://asespro.com.uy/";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function TopNavBar(): JSX.Element {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);
  const menuPanelRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuPanelRef.current?.contains(target) || menuToggleRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [menuOpen]);

  if (pathname.startsWith("/admin")) {
    return <></>;
  }

  function onTouchStart(x: number): void {
    setTouchStartX(x);
    setTouchCurrentX(x);
  }

  function onTouchMove(x: number): void {
    setTouchCurrentX(x);
  }

  function onTouchEnd(): void {
    if (touchStartX === null || touchCurrentX === null) return;
    const deltaX = touchCurrentX - touchStartX;
    const openedFromEdge = touchStartX > window.innerWidth - 48;
    if (!menuOpen && openedFromEdge && deltaX < -36) setMenuOpen(true);
    if (menuOpen && deltaX > 36) setMenuOpen(false);
    setTouchStartX(null);
    setTouchCurrentX(null);
  }

  return (
    <nav
      className={styles.wrap}
      aria-label="Navegacion principal"
      onTouchStart={(event) => onTouchStart(event.touches[0]?.clientX ?? 0)}
      onTouchMove={(event) => onTouchMove(event.touches[0]?.clientX ?? 0)}
      onTouchEnd={onTouchEnd}
    >
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <img src="/asespro-inmobiliaria-horizontal-white.svg" alt="ASESPRO Inmobiliaria" className={styles.logoDesktop} />
          <img src="/LOGO_ASESPRO_transparente_horizontal_moible.png?v=20260429b" alt="ASESPRO" className={styles.logoMobile} />
        </Link>

        <div className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={`${styles.link} ${isActivePath(pathname, item.href) ? styles.linkActive : ""}`}>
              {item.label}
            </Link>
          ))}
          <a href={CLEANING_SITE} target="_blank" rel="noopener noreferrer" className={styles.link}>Servicios</a>
        </div>

        <button ref={menuToggleRef} type="button" className={styles.mobileToggle} aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <span />
          <span />
          <span />
        </button>

        <Link href="/contacto" className={styles.cta}>
          Consultar
        </Link>
      </div>

      <div className={`${styles.mobileOverlay} ${menuOpen ? styles.mobileOverlayOpen : ""}`} onClick={() => setMenuOpen(false)} />
      <aside ref={menuPanelRef} className={`${styles.mobilePanel} ${menuOpen ? styles.mobilePanelOpen : ""}`} aria-hidden={!menuOpen}>
        <div className={styles.mobileHead}>
          <strong>ASESPRO</strong>
          <button type="button" className={styles.mobileClose} aria-label="Cerrar menu" onClick={() => setMenuOpen(false)}>
            x
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
          <a href={CLEANING_SITE} target="_blank" rel="noopener noreferrer" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Servicios</a>
          <Link href="/contacto" className={styles.mobileCta} onClick={() => setMenuOpen(false)}>
            Consultar ahora
          </Link>
        </div>
      </aside>
    </nav>
  );
}
