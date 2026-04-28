import type { Metadata } from "next";
import Link from "next/link";

import { Map } from "@/components/map";
import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { formatPrice } from "@/lib/properties";
import { listPublicPropertiesByOperation } from "@/lib/propertyRepository";

import styles from "../ListingPage.module.css";

export const metadata: Metadata = {
  title: "Venta",
  description: "Listado de propiedades en venta de ASESPRO con grilla curada y exploracion por mapa.",
};

export default async function VentaPage(): Promise<JSX.Element> {
  const properties = await listPublicPropertiesByOperation("venta");
  const cards = Array.from({ length: 6 }, (_, index) => properties[index % properties.length]);

  return (
    <main>
      <section className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Propiedades en venta</h1>
            <p className={styles.description}>
              Descubra una curaduria exclusiva de residencias disenadas bajo altos estandares de arquitectura y confort.
            </p>
          </div>
          <div className={styles.viewSwitch}>
            <button type="button" className={`${styles.viewBtn} ${styles.viewBtnActive}`}>
              Cuadricula
            </button>
            <button type="button" className={styles.viewBtn}>
              Mapa
            </button>
          </div>
        </div>

        <div className={styles.filterRow}>
          <label className={styles.filterField}>
            <span>Tipo de propiedad</span>
            <select defaultValue="all">
              <option value="all">Todos los tipos</option>
              <option value="casa">Casa</option>
              <option value="apartamento">Apartamento</option>
              <option value="terreno">Terreno</option>
            </select>
          </label>

          <label className={styles.filterField}>
            <span>Rango de precio</span>
            <select defaultValue="all">
              <option value="all">Cualquier precio</option>
              <option value="1">Hasta USD 100.000</option>
              <option value="2">Hasta USD 250.000</option>
              <option value="3">Hasta USD 500.000</option>
            </select>
          </label>

          <label className={styles.filterField}>
            <span>Ubicacion</span>
            <select defaultValue="all">
              <option value="all">Todas las zonas</option>
              <option value="paso">Paso de los Toros</option>
              <option value="centenario">Centenario</option>
            </select>
          </label>

          <button type="button" className={styles.filterAction}>
            Mas filtros
          </button>
        </div>
      </section>

      <section className={styles.grid}>
        {cards.map((property, index) => (
          <article className={styles.card} key={`${property.id}-${index}`}>
            <div className={styles.cardMedia}>
              <img src={getPropertyCoverImage(property.id)} alt="" />
              <div className={styles.badgeRow}>
                <span className={styles.badge}>Oportunidad</span>
                <span className={styles.badge}>{property.type}</span>
              </div>
              <span className={styles.heart}>Fav</span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.titleRow}>
                <h2 className={styles.cardTitle}>{property.title}</h2>
                <p className={styles.cardPrice}>{formatPrice(property.price)}</p>
              </div>
              <p className={styles.cardLocation}>{property.location}</p>
              <p className={styles.cardMeta}>
                <span>{property.bedrooms ?? "--"} dorm</span>
                <span>{property.bathrooms ?? "--"} banos</span>
                <span>{property.areaM2 ? `${property.areaM2} m2` : "N/D"}</span>
              </p>
              <Link href={`/propiedad/${property.id}`} className={styles.cardLink}>
                Ver detalle
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.mapSection}>
        <div className={styles.mapHead}>
          <div>
            <h2>Explora en el mapa</h2>
            <p>Encuentre su proxima inversion en las ubicaciones mas estrategicas.</p>
          </div>
          <Link href="/contacto" className={styles.cardLink}>
            Ver pantalla completa
          </Link>
        </div>
        <div className={styles.mapFrame}>
          <Map properties={properties} initialCenter={{ lat: -32.8167, lng: -56.5167 }} initialZoom={10} height={420} />
        </div>
      </section>
    </main>
  );
}
