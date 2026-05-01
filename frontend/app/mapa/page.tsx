import type { Metadata } from "next";

import { PropertyExplorer } from "@/features/property-explorer/PropertyExplorer";
import { listPublicProperties } from "@/lib/propertyRepository";

type MapaPageProps = {
  searchParams?: {
    highlight?: string;
  };
};

export const metadata: Metadata = {
  title: "Mapa de propiedades",
  description: "Mapa de casas, apartamentos y terrenos disponibles en Paso de los Toros, Pueblo Centenario y alrededores.",
};

export default async function MapaPage({ searchParams }: MapaPageProps): Promise<JSX.Element> {
  const properties = await listPublicProperties();
  const highlightedPropertyId = searchParams?.highlight;

  return (
    <main>
      <div className="page-shell">
        <PropertyExplorer
          properties={properties}
          title="Explora propiedades por ubicacion"
          hint="Usa filtros y revisa las opciones disponibles en Paso de los Toros, Pueblo Centenario y alrededores."
          showOperationFilter={true}
          highlightedPropertyId={highlightedPropertyId}
        />
      </div>
    </main>
  );
}
