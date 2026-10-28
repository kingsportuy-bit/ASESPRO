import type { Metadata } from "next";
import Link from "next/link";

import { Map } from "@/components/map";
import { listPublicProperties } from "@/lib/propertyRepository";
import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { formatPrice } from "@/lib/properties";
import { createPageMetadata, getSiteUrl, SITE_DESCRIPTION, SITE_NAME, serializeJsonLd } from "@/lib/seo";

import styles from "./HomePage.module.css";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Inmobiliaria en Paso de los Toros",
    description: "Alquiler y venta de casas, apartamentos y terrenos en Paso de los Toros, Pueblo Centenario y alrededores. Consulta propiedades y contacta a ASESPRO.",
    path: "/",
  }),
};

const HERO_IMAGE = "/HERO_ASESPRO.png";

export default async function HomePage(): Promise<JSX.Element> {
  const properties = await listPublicProperties();
  const siteUrl = getSiteUrl();
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: SITE_NAME,
        url: `${siteUrl}/`,
        description: SITE_DESCRIPTION,
        logo: `${siteUrl}/asespro-inmobiliaria-horizontal-green.svg`,
        telephone: "+59899715662",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Florencio Sánchez 722",
          addressLocality: "Paso de los Toros",
          addressRegion: "Tacuarembó",
          addressCountry: "UY",
        },
        sameAs: ["https://www.instagram.com/asespro.inmobiliaria/"],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: `${SITE_NAME} Inmobiliaria`,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "es-UY",
      },
    ],
  };
  const featuredPool = properties.filter((property) => property.isFeatured);
  const featured = featuredPool.slice(0, 3);
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationStructuredData) }} />
      <section className={styles.hero}>
        <img src={HERO_IMAGE} alt="" className={styles.heroBg} width="1376" height="752" fetchPriority="high" />
        <div className="hero-inner">
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Inmobiliaria en Paso de los Toros</p>
            <h1 className={styles.heroTitle}>Propiedades en Paso de los Toros y Pueblo Centenario</h1>
            <p className={styles.heroText}>
              Casas, apartamentos y terrenos en alquiler y venta, con atencion personalizada.
            </p>
            <div className={styles.heroActions}>
              <Link href="/alquiler" className={styles.primaryAction}>
                Ver alquileres
              </Link>
              <Link href="/venta" className={styles.secondaryAction}>
                Ver propiedades en venta
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.quickGrid} ${styles.sectionFrame}`}>
        <Link href="/alquiler" className={styles.quickCard}>
          <img src={getPropertyCoverImage("prop-4")} alt="" />
          <div className={styles.quickShade} />
          <div className={styles.quickBody}>
            <h2 className={styles.quickTitle}>Alquileres</h2>
            <p className={styles.quickText}>Casas y apartamentos para vivir en Paso de los Toros, Pueblo Centenario y alrededores.</p>
            <span className={styles.quickLink}>Explorar alquileres</span>
          </div>
        </Link>

        <Link href="/venta" className={styles.quickCard}>
          <img src="/casa-ventas-urbana.png" alt="Casa de ciudad con jardín en venta" />
          <div className={styles.quickShade} />
          <div className={styles.quickBody}>
            <h2 className={styles.quickTitle}>Ventas</h2>
            <p className={styles.quickText}>Oportunidades de compra en casas, apartamentos y terrenos, con asesoramiento para avanzar con seguridad.</p>
            <span className={styles.quickLink}>Explorar ventas</span>
          </div>
        </Link>

        <Link href="https://asespro.com.uy/" target="_blank" rel="noopener noreferrer" className={`${styles.quickCard} ${styles.quickCardWide}`}>
          <img src="/limpieza-empresas-uniforme.webp" alt="Personal de ASESPRO limpiando una oficina" />
          <div className={styles.quickShade} />
          <div className={styles.quickBody}>
            <h2 className={styles.quickTitle}>Limpieza profesional</h2>
            <p className={styles.quickText}>Servicio de limpieza para hogares, oficinas, locales y empresas en Paso de los Toros, Montevideo y Maldonado.</p>
            <span className={styles.quickLink}>Solicitar presupuesto</span>
          </div>
        </Link>
      </section>

      {featured.length > 0 ? (
        <section className={`${styles.featured} ${styles.sectionFrame}`}>
          <div className={styles.featuredHead}>
            <div>
              <p className={styles.featuredEyebrow}>Propiedades destacadas</p>
              <h2>Mira las opciones disponibles</h2>
              <p>Revisa alquileres y ventas cargadas en la web para hacer una preseleccion antes de contactar al agente.</p>
            </div>
            <Link href="/venta" className={styles.secondaryAction}>
              Ver catalogo
            </Link>
          </div>

          <div className={styles.featuredGrid}>
            {featured.map((property) => (
              <article key={property.id} className={styles.featuredCard}>
                <div className={styles.featuredMedia}>
                  <img src={property.photoUrls[0] ?? getPropertyCoverImage(property.id)} alt={property.title} />
                  <span className={styles.badge}>{property.operation}</span>
                </div>
                <div className={styles.featuredInfo}>
                  <p className={styles.featuredPrice}>{formatPrice(property.price, property.priceCurrency)}</p>
                  <h3 className={styles.featuredTitle}>{property.title}</h3>
                  <p className={styles.featuredMeta}>{property.location}</p>
                  <Link href={`/propiedad/${property.id}`} className={styles.detailLink}>
                    Ver detalle
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className={`${styles.process} ${styles.sectionFrame}`}>
        <h2>Un proceso simple para avanzar con confianza</h2>
        <p>La web te permite revisar opciones antes de consultar, asi llegas al contacto con una idea mas clara de lo que estas buscando.</p>
        <div className={styles.steps}>
          <article className={styles.step}>
            <span>1</span>
            <h3>Revisa las propiedades</h3>
            <p>Explora casas, apartamentos y terrenos disponibles segun operacion, zona y presupuesto.</p>
          </article>
          <article className={styles.step}>
            <span>2</span>
            <h3>Hace tu preseleccion</h3>
            <p>Guarda o identifica las opciones que te interesan para consultar con mas claridad.</p>
          </article>
          <article className={styles.step}>
            <span>3</span>
            <h3>Coordinamos contigo</h3>
            <p>Te ayudamos a resolver dudas, coordinar visitas y avanzar con el proceso de alquiler o compra.</p>
          </article>
        </div>
      </section>

      <section className={`${styles.mapTeaser} ${styles.sectionFrame}`}>
            <h2>Explora propiedades por ubicación</h2>
        <p>Ubica rapidamente las opciones disponibles en Paso de los Toros, Pueblo Centenario y alrededores.</p>
        <div className={styles.mapShell}>
          <Map properties={properties} initialCenter={{ lat: -32.822, lng: -56.528 }} initialZoom={13} minZoom={13} maxZoom={18} height={320} />
          <Link href="/mapa" className={styles.mapLockLayer}>
            Click para activar mapa interactivo
          </Link>
          <div className={styles.mapOverlayCard}>
            <strong>Mapa de propiedades</strong>
            <p>Activa la vista completa para revisar zonas y comparar ubicaciones.</p>
            <Link href="/mapa" className={styles.primaryAction}>
              Activar mapa
            </Link>
          </div>
        </div>
      </section>

      <section className={`${styles.trustSection} ${styles.sectionFrame}`}>
        <article className={styles.trustCopy}>
          <h2>Por que contactar a ASESPRO</h2>
          <ul>
            <li>
              <strong>Conocimiento local</strong>
              <p>Trabajamos con propiedades en Paso de los Toros, Pueblo Centenario y zonas cercanas.</p>
            </li>
            <li>
              <strong>Atencion personalizada</strong>
              <p>Te orientamos segun tu presupuesto, tus tiempos y el tipo de propiedad que necesitas.</p>
            </li>
            <li>
              <strong>Apoyo en financiacion</strong>
              <p>Acompanamos consultas de credito hipotecario y contamos con acceso de gestion para evaluar opciones con Santander.</p>
            </li>
          </ul>
        </article>
      </section>

      <section className={`${styles.contactStrip} ${styles.sectionFrame}`}>
        <article className={styles.contactInfo}>
          <h2>Queres consultar por una propiedad?</h2>
          <p>Escribinos con lo que estas buscando y te ayudamos a revisar las opciones disponibles.</p>
          <ul>
            <li>Alquileres y ventas</li>
            <li>Casas, apartamentos y terrenos</li>
            <li>Paso de los Toros, Pueblo Centenario y alrededores</li>
          </ul>
        </article>

        <div className={styles.contactActions}>
          <Link href="/contacto" className={styles.primaryAction}>
            Contactanos
          </Link>
        </div>
      </section>
    </main>
  );
}


