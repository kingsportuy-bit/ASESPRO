import type { Metadata } from "next";
import Link from "next/link";

import styles from "./ServicioLimpiezaPage.module.css";

const CLEANING_HERO_IMAGE = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80";
const CLEANING_OFFICE_IMAGE = "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1400&q=80";
const CLEANING_DETAIL_IMAGE = "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=1200&q=80";

export const metadata: Metadata = {
  title: "Servicio de limpieza en Uruguay",
  description:
    "Limpieza profesional para empresas y particulares en Paso de los Toros, Montevideo y Maldonado. Solicita presupuesto personalizado por formulario.",
};

export default function ServicioLimpiezaPage(): JSX.Element {
  return (
    <main>
      <div className="page-shell">
        <section className={styles.hero}>
          <article className={styles.heroContent}>
            <p className={styles.eyebrow}>Limpieza profesional</p>
            <h1>
              Servicio de limpieza <span>para empresas y particulares.</span>
            </h1>
            <p>
              Realizamos limpiezas para hogares, oficinas, locales comerciales y empresas en Paso de los Toros,
              Montevideo y Maldonado. Cada presupuesto se arma segun el espacio, la frecuencia y el tipo de servicio
              necesario.
            </p>
            <div className={styles.heroActions}>
              <Link href="/contacto" className={styles.heroPrimary}>
                Solicitar presupuesto
              </Link>
              <Link href="/contacto" className={styles.heroSecondary}>
                Completar formulario
              </Link>
            </div>
          </article>

          <article className={styles.heroMedia}>
            <img src={CLEANING_HERO_IMAGE} alt="" />
            <div className={styles.qualityBadge}>
              <strong>3</strong>
              <p>Zonas de cobertura: Paso de los Toros, Montevideo y Maldonado.</p>
            </div>
          </article>
        </section>

        <section className={styles.curation}>
          <div className={styles.curationHead}>
            <div>
              <h2>Servicios de limpieza a medida</h2>
              <p>
                Coordinamos el trabajo segun el tipo de cliente y las condiciones del lugar. Para cotizar correctamente,
                necesitamos que nos cuentes que espacio hay que limpiar y que resultado esperas.
              </p>
            </div>
            <Link href="/contacto" className={styles.inlineLink}>
              Solicitar presupuesto
            </Link>
          </div>
          <div className={styles.serviceGrid}>
            <article className={styles.serviceCard}>
              <h3>Limpieza para hogares</h3>
              <p>Limpieza general o profunda para casas y apartamentos, ideal para mantenimiento, mudanzas o preparacion de espacios.</p>
            </article>
            <article className={`${styles.serviceCard} ${styles.serviceCardAccent}`}>
              <h3>Limpieza para oficinas y empresas</h3>
              <p>Servicio para oficinas, comercios, locales y espacios de trabajo que necesitan higiene constante y buena presentacion.</p>
            </article>
            <article className={styles.serviceCard}>
              <h3>Limpieza puntual o recurrente</h3>
              <p>Podemos coordinar trabajos por unica vez o servicios periodicos, segun la necesidad del cliente.</p>
            </article>
            <article className={styles.serviceMedia}>
              <img src={CLEANING_OFFICE_IMAGE} alt="" />
              <div>
                <h3>Limpieza de espacios comerciales</h3>
                <p>Atencion para locales, consultorios, areas comunes y otros espacios que requieren orden, limpieza y continuidad.</p>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.trust}>
          <div className={styles.trustMosaic}>
            <img src={CLEANING_DETAIL_IMAGE} alt="" className={styles.mosaicMain} />
            <article className={styles.mosaicCard}>
              <strong>Paso de los Toros, Montevideo y Maldonado</strong>
            </article>
            <article className={styles.mosaicStat}>
              <strong>A medida</strong>
              <p>Presupuesto segun espacio y necesidad</p>
            </article>
            <img src={CLEANING_OFFICE_IMAGE} alt="" className={styles.mosaicSecondary} />
          </div>
          <div className={styles.trustCopy}>
            <h2>Limpieza coordinada con seriedad</h2>
            <ul>
              <li>
                <strong>Presupuesto personalizado</strong>
                <p>Cotizamos segun metros, tipo de espacio, frecuencia y nivel de limpieza requerido.</p>
              </li>
              <li>
                <strong>Para particulares y empresas</strong>
                <p>Atendemos hogares, oficinas, comercios y organizaciones.</p>
              </li>
              <li>
                <strong>Coordinacion clara</strong>
                <p>Te pedimos la informacion necesaria por formulario para responder con una propuesta ajustada.</p>
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.cta}>
          <p className={styles.ctaTag}>Presupuesto personalizado</p>
          <h2>Solicita una cotizacion para tu limpieza</h2>
          <p>Completa el formulario con tus datos, ciudad, tipo de espacio y detalle del servicio que necesitas.</p>
          <Link href="/contacto" className={styles.ctaButton}>
            Ir al formulario
          </Link>
        </section>
      </div>
    </main>
  );
}
