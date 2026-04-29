import type { Metadata } from "next";
import Link from "next/link";

import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import styles from "./ServicioLimpiezaPage.module.css";

const DEFAULT_WHATSAPP_PHONE = "59898382388";

export const metadata: Metadata = {
  title: "Servicio de limpieza",
  description: "Solicita el servicio de limpieza para inmuebles con coordinacion directa por WhatsApp.",
};

export default function ServicioLimpiezaPage(): JSX.Element {
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? DEFAULT_WHATSAPP_PHONE;
  const whatsappUrl = buildWhatsAppUrl(
    whatsappPhone,
    "Hola ASESPRO, quiero cotizar un servicio de limpieza para una propiedad.",
  );

  return (
    <main>
      <section className={styles.hero}>
        <article className={styles.heroContent}>
          <p className={styles.eyebrow}>Excelencia en cada rincon</p>
          <h1>
            Limpieza profesional <span>para espacios de autor.</span>
          </h1>
          <p>
            Elevamos el estandar de higiene para residencias premium y entornos corporativos con foco en detalle,
            discrecion y puntualidad.
          </p>
          <div className={styles.heroActions}>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.heroPrimary}>
              Agendar servicio
            </a>
            <Link href="/contacto" className={styles.heroSecondary}>
              Ver portafolio
            </Link>
          </div>
        </article>

        <article className={styles.heroMedia}>
          <img src={getPropertyCoverImage("prop-3")} alt="" />
          <div className={styles.qualityBadge}>
            <strong>100%</strong>
            <p>Garantia de satisfaccion y discrecion absoluta.</p>
          </div>
        </article>
      </section>

      <section className={styles.curation}>
        <div className={styles.curationHead}>
          <div>
            <h2>Curaduria de higiene profesional</h2>
            <p>No solo limpiamos, preservamos la integridad de cada espacio con metodologia premium.</p>
          </div>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.inlineLink}>
            Ver todos los servicios
          </a>
        </div>
        <div className={styles.serviceGrid}>
          <article className={styles.serviceCard}>
            <h3>Limpieza residencial premium</h3>
            <p>Tratamientos para marmol, madera natural y cristales de alta gama.</p>
          </article>
          <article className={`${styles.serviceCard} ${styles.serviceCardAccent}`}>
            <h3>Compromiso eco-luxe</h3>
            <p>Insumos biodegradables y protocolos que cuidan la salud y los materiales.</p>
          </article>
          <article className={styles.serviceCard}>
            <h3>Entornos corporativos</h3>
            <p>Oficinas y espacios comerciales con estandar ejecutivo de presentacion.</p>
          </article>
          <article className={styles.serviceMedia}>
            <img src={getPropertyCoverImage("prop-4")} alt="" />
            <div>
              <h3>Limpieza de fin de obra</h3>
              <p>Dejamos cada propiedad lista para habitar o exhibir.</p>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.trust}>
        <div className={styles.trustMosaic}>
          <img src={getPropertyCoverImage("prop-5")} alt="" className={styles.mosaicMain} />
          <article className={styles.mosaicCard}>
            <strong>Certificacion de calidad ISO</strong>
          </article>
          <article className={styles.mosaicStat}>
            <strong>15+</strong>
            <p>Anos de confianza</p>
          </article>
          <img src={getPropertyCoverImage("prop-2")} alt="" className={styles.mosaicSecondary} />
        </div>
        <div className={styles.trustCopy}>
          <h2>Por que confiar en ASESPRO</h2>
          <ul>
            <li>
              <strong>Profesionalismo absoluto</strong>
              <p>Personal capacitado bajo protocolos de hospitalidad premium.</p>
            </li>
            <li>
              <strong>Confianza y discrecion</strong>
              <p>Operamos con total reserva y respeto por la privacidad del cliente.</p>
            </li>
            <li>
              <strong>Filosofia eco-responsable</strong>
              <p>Reducimos quimicos agresivos con tecnologia de limpieza sostenible.</p>
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.cta}>
        <p className={styles.ctaTag}>Disponibilidad inmediata</p>
        <h2>Solicite su presupuesto personalizado via WhatsApp</h2>
        <p>Atencion directa y agendamiento rapido para coordinar su proxima sesion de limpieza.</p>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.ctaButton}>
          Contactar por WhatsApp
        </a>
      </section>
    </main>
  );
}
