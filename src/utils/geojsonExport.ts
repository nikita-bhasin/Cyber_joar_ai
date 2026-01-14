import { Feature } from '../types';
import * as GeoJSON from 'geojson';

/**
 * Exports all features as a GeoJSON FeatureCollection
 */
export function exportToGeoJSON(features: Feature[]): string {
  const featureCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: features.map((feature) => ({
      type: 'Feature',
      geometry: feature.geometry,
      properties: {
        id: feature.id,
        type: feature.type,
        ...feature.properties,
      },
    })),
  };

  return JSON.stringify(featureCollection, null, 2);
}

/**
 * Downloads a string as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

