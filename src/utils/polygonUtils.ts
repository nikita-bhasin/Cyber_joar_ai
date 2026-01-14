import * as turf from '@turf/turf';
import { FeatureType } from '../types';
import type { Feature, Polygon } from 'geojson';

/**
 * Checks if a feature type is a polygon type (subject to overlap rules)
 */
export function isPolygonType(type: FeatureType): boolean {
  return type === 'polygon' || type === 'rectangle' || type === 'circle';
}

/**
 * Converts a GeoJSON geometry to a Turf Polygon for spatial operations
 * Handles Circle and Rectangle by converting them to polygons
 */
export function geometryToPolygon(geometry: GeoJSON.Geometry): Feature<Polygon> | null {
  if (geometry.type === 'Polygon') {
    return turf.polygon(geometry.coordinates);
  }

  // Circles are now stored as Polygons, so this case is handled above

  return null;
}

/**
 * Checks if two polygon features overlap
 */
export function doPolygonsOverlap(
  geom1: GeoJSON.Geometry,
  geom2: GeoJSON.Geometry
): boolean {
  const poly1 = geometryToPolygon(geom1);
  const poly2 = geometryToPolygon(geom2);

  if (!poly1 || !poly2) return false;

  try {
    // Check if polygons intersect
    return turf.intersect(poly1, poly2) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if polygon1 fully encloses polygon2
 */
export function doesPolygonEnclose(
  geom1: GeoJSON.Geometry,
  geom2: GeoJSON.Geometry
): boolean {
  const poly1 = geometryToPolygon(geom1);
  const poly2 = geometryToPolygon(geom2);

  if (!poly1 || !poly2) return false;

  try {
    // Check if poly2 is completely inside poly1
    return turf.booleanContains(poly1, poly2);
  } catch (error) {
    return false;
  }
}

/**
 * Auto-trims a new polygon by removing overlapping areas with existing polygons
 * Returns the trimmed polygon geometry, or null if trimming results in invalid geometry
 */
export function trimPolygonOverlap(
  newGeometry: GeoJSON.Geometry,
  existingGeometries: GeoJSON.Geometry[]
): GeoJSON.Geometry | null {
  let currentPoly = geometryToPolygon(newGeometry);
  if (!currentPoly) return null;

  try {
    // Subtract overlapping areas from existing polygons
    for (const existingGeom of existingGeometries) {
      const existingPoly = geometryToPolygon(existingGeom);
      if (!existingPoly) continue;

      // Check if they overlap
      const intersection = turf.intersect(currentPoly, existingPoly);
      if (intersection) {
        // Subtract the intersection from the new polygon
        const difference = turf.difference(currentPoly, existingPoly);
        if (difference && difference.geometry.type === 'Polygon') {
          currentPoly = difference as any;
        } else if (difference && difference.geometry.type === 'MultiPolygon') {
          // If result is MultiPolygon, take the largest polygon
          const multiPoly = difference as any;
          const polygons: any[] = multiPoly.geometry.coordinates.map((coords: any) =>
            turf.polygon(coords)
          );
          // Find the largest polygon by area
          const largest = polygons.reduce((max: any, poly: any) => {
            const maxArea = turf.area(max);
            const polyArea = turf.area(poly);
            return polyArea > maxArea ? poly : max;
          });
          currentPoly = largest;
        } else {
          // If difference results in nothing, return null
          return null;
        }
      }
    }

    // Validate the result
    if (!currentPoly || !currentPoly.geometry) return null;

    // Check if the polygon is valid and has sufficient area
    const area = turf.area(currentPoly);
    if (area < 0.0001) return null; // Too small to be meaningful

    return currentPoly.geometry;
  } catch (error) {
    console.error('Error trimming polygon overlap:', error);
    return null;
  }
}

/**
 * Generates a unique ID for features
 */
export function generateFeatureId(): string {
  return `feature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gets a color for a feature type
 */
export function getFeatureColor(type: FeatureType): string {
  const colors: Record<FeatureType, string> = {
    polygon: '#3b82f6',
    rectangle: '#10b981',
    circle: '#f59e0b',
    linestring: '#ef4444',
  };
  return colors[type] || '#6b7280';
}

