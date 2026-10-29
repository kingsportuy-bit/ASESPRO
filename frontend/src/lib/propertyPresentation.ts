import type { PropertyListing } from './properties';

export function propertyDescription(property: PropertyListing): string {
  const bedrooms = property.bedrooms === 0 ? 'monoambiente' : property.bedrooms !== undefined ? `de ${property.bedrooms} ${property.bedrooms === 1 ? 'dormitorio' : 'dormitorios'}` : '';
  const type = { casa: 'Casa', apartamento: 'Apartamento', terreno: 'Terreno', local: 'Local comercial', oficina: 'Oficina', deposito: 'Depósito' }[property.type];
  const bathrooms = property.bathrooms ? ` y ${property.bathrooms} ${property.bathrooms === 1 ? 'baño' : 'baños'}` : '';
  const intro = `${type} ${bedrooms}${bathrooms} en ${property.location}.`.replace(/ +/g, ' ');
  const details = property.description.replace(/\.{2,}/g, '.').trim();
  return `${intro} ${details}`.trim();
}

export function videoPreview(url?: string, frame: 'poster' | 'preview' = 'poster'): string | undefined {
  return url && /^\/api\/panel-web\/media\/web-[a-f0-9-]{36}\/\d+\/video\.mp4$/.test(url) ? url.replace('video.mp4', `${frame}.jpg`) : undefined;
}
