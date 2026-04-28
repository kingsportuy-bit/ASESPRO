import type { Metadata } from "next";
import Link from "next/link";

import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { formatPrice } from "@/lib/properties";
import { listPublicPropertiesByOperation } from "@/lib/propertyRepository";

import styles from "../ListingPage.module.css";

export const metadata: Metadata = {
  title: "Alquiler",
  description: "Listado de propiedades en alquiler de ASESPRO con filtros visuales y acceso a vista por mapa.",
};

export default async function AlquilerPage(): Promise<JSX.Element> {
  const properties = await listPublicPropertiesByOperation("alquiler");
  const cards = Array.from({ length: 6 }, (_, index) => properties[index % properties.length]);

  return (
    <main>
      <section className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Propiedades exclusivas en alquiler</h1>
            <p className={styles.description}>Una seleccion curada de residencias que definen estandar de vida moderno.</p>
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
              <option value="1">Hasta USD 1.000</option>
              <option value="2">Hasta USD 2.000</option>
              <option value="3">Hasta USD 3.000</option>
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
            Filtrar
          </button>
        </div>
      </section>

      <section className={styles.grid}>
        {cards.map((property, index) => (
          <article className={styles.card} key={`${property.id}-${index}`}>
            <div className={styles.cardMedia}>
              <img src={getPropertyCoverImage(property.id)} alt="" />
              <div className={styles.badgeRow}>
                <span className={styles.badge}>{property.operation}</span>
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

      <div className={styles.pagination}>
        <button type="button" className={styles.pagerButton}>
          {"<"}
        </button>
        <span className={`${styles.pageNumber} ${styles.pageNumberActive}`}>1</span>
        <span className={styles.pageNumber}>2</span>
        <span className={styles.pageNumber}>3</span>
        <button type="button" className={styles.pagerButton}>
          {">"}
        </button>
      </div>

      <section className={styles.mapSection}>
        <div className={styles.mapHead}>
          <div>
            <h2>Busqueda interactiva</h2>
            <p>Explora nuestras propiedades directamente en el mapa para encontrar tu zona ideal.</p>
          </div>
        </div>
        <div className={styles.mapCta}>
          <div className={styles.mapCtaCard}>
            <strong>Mapa de propiedades</strong>
            <p>Activa vista completa para filtrar por area, valor y tipo de residencia.</p>
            <Link href="/venta" className={styles.filterAction}>
              Activar vista de mapa
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
