import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Map } from "@/components/map";
import { getPublicPropertyById } from "@/lib/propertyRepository";
import { buildPropertyWhatsAppUrl, formatOperationLabel, formatPrice, propertyMatchesOperation, type PropertyAmenityKey } from "@/lib/properties";
import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { createPageMetadata } from "@/lib/seo";
import { PropertyFacts } from "@/components/properties/PropertyFacts";
import { propertyDescription } from "@/lib/propertyPresentation";
import { PropertyMediaGallery } from "./PropertyMediaGallery";

import styles from "./PropertyDetailPage.module.css";

type PropertyDetailPageProps = {
  params: {
    id: string;
  };
};

const DEFAULT_WHATSAPP_PHONE = "59899715662";

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const property = await getPublicPropertyById(params.id);

  if (!property) {
    return {
      title: "Propiedad no encontrada",
      description: "La propiedad solicitada no esta disponible en ASESPRO.",
      robots: { index: false, follow: false },
    };
  }

  const description = `${property.location}. Revisa datos, fotos y coordiná una visita con ASESPRO. ${property.description}`.slice(0, 160);
  const image = property.photoUrls.find((photo) => typeof photo === "string" && photo.trim().length > 0) ?? getPropertyCoverImage(property.id);

  return createPageMetadata({
    title: property.title,
    description,
    path: `/propiedad/${encodeURIComponent(params.id)}`,
    image,
    imageAlt: property.title,
  });
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps): Promise<JSX.Element> {
  const property = await getPublicPropertyById(params.id);

  if (!property) {
    notFound();
  }

  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || DEFAULT_WHATSAPP_PHONE;
  const whatsappUrl = buildPropertyWhatsAppUrl(property, phone);
  const fallbackImage = getPropertyCoverImage(property.id);
  const gallery = property.photoUrls.filter((photo) => typeof photo === "string" && photo.trim().length > 0);
  const galleryWithFallback = gallery.length > 0 ? gallery : [fallbackImage];
  const videoUrl = property.videoUrl;
  const priceLabel = propertyMatchesOperation(property, "alquiler") ? "Precio de alquiler" : "Precio de venta";
  const features = Object.entries(property.amenities||{}).filter(([,value])=>value).map(([key])=>({garage:'Cochera',patio:'Patio',laundry:'Lavadero',living:'Living / estar',dining:'Comedor',kitchen:'Cocina',balcony:'Balcón',security:'Seguridad',pool:'Piscina'}[key]||key));

  return (
    <main>
      <div className="page-shell">
        <PropertyMediaGallery
          title={property.title}
          location={property.location}
          photos={galleryWithFallback}
          media={property.media}
          videoUrl={videoUrl}
          fallbackImage={fallbackImage}
          facts={<PropertyFacts property={property} />}
        />

        <section className={styles.content}>
          <article className={styles.article}>
          <h2 className={styles.sectionTitle}>Conocé esta propiedad</h2>
          <p className={styles.commercialDescription}>{propertyDescription(property)}</p>
          <p>Consultanos por disponibilidad, condiciones y coordinación de una visita.</p>
          <h2 className={styles.sectionTitle}>Lo que tiene</h2>
          <ul className={styles.amenities}>{features.map(label=><li key={label}><span aria-hidden="true">✓</span>{label}</li>)}</ul>
          <dl className={styles.specs}>
            <div><dt>Tipo de propiedad</dt><dd>{property.type}</dd></div>
            {property.bedrooms!==undefined&&<div><dt>Dormitorios</dt><dd>{property.bedrooms===0?'Monoambiente':property.bedrooms}</dd></div>}
            {property.bathrooms!==undefined&&<div><dt>Baños</dt><dd>{property.bathrooms}</dd></div>}
            {property.areaM2!==undefined&&<div><dt>Superficie</dt><dd>{property.areaM2} m²</dd></div>}
          </dl>

          <h2 className={styles.sectionTitle}>{property.approximateRadius ? 'Zona aproximada' : 'Ubicación'}</h2>
          <p>{property.location}</p>
          {property.approximateRadius && <p>El círculo indica la zona aproximada. La dirección se coordina con el operador.</p>}

          <div className={styles.mapWrap} role="region" aria-label="Ubicación de la propiedad en el mapa">
            <Map
              properties={[
                {
                  id: property.id,
                  lat: property.lat,
                  lng: property.lng,
                  price: property.price,
                  approximateRadius: property.approximateRadius,
                  hidePrice: property.hidePrice,
                  title: property.title,
                  location: property.location,
                  photoUrls: property.photoUrls,
                },
              ]}
              highlightedPropertyId={property.id}
              initialCenter={{ lat: property.lat, lng: property.lng }}
              initialZoom={14}
              minZoom={13}
              maxZoom={18}
              height={360}
            />
            <a href={`/mapa?highlight=${property.id}`} className={styles.mapLockLayer}>
              Click para abrir vista mapa
            </a>
            <a href={`/mapa?highlight=${property.id}`} className={styles.mapFullButton}>
              Ver mapa completo
            </a>
          </div>
          </article>

          <aside className={styles.aside}>
            {!property.hidePrice && <><p className={styles.priceLabel}>{priceLabel}</p>
            <h3 className={styles.price}>{formatPrice(property.price, property.priceCurrency)}</h3></>}
            <img className={styles.contactLogo} src="/asespro-inmobiliaria-horizontal-green.svg" alt="ASESPRO Inmobiliaria"/>
            <h2>¿La vemos?</h2><p>Conversá con nosotros por las condiciones y coordiná tu visita.</p>
            <div className={styles.asideActions}><a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.primaryAction}>Coordinar visita →</a>{videoUrl&&<a href="#video" className={styles.secondaryAction}>▷ Primero, ver el recorrido</a>}</div>

            <p className={styles.refCode}>Referencia: {property.id.toUpperCase()}</p>
          </aside>
        </section>
      </div>
      <div className={styles.mobileContact}>{videoUrl&&<a href="#video" className={styles.secondaryAction}>▷ Video</a>}<a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.primaryAction}>Coordinar visita</a></div>
    </main>
  );
}


