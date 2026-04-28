import Link from "next/link";

import styles from "./SiteFooter.module.css";

export function SiteFooter(): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} ${styles.desktopInner}`}>
        <nav className={`${styles.col} ${styles.navBlock}`} aria-label="Navegacion del pie de pagina">
          <p className={styles.colTitle}>Navegacion</p>
          <Link href="/" className={styles.link}>
            Inicio
          </Link>
          <Link href="/alquiler" className={styles.link}>
            Alquiler
          </Link>
          <Link href="/venta" className={styles.link}>
            Venta
          </Link>
          <Link href="/servicio-limpieza" className={styles.link}>
            Servicio de Limpieza
          </Link>
          <Link href="/contacto" className={styles.link}>
            Contacto
          </Link>
        </nav>

        <div className={styles.brandBlock}>
          <img src="/LOGO_ASESPRO_transparente.png" alt="ASESPRO" className={styles.brandLogo} />
        </div>

        <div className={`${styles.col} ${styles.contactBlock}`}>
          <p className={styles.colTitle}>Contacto</p>
          <a href="mailto:contacto@asespro.com" className={styles.link}>
            contacto@asespro.com
          </a>
          <a href="https://wa.me/59800000000" target="_blank" rel="noreferrer" className={styles.link}>
            WhatsApp
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className={styles.link}>
            Instagram
          </a>
        </div>
      </div>

      <div className={`${styles.inner} ${styles.mobileInner}`}>
        <div className={styles.brandBlock}>
          <img src="/LOGO_ASESPRO_transparente.png" alt="ASESPRO" className={styles.brandLogo} />
        </div>

        <div className={styles.mobileColumns}>
          <nav className={styles.col} aria-label="Navegacion del pie de pagina (mobile)">
            <p className={styles.colTitle}>Navegacion</p>
            <Link href="/" className={styles.link}>
              Inicio
            </Link>
            <Link href="/alquiler" className={styles.link}>
              Alquiler
            </Link>
            <Link href="/venta" className={styles.link}>
              Venta
            </Link>
            <Link href="/servicio-limpieza" className={styles.link}>
              Servicio de Limpieza
            </Link>
            <Link href="/contacto" className={styles.link}>
              Contacto
            </Link>
          </nav>

          <div className={styles.col}>
            <p className={styles.colTitle}>Contacto</p>
            <a href="mailto:contacto@asespro.com" className={styles.link}>
              contacto@asespro.com
            </a>
            <a href="https://wa.me/59800000000" target="_blank" rel="noreferrer" className={styles.link}>
              WhatsApp
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className={styles.link}>
              Instagram
            </a>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p className={styles.legal}>
          Todos los derechos reservados | &copy; {year} Asespro.uy power by{" "}
          <a href="https://codexa.uy" target="_blank" rel="noreferrer" className={styles.codexaLink}>
            Codexa.uy
          </a>
        </p>
      </div>
    </footer>
  );
}

