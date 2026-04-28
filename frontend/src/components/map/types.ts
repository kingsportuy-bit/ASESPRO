export type Property = {
  id: string;
  lat: number;
  lng: number;
  price?: number;
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
