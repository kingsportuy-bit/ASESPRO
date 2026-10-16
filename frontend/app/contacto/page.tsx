import type { Metadata } from "next";

import { WhatsAppInquiryForm } from "@/components/forms";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { createPageMetadata, getSiteUrl, serializeJsonLd } from "@/lib/seo";

import styles from "./ContactoPage.module.css";

const DEFAULT_WHATSAPP_PHONE = "59899715662";
const INSTAGRAM_URL = "https://www.instagram.com/asespro.inmobiliaria/";

function PhoneIcon(): JSX.Element {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 3.5 9.8 3a1.5 1.5 0 0 1 1.7 1.1l.7 2.8a1.5 1.5 0 0 1-.7 1.7l-1.4.9a14 14 0 0 0 5.4 5.4l.9-1.4a1.5 1.5 0 0 1 1.7-.7l2.8.7a1.5 1.5 0 0 1 1.1 1.7l-.5 2.6a2 2 0 0 1-2 1.6C10 21 3 14 3 5.5a2 2 0 0 1 1.6-2Z" /></svg>;
}

function InstagramIcon(): JSX.Element {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" /><circle cx="12" cy="12" r="4.1" /><circle className={styles.iconDot} cx="17.7" cy="6.5" r="1" /></svg>;
}

function WhatsAppIcon(): JSX.Element {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 11.7a8.1 8.1 0 0 1-12 7.1L4 20l1.2-4A8.1 8.1 0 1 1 20.2 11.7Z" /><path d="M9 8.5c.5 2.5 2.4 4.4 5 5l1-1.1 2 .8c-.4 1.4-1.4 2-2.5 2-2.8-.3-6.3-3.7-6.6-6.5 0-1.1.6-2.2 2-2.5l.8 2L9 8.5Z" /></svg>;
}

export const metadata: Metadata = createPageMetadata({
  title: "Contacto",
  description: "Contactá a ASESPRO por alquileres, ventas y terrenos en Paso de los Toros, Pueblo Centenario y alrededores.",
  path: "/contacto",
});

export default function ContactoPage(): JSX.Element {
  const whatsappPhone = DEFAULT_WHATSAPP_PHONE;
  const siteUrl = getSiteUrl();
  const businessStructuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${siteUrl}/#organization`,
    name: "ASESPRO",
    url: `${siteUrl}/`,
    image: `${siteUrl}/sede-asespro-alta-calidad.png`,
    logo: `${siteUrl}/asespro-inmobiliaria-horizontal-green.svg`,
    telephone: "+59899715662",
    sameAs: [INSTAGRAM_URL],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Florencio Sánchez 722",
      addressLocality: "Paso de los Toros",
      addressRegion: "Tacuarembó",
      addressCountry: "UY",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "19:00",
    },
  };
  const directWaLink = buildWhatsAppUrl(
    whatsappPhone,
    "Hola ASESPRO, quiero consultar por propiedades disponibles.",
  );

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(businessStructuredData) }} />
      <div className="page-shell">
        <section className={styles.hero}>
          <article className={styles.heroText}>
            <h1>Contactanos</h1>
            <p>
              Contanos qué estás buscando y te orientamos. Podemos ayudarte con alquileres, ventas y terrenos.
            </p>
          </article>

          <div className={styles.heroMedia}>
          </div>
        </section>

        <section className={styles.layout}>
          <WhatsAppInquiryForm
            whatsappPhone={whatsappPhone}
            title="Enviar consulta"
            hint="Completa tus datos y el tipo de consulta. Te responderemos para avanzar con la información que necesitas."
            submitLabel="Enviar consulta"
          />

          <aside className={styles.infoGrid}>
            <a href="tel:+59899715662" className={styles.contactCard}>
              <span className={styles.icon}><PhoneIcon /></span>
              <div>
                <p className={styles.cardLabel}>Teléfono</p>
                <strong>Llamanos o escribinos</strong>
                <p>+598 99 715 662</p>
                <p>Lun - Sab, 9:00 - 19:00</p>
              </div>
            </a>

            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className={styles.contactCard}>
              <span className={styles.icon}><InstagramIcon /></span>
              <div>
                <p className={styles.cardLabel}>Instagram</p>
                <strong>Seguinos</strong>
                <p>Propiedades y novedades de Inmobiliaria ASESPRO.</p>
              </div>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </a>

            <a href={directWaLink} target="_blank" rel="noreferrer" className={styles.waBox}>
              <span className={styles.icon}><WhatsAppIcon /></span>
              <div>
                <p className={styles.cardLabel}>Chat directo</p>
                <strong>WhatsApp</strong>
                <p>Escribinos por WhatsApp para consultas inmobiliarias.</p>
              </div>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </a>

            <article className={styles.mapCard}>
              <h2>Nuestra sede</h2>
              <img src="/sede-asespro-alta-calidad.png" alt="Fachada de la sede de ASESPRO en Paso de los Toros" />
              <div className={styles.mapCardBody}>
                <strong>Florencio Sánchez 722</strong>
                <p>Paso de los Toros, Tacuarembó.</p>
              </div>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
