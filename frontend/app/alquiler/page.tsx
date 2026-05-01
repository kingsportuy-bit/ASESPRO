import type { Metadata } from "next";

import { ListingWithViewToggle } from "@/features/property-explorer/ListingWithViewToggle";
import { listPublicPropertiesByOperation } from "@/lib/propertyRepository";

export const metadata: Metadata = {
  title: "Alquileres en Paso de los Toros",
  description:
    "Casas y apartamentos en alquiler en Paso de los Toros, Pueblo Centenario y alrededores. Revisa propiedades disponibles y consulta por WhatsApp.",
};

export default async function AlquilerPage(): Promise<JSX.Element> {
  const properties = await listPublicPropertiesByOperation("alquiler");

  return (
    <ListingWithViewToggle
      title="Alquileres en Paso de los Toros y alrededores"
      description="Consulta casas y apartamentos disponibles para alquilar. Revisa ubicacion, precio y caracteristicas antes de contactar al agente."
      properties={properties}
      mapTitle="Busca alquileres por zona"
      mapDescription="Explora las propiedades disponibles en el mapa y compara ubicaciones antes de coordinar una visita."
      operationHint="Filtra por tipo de propiedad, precio y zona para encontrar opciones que se ajusten a lo que necesitas."
    />
  );
}
