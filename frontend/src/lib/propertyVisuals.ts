type PropertyVisual = {
  cover: string;
  gallery: string[];
};

const HOUSE = "/casas-paso-de-los-toros.webp";
const INTERIOR = "/interior-casa-uruguaya.webp";

const FALLBACK_GALLERY = [HOUSE, INTERIOR, HOUSE];

const VISUALS_BY_ID: Record<string, PropertyVisual> = {
  "prop-1": { cover: HOUSE, gallery: FALLBACK_GALLERY },
  "prop-2": { cover: INTERIOR, gallery: FALLBACK_GALLERY },
  "prop-3": { cover: HOUSE, gallery: FALLBACK_GALLERY },
  "prop-4": { cover: HOUSE, gallery: FALLBACK_GALLERY },
  "prop-5": { cover: HOUSE, gallery: FALLBACK_GALLERY },
  "prop-6": { cover: INTERIOR, gallery: FALLBACK_GALLERY },
};

export function getPropertyCoverImage(propertyId: string): string {
  return VISUALS_BY_ID[propertyId]?.cover ?? HOUSE;
}

export function getPropertyGallery(propertyId: string): string[] {
  const gallery = VISUALS_BY_ID[propertyId]?.gallery ?? FALLBACK_GALLERY;
  return gallery.length > 0 ? gallery : FALLBACK_GALLERY;
}
