/**
 * Dynamic configuration for maximum shapes per type
 * Easily adjustable - modify these values to change limits
 */
export const MAX_SHAPES_CONFIG: Record<string, number> = {
  polygon: 10,
  rectangle: 5,
  circle: 5,
  linestring: 20, // LineStrings can overlap, so higher limit
};

// Map center coordinates (default: center of the world)
export const DEFAULT_MAP_CENTER: [number, number] = [20, 0];
export const DEFAULT_ZOOM = 2;

