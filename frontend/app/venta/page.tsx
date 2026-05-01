import type { Metadata } from "next";

import { ListingWithViewToggle } from "@/features/property-explorer/ListingWithViewToggle";
import { listPublicPropertiesByOperation } from "@/lib/propertyRepository";

export const metadata: Metadata = {
  title: "Propiedades en venta en Paso de los Toros",
  description:
    "Casas, apartamentos y terrenos en venta en Paso de los Toros, Pueblo Centenario y alrededores. Consulta opciones y asesoramiento.",
};

export default async function VentaPage(): Promise<JSX.Element> {
  const properties = await listPublicPropertiesByOperation("venta");

  return (
    <ListingWithViewToggle
      title="Propiedades en venta en Paso de los Toros y Pueblo Centenario"
      description="Encuentra casas, apartamentos y terrenos en venta, con informacion clara y asesoramiento para avanzar con una decision segura."
      properties={properties}
      mapTitle="Explora ventas por ubicacion"
      mapDescription="Revisa las propiedades en el mapa para evaluar zona, entorno y cercania a puntos de interes."
      operationHint="Filtra por tipo, precio y zona para comparar oportunidades de compra."
    />
  );
}
