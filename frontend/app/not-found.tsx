import Link from "next/link";

import { SiteHeader } from "@/components/layout";

import "./status-pages.css";

export default function NotFoundPage(): JSX.Element {
  return (
    <main>
      <SiteHeader
        title="Pagina no encontrada"
        subtitle="La ruta que buscabas no existe o fue movida."
        links={[
          { href: "/", label: "Inicio" },
          { href: "/alquiler", label: "Alquiler" },
          { href: "/venta", label: "Venta" },
        ]}
      />

      <section className="status-card">
        <h2>Error 404</h2>
        <p>Volve al inicio o entra al listado para seguir explorando propiedades.</p>
        <Link href="/" className="status-link">
          Ir al inicio
        </Link>
      </section>
    </main>
  );
}
