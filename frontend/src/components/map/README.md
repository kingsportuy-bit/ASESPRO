# Reusable Property Map Component

Production-oriented Leaflet component for React / Next.js apps.

## Files

- `Map.tsx`: main reusable component
- `PropertyMarker.tsx`: custom marker renderer
- `hooks/useLeafletMap.ts`: map lifecycle + viewport events
- `hooks/usePropertyMarkers.ts`: marker sync layer (no fetch, data from props)
- `types.ts`: shared types

## Install dependencies

```bash
npm install leaflet
npm install -D @types/leaflet
```

## Quick usage

```tsx
import { Map, type Property, type MapBounds } from "@/components/map";

const properties: Property[] = [
  { id: "p1", lat: -34.90, lng: -56.16, price: 220000 },
  { id: "p2", lat: -34.88, lng: -56.14, price: 310000 },
];

export function PropertyMapSection() {
  const handleBounds = (bounds: MapBounds) => {
    // Parent decides if/when to fetch with these bounds.
    console.log("bounds", bounds);
  };

  return (
    <Map
      properties={properties}
      onBoundsChange={handleBounds}
      onMarkerClick={(property) => console.log("clicked", property)}
      initialCenter={{ lat: -34.9011, lng: -56.1645 }}
      initialZoom={11}
      height={560}
    />
  );
}
```

## Notes

- The map does not fetch data.
- Viewport changes are emitted through `onBoundsChange`.
- Marker clicks are emitted through `onMarkerClick`.
- Clustering is intentionally separated as a future enhancement point in `usePropertyMarkers.ts`.
