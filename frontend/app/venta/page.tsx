import type { Metadata } from "next";

import { ListingWithViewToggle } from "@/features/property-explorer/ListingWithViewToggle";
import { listPublicPropertiesByOperation } from "@/lib/propertyRepository";

export const metadata: Metadata = {
  title: "Venta",
  description: "Listado de propiedades en venta de ASESPRO con grilla curada y exploracion por mapa.",
};

export default async function VentaPage(): Promise<JSX.Element> {
  const properties = await listPublicPropertiesByOperation("venta");

  return (
    <ListingWithViewToggle
      title="Propiedades en venta"
      description="Descubra una curaduria exclusiva de residencias disenadas bajo altos estandares de arquitectura y confort."
      properties={properties}
      mapTitle="Explora en el mapa"
      mapDescription="Encuentre su proxima inversion en las ubicaciones mas estrategicas."
      operationHint="Filtra por tipo, precio y zona para encontrar la propiedad de venta ideal."
    />
  );
}
