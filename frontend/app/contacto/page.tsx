import type { Metadata } from "next";

import { WhatsAppInquiryForm } from "@/components/forms";
import { getPropertyCoverImage } from "@/lib/propertyVisuals";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import styles from "./ContactoPage.module.css";

const DEFAULT_WHATSAPP_PHONE = "59800000000";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacta a ASESPRO por WhatsApp para recibir opciones de alquiler, venta o consultas generales.",
};

export default function ContactoPage(): JSX.Element {
  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? DEFAULT_WHATSAPP_PHONE;
  const directWaLink = buildWhatsAppUrl(
    whatsappPhone,
    "Hola ASESPRO, quiero una asesoria personalizada sobre propiedades.",
  );

  return (
    <main>
      <section className={styles.hero}>
        <article className={styles.heroText}>
          <h1>
            Conversemos sobre su proximo <span className={styles.accent}>legado.</span>
          </h1>
          <p>
            Nuestra curaduria arquitectonica merece una atencion personalizada. Estamos aqui para guiarle en cada paso
            de su inversion inmobiliaria.
          </p>
        </article>

        <div className={styles.heroMedia}>
          <img src={getPropertyCoverImage("prop-5")} alt="" />
        </div>
      </section>

      <section className={styles.layout}>
        <WhatsAppInquiryForm
          whatsappPhone={whatsappPhone}
          title="Formulario de consulta"
          hint="Comparta sus datos y abrimos WhatsApp con su solicitud lista para enviar."
          submitLabel="Enviar solicitud"
        />

        <aside className={styles.infoGrid}>
          <article className={styles.contactCard}>
            <span className={styles.icon}>TEL</span>
            <div>
              <p className={styles.cardLabel}>Llamenos</p>
              <strong>+598 2200 4400</strong>
              <p>Lun - Vie, 9:00 - 18:00</p>
            </div>
          </article>

          <article className={styles.contactCard}>
            <span className={styles.icon}>MAIL</span>
            <div>
              <p className={styles.cardLabel}>Escribanos</p>
              <strong>contacto@asespro.com</strong>
              <p>Respuesta en menos de 24h.</p>
            </div>
          </article>

          <a href={directWaLink} target="_blank" rel="noreferrer" className={styles.waBox}>
            <span className={styles.icon}>CHAT</span>
            <div>
              <p className={styles.cardLabel}>Chat directo</p>
              <strong>WhatsApp Business</strong>
            </div>
            <span className={styles.arrow}>-&gt;</span>
          </a>

          <article className={styles.mapCard}>
            <h2>Nuestra sede</h2>
            <img src={getPropertyCoverImage("prop-2")} alt="" />
            <div className={styles.mapCardBody}>
              <strong>Centro corporativo Plaza Roble</strong>
              <p>Edificio El Portico, Piso 4, Escazu, San Jose.</p>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
