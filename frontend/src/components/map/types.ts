export type Property = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  location?: string;
  type?: string;
  price?: number;
  priceCurrency?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaM2?: number;
  photoUrls?: string[];
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type LatLng = {
  lat: number;
  lng: number;
};

export type MapProps = {
  properties: Property[];
  highlightedPropertyId?: string;
  onBoundsChange?: (bounds: MapBounds) => void;
  onMarkerClick?: (property: Property) => void;
  initialCenter?: LatLng;
  initialZoom?: number;
  tileUrl?: string;
  tileAttribution?: string;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
  height?: number | string;
};
