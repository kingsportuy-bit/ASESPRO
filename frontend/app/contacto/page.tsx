import type { Metadata } from "next";

import { WhatsAppInquiryForm } from "@/components/forms";
import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import styles from "./ContactoPage.module.css";

const DEFAULT_WHATSAPP_PHONE = "59898382388";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta a ASESPRO por alquileres, ventas, terrenos o servicios de limpieza. Atencion en Paso de los Toros, Pueblo Centenario, Montevideo y Maldonado.",
};

export default function ContactoPage(): JSX.Element {
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? DEFAULT_WHATSAPP_PHONE;
  const directWaLink = buildWhatsAppUrl(
    whatsappPhone,
    "Hola ASESPRO, quiero consultar por propiedades disponibles o servicios de limpieza.",
  );

  return (
    <main>
      <div className="page-shell">
        <section className={styles.hero}>
          <article className={styles.heroText}>
            <h1>
              Contacta a <span className={styles.accent}>ASESPRO.</span>
            </h1>
            <p>
              Contanos que estas buscando y te orientamos. Podemos ayudarte con alquileres, ventas, terrenos o
              presupuestos de limpieza.
            </p>
          </article>

          <div className={styles.heroMedia}>
            <img src={getPropertyCoverImage("prop-5")} alt="" />
          </div>
        </section>

        <section className={styles.layout}>
          <WhatsAppInquiryForm
            whatsappPhone={whatsappPhone}
            title="Enviar consulta"
            hint="Completa tus datos y el tipo de consulta. Te responderemos para avanzar con la informacion que necesitas."
            submitLabel="Enviar consulta"
          />

          <aside className={styles.infoGrid}>
            <article className={styles.contactCard}>
              <span className={styles.icon}>TEL</span>
              <div>
                <p className={styles.cardLabel}>Telefono</p>
                <strong>Llamanos o escribinos</strong>
                <p>+598 98 382 388</p>
                <p>Lun - Sab, 9:00 - 19:00</p>
              </div>
            </article>

            <article className={styles.contactCard}>
              <span className={styles.icon}>IG</span>
              <div>
                <p className={styles.cardLabel}>Instagram</p>
                <strong>Seguinos</strong>
                <p>Novedades, propiedades y servicios de ASESPRO.</p>
              </div>
            </article>

            <a href={directWaLink} target="_blank" rel="noreferrer" className={styles.waBox}>
              <span className={styles.icon}>CHAT</span>
              <div>
                <p className={styles.cardLabel}>Chat directo</p>
                <strong>WhatsApp Business</strong>
                <p>Escribinos por WhatsApp para consultas inmobiliarias.</p>
              </div>
              <span className={styles.arrow}>-&gt;</span>
            </a>

            <article className={styles.mapCard}>
              <h2>Nuestra sede</h2>
              <img src={getPropertyCoverImage("prop-2")} alt="" />
              <div className={styles.mapCardBody}>
                <strong>Florencio Sanchez 722</strong>
                <p>Paso de los Toros, Tacuarembo.</p>
              </div>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
