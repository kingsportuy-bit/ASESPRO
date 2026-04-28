import type { Metadata } from "next";
import Link from "next/link";

import { Map } from "@/components/map";
import { listPublicProperties } from "@/lib/propertyRepository";
import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { formatPrice } from "@/lib/properties";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import styles from "./HomePage.module.css";

export const metadata: Metadata = {
  title: "Inicio",
  description: "Explora propiedades de ASESPRO con busqueda por mapa, filtros y contacto por WhatsApp.",
};

const HERO_IMAGE = "/HERO_ASESPRO.png";

export default async function HomePage(): Promise<JSX.Element> {
  const properties = await listPublicProperties();
  const featured = properties.slice(0, 3);
  const whatsappUrl = buildWhatsAppUrl(
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "59800000000",
    "Hola ASESPRO, quiero recibir opciones de propiedades.",
  );

  return (
    <main>
      <section className={styles.hero}>
        <img src={HERO_IMAGE} alt="" className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Curaduria Inmobiliaria</p>
          <h1 className={styles.heroTitle}>Encontra tu proximo hogar con confianza y criterio real.</h1>
          <p className={styles.heroText}>
            Descubri propiedades seleccionadas para alquiler y venta, con una experiencia visual clara y contacto
            directo por WhatsApp.
          </p>
          <div className={styles.heroActions}>
            <Link href="/alquiler" className={styles.primaryAction}>
              Ver alquileres
            </Link>
            <Link href="/contacto" className={styles.secondaryAction}>
              Contactar por WhatsApp
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.quickGrid}>
        <Link href="/alquiler" className={styles.quickCard}>
          <img src={getPropertyCoverImage("prop-4")} alt="" />
          <div className={styles.quickShade} />
          <div className={styles.quickBody}>
            <h2 className={styles.quickTitle}>Alquileres</h2>
            <p className={styles.quickText}>Descubri residencias listas para renta en ubicaciones premium.</p>
            <span className={styles.quickLink}>Explorar alquiler</span>
          </div>
        </Link>

        <Link href="/venta" className={styles.quickCard}>
          <img src={getPropertyCoverImage("prop-2")} alt="" />
          <div className={styles.quickShade} />
          <div className={styles.quickBody}>
            <h2 className={styles.quickTitle}>Ventas</h2>
            <p className={styles.quickText}>Inversiones curadas con alto potencial y respaldo profesional.</p>
            <span className={styles.quickLink}>Explorar ventas</span>
          </div>
        </Link>
      </section>

      <section className={styles.featured}>
        <div className={styles.featuredHead}>
          <div>
            <p className={styles.eyebrow}>Seleccion Curada</p>
            <h2>Propiedades destacadas</h2>
          </div>
          <Link href="/venta" className={styles.secondaryAction}>
            Ver catalogo completo
          </Link>
        </div>

        <div className={styles.featuredGrid}>
          {featured.map((property) => (
            <article key={property.id} className={styles.featuredCard}>
              <div className={styles.featuredMedia}>
                <img src={getPropertyCoverImage(property.id)} alt="" />
                <span className={styles.badge}>{property.operation}</span>
              </div>
              <div className={styles.featuredInfo}>
                <p className={styles.featuredPrice}>{formatPrice(property.price)}</p>
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

      <section className={styles.process}>
        <h2>Un proceso disenado para tu tranquilidad</h2>
        <p>Guiamos cada decision con metodo curado, claridad y acompanamiento profesional.</p>
        <div className={styles.steps}>
          <article className={styles.step}>
            <span>1</span>
            <h3>Elegi una propiedad</h3>
            <p>Explora nuestro catalogo y selecciona la opcion que mejor encaja con tus objetivos.</p>
          </article>
          <article className={styles.step}>
            <span>2</span>
            <h3>Contactanos por WhatsApp</h3>
            <p>Coordinamos detalles en minutos con respuesta personalizada y accion directa.</p>
          </article>
          <article className={styles.step}>
            <span>3</span>
            <h3>Coordinamos la visita</h3>
            <p>Agendamos en base a tu preferencia para avanzar con total claridad.</p>
          </article>
        </div>
      </section>

      <section className={styles.cleaningBanner}>
        <div className={styles.cleaningCopy}>
          <p className={styles.eyebrow}>Mas que inmobiliaria</p>
          <h2>Servicio de limpieza premium</h2>
          <p>Preparamos cada propiedad para mostrarla impecable y maximizar su valor percibido.</p>
          <div className={styles.cleaningActions}>
            <Link href="/servicio-limpieza" className={styles.primaryAction}>
              Solicitar servicio
            </Link>
            <Link href="/servicio-limpieza" className={styles.ghostAction}>
              Saber mas
            </Link>
          </div>
        </div>
        <img src={getPropertyCoverImage("prop-3")} alt="" className={styles.cleaningImage} />
      </section>

      <section className={styles.mapTeaser}>
        <h2>Explora por ubicacion</h2>
        <p>Recorre propiedades y oportunidades directamente en el mapa.</p>
        <div className={styles.mapShell}>
          <Map properties={properties} initialCenter={{ lat: -32.822, lng: -56.528 }} initialZoom={10} minZoom={10} maxZoom={13} height={320} />
          <div className={styles.mapOverlayCard}>
            <strong>Mapa de propiedades</strong>
            <p>Activa vista completa y descubre zonas clave.</p>
            <Link href="/venta" className={styles.primaryAction}>
              Activar mapa
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.trustSection}>
        <article className={styles.trustCopy}>
          <h2>Por que confiar en nosotros</h2>
          <ul>
            <li>
              <strong>Profesionalismo inmobiliario</strong>
              <p>Curaduria y acompanamiento completo de principio a fin.</p>
            </li>
            <li>
              <strong>Servicio personalizado</strong>
              <p>Opciones recomendadas segun tus tiempos, objetivos y presupuesto.</p>
            </li>
            <li>
              <strong>Asesoria financiera</strong>
              <p>Evaluamos cada oportunidad con criterio de riesgo y retorno.</p>
            </li>
          </ul>
        </article>
        <article className={styles.trustMedia}>
          <img src={getPropertyCoverImage("prop-5")} alt="" />
        </article>
      </section>

      <section className={styles.contactStrip}>
        <article className={styles.contactInfo}>
          <h2>Listo para el siguiente paso?</h2>
          <p>Estamos aqui para ayudarte a encontrar el lugar que estas buscando.</p>
          <ul>
            <li>+598 99 123 456</li>
            <li>info@asespro.com</li>
            <li>Av. Italia 1545, Montevideo</li>
          </ul>
        </article>

        <article className={styles.contactFormMock}>
          <label>
            Nombre completo
            <input type="text" placeholder="Tu nombre" />
          </label>
          <label>
            Correo electronico
            <input type="email" placeholder="tu@email.com" />
          </label>
          <label>
            Mensaje
            <textarea placeholder="Cuentanos que estas buscando." />
          </label>
          <div className={styles.contactActions}>
            <Link href="/contacto" className={styles.primaryAction}>
              Enviar mensaje
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.secondaryAction}>
              Contactar por WhatsApp
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}

