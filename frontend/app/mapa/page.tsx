import type { Metadata } from "next";

import { PropertyExplorer } from "@/features/property-explorer/PropertyExplorer";
import { listPublicProperties } from "@/lib/propertyRepository";

type MapaPageProps = {
  searchParams?: {
    highlight?: string;
  };
};

export const metadata: Metadata = {
  title: "Mapa completo",
  description: "Vista completa del mapa de propiedades con filtros.",
};

export default async function MapaPage({ searchParams }: MapaPageProps): Promise<JSX.Element> {
  const properties = await listPublicProperties();
  const highlightedPropertyId = searchParams?.highlight;

  return (
    <main>
      <div className="page-shell">
        <PropertyExplorer
          properties={properties}
          title="Mapa completo de propiedades"
          hint="Usa filtros y explora todas las zonas disponibles."
          showOperationFilter={true}
          highlightedPropertyId={highlightedPropertyId}
        />
      </div>
    </main>
  );
}
