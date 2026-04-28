import type { PropertyListing } from "@/lib/properties";

export const MOCK_PROPERTIES: PropertyListing[] = [
  {
    id: "asespro-alq-001",
    title: "Casa con patio en Paso de los Toros",
    description:
      "Alquiler anual de casa de 3 dormitorios, living amplio y patio con parrillero. Lista para ingresar.",
    location: "Paso de los Toros, Tacuarembo",
    type: "casa",
    operation: "alquiler",
    lat: -32.8164,
    lng: -56.5201,
    price: 1200,
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 126,
    status: "activo",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    photoUrls: [
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=80",
    ],
  },
  {
    id: "asespro-ven-001",
    title: "Apartamento centrico en Durazno",
    description:
      "Venta de apartamento de 2 dormitorios, cocina integrada y balcon al frente, a minutos del centro.",
    location: "Durazno, Uruguay",
    type: "apartamento",
    operation: "venta",
    lat: -33.4132,
    lng: -56.5007,
    price: 119000,
    bedrooms: 2,
    bathrooms: 1,
    areaM2: 81,
    status: "activo",
    videoUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
    photoUrls: [
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1400&q=80",
    ],
  },
];
