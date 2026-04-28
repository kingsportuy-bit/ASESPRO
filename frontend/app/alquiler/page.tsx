import type { Metadata } from "next";

import { ListingWithViewToggle } from "@/features/property-explorer/ListingWithViewToggle";
import { listPublicPropertiesByOperation } from "@/lib/propertyRepository";

export const metadata: Metadata = {
  title: "Alquiler",
  description: "Listado de propiedades en alquiler de ASESPRO con filtros visuales y acceso a vista por mapa.",
};

export default async function AlquilerPage(): Promise<JSX.Element> {
  const properties = await listPublicPropertiesByOperation("alquiler");

  return (
    <ListingWithViewToggle
      title="Propiedades exclusivas en alquiler"
      description="Una seleccion curada de residencias que definen estandar de vida moderno."
      properties={properties}
      mapTitle="Busqueda interactiva"
      mapDescription="Explora nuestras propiedades directamente en el mapa para encontrar tu zona ideal."
      operationHint="Filtra por tipo, precio y zona para encontrar el alquiler ideal."
    />
  );
}
