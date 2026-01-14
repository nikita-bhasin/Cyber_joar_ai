import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { Feature, FeatureType } from '../types';
import { useMapStore } from '../store/mapStore';
import {
  isPolygonType,
  doPolygonsOverlap,
  doesPolygonEnclose,
  trimPolygonOverlap,
  generateFeatureId,
  getFeatureColor,
} from '../utils/polygonUtils';
import * as L from 'leaflet';
import * as turf from '@turf/turf';

/**
 * Custom hook for handling drawing interactions on the map
 * Simplified drawing flow:
 * - Circle/Rectangle: Click to place center/corner, drag, click again to finish
 * - Polygon/LineString: Click to add points, double-click to finish
 */
export function useDrawing() {
  const map = useMap();
  const {
    drawingState,
    addFeature,
    setIsDrawing,
  } = useMapStore();
  
  const drawingLayerRef = useRef<L.LayerGroup | null>(null);
  const currentShapeRef = useRef<L.Layer | null>(null);
  const startPointRef = useRef<L.LatLng | null>(null);
  const polygonPointsRef = useRef<L.LatLng[]>([]);

  // Initialize drawing layer
  useEffect(() => {
    if (!map || drawingLayerRef.current) return;
    drawingLayerRef.current = L.layerGroup().addTo(map);
  }, [map]);

  // Main drawing effect
  useEffect(() => {
    if (!map || !drawingLayerRef.current) return;

    const drawingLayer = drawingLayerRef.current;
    const mode = drawingState.mode;

    // Clean up when mode changes
    if (currentShapeRef.current) {
      drawingLayer.removeLayer(currentShapeRef.current);
      currentShapeRef.current = null;
    }
    startPointRef.current = null;
    polygonPointsRef.current = [];
    setIsDrawing(false);

    if (!mode) {
      map.getContainer().style.cursor = 'default';
      return;
    }

    // Set cursor
    map.getContainer().style.cursor = 'crosshair';

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      e.originalEvent.stopPropagation();
      const latlng = e.latlng;
      const currentMode = useMapStore.getState().drawingState.mode;
      const isCurrentlyDrawing = useMapStore.getState().drawingState.isDrawing;

      if (!currentMode) return;

      if (currentMode === 'circle') {
        handleCircleClick(latlng, isCurrentlyDrawing);
      } else if (currentMode === 'rectangle') {
        handleRectangleClick(latlng, isCurrentlyDrawing);
      } else if (currentMode === 'polygon') {
        handlePolygonClick(latlng, isCurrentlyDrawing);
      } else if (currentMode === 'linestring') {
        handleLineStringClick(latlng, isCurrentlyDrawing);
      }
    };

    const handleMapDoubleClick = (e: L.LeafletMouseEvent) => {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
      const currentMode = useMapStore.getState().drawingState.mode;
      const isCurrentlyDrawing = useMapStore.getState().drawingState.isDrawing;

      if ((currentMode === 'polygon' || currentMode === 'linestring') && isCurrentlyDrawing) {
        finishPolygonOrLineString(currentMode);
      }
    };

    const handleMapMouseMove = (e: L.LeafletMouseEvent) => {
      const currentMode = useMapStore.getState().drawingState.mode;
      const isCurrentlyDrawing = useMapStore.getState().drawingState.isDrawing;

      if (!currentMode || !isCurrentlyDrawing || !startPointRef.current) return;

      const currentLatlng = e.latlng;

      if (currentMode === 'circle' && currentShapeRef.current instanceof L.Circle) {
        const distance = startPointRef.current.distanceTo(currentLatlng);
        currentShapeRef.current.setRadius(distance);
      } else if (currentMode === 'rectangle' && currentShapeRef.current instanceof L.Rectangle) {
        const bounds = L.latLngBounds([startPointRef.current, currentLatlng]);
        currentShapeRef.current.setBounds(bounds);
      } else if (currentMode === 'polygon' && currentShapeRef.current instanceof L.Polygon) {
        const points = [...polygonPointsRef.current, currentLatlng];
        if (points.length >= 2) {
          currentShapeRef.current.setLatLngs([points]);
        }
      } else if (currentMode === 'linestring' && currentShapeRef.current instanceof L.Polyline) {
        const points = [...polygonPointsRef.current, currentLatlng];
        if (points.length >= 1) {
          currentShapeRef.current.setLatLngs(points);
        }
      }
    };

    map.on('click', handleMapClick);
    map.on('dblclick', handleMapDoubleClick);
    map.on('mousemove', handleMapMouseMove);

    return () => {
      map.off('click', handleMapClick);
      map.off('dblclick', handleMapDoubleClick);
      map.off('mousemove', handleMapMouseMove);
    };
  }, [map, drawingState.mode]);

  const handleCircleClick = (latlng: L.LatLng, isDrawing: boolean) => {
    const currentFeatures = useMapStore.getState().features;
    const currentMaxShapes = useMapStore.getState().maxShapes;

    if (isDrawing) {
      // Finish drawing
      if (currentShapeRef.current instanceof L.Circle && drawingLayerRef.current) {
        finishDrawing('circle', currentShapeRef.current);
      }
      setIsDrawing(false);
      return;
    }

    // Check limit
    const circleCount = currentFeatures.filter((f) => f.type === 'circle').length;
    if (circleCount >= currentMaxShapes.circle) {
      alert(`Maximum ${currentMaxShapes.circle} circles allowed`);
      return;
    }

    // Start drawing
    startPointRef.current = latlng;
    setIsDrawing(true);

    const circle = L.circle(latlng, {
      radius: 0,
      color: getFeatureColor('circle'),
      fillColor: getFeatureColor('circle'),
      fillOpacity: 0.3,
      weight: 2,
    });

    if (drawingLayerRef.current) {
      drawingLayerRef.current.addLayer(circle);
      currentShapeRef.current = circle;
    }
  };

  const handleRectangleClick = (latlng: L.LatLng, isDrawing: boolean) => {
    const currentFeatures = useMapStore.getState().features;
    const currentMaxShapes = useMapStore.getState().maxShapes;

    if (isDrawing) {
      // Finish drawing
      if (currentShapeRef.current instanceof L.Rectangle && drawingLayerRef.current) {
        finishDrawing('rectangle', currentShapeRef.current);
      }
      setIsDrawing(false);
      return;
    }

    // Check limit
    const rectangleCount = currentFeatures.filter((f) => f.type === 'rectangle').length;
    if (rectangleCount >= currentMaxShapes.rectangle) {
      alert(`Maximum ${currentMaxShapes.rectangle} rectangles allowed`);
      return;
    }

    // Start drawing
    startPointRef.current = latlng;
    setIsDrawing(true);

    const bounds = L.latLngBounds(latlng, latlng);

    const rectangle = L.rectangle(bounds, {
      color: getFeatureColor('rectangle'),
      fillColor: getFeatureColor('rectangle'),
      fillOpacity: 0.3,
      weight: 2,
    });

    if (drawingLayerRef.current) {
      drawingLayerRef.current.addLayer(rectangle);
      currentShapeRef.current = rectangle;
    }
  };

  const handlePolygonClick = (latlng: L.LatLng, isDrawing: boolean) => {
    const currentFeatures = useMapStore.getState().features;
    const currentMaxShapes = useMapStore.getState().maxShapes;

    if (!isDrawing) {
      // Start drawing
      const polygonCount = currentFeatures.filter((f) => isPolygonType(f.type)).length;
      if (polygonCount >= currentMaxShapes.polygon) {
        alert(`Maximum ${currentMaxShapes.polygon} polygons allowed`);
        return;
      }

      polygonPointsRef.current = [latlng];
      setIsDrawing(true);

      const polygon = L.polygon([latlng], {
        color: getFeatureColor('polygon'),
        fillColor: getFeatureColor('polygon'),
        fillOpacity: 0.3,
        weight: 2,
      });

      if (drawingLayerRef.current) {
        drawingLayerRef.current.addLayer(polygon);
        currentShapeRef.current = polygon;
      }
    } else {
      // Add point
      polygonPointsRef.current.push(latlng);
      if (currentShapeRef.current instanceof L.Polygon) {
        currentShapeRef.current.setLatLngs([polygonPointsRef.current]);
      }
    }
  };

  const handleLineStringClick = (latlng: L.LatLng, isDrawing: boolean) => {
    const currentFeatures = useMapStore.getState().features;
    const currentMaxShapes = useMapStore.getState().maxShapes;

    if (!isDrawing) {
      // Start drawing
      const lineCount = currentFeatures.filter((f) => f.type === 'linestring').length;
      if (lineCount >= currentMaxShapes.linestring) {
        alert(`Maximum ${currentMaxShapes.linestring} line strings allowed`);
        return;
      }

      polygonPointsRef.current = [latlng];
      setIsDrawing(true);

      const polyline = L.polyline([latlng], {
        color: getFeatureColor('linestring'),
        weight: 3,
        opacity: 0.8,
      });

      if (drawingLayerRef.current) {
        drawingLayerRef.current.addLayer(polyline);
        currentShapeRef.current = polyline;
      }
    } else {
      // Add point
      polygonPointsRef.current.push(latlng);
      if (currentShapeRef.current instanceof L.Polyline) {
        currentShapeRef.current.setLatLngs(polygonPointsRef.current);
      }
    }
  };

  const finishPolygonOrLineString = (type: 'polygon' | 'linestring') => {
    if (!currentShapeRef.current) return;

    if (type === 'polygon' && polygonPointsRef.current.length < 3) {
      alert('Polygon needs at least 3 points');
      return;
    }

    if (type === 'linestring' && polygonPointsRef.current.length < 2) {
      alert('Line string needs at least 2 points');
      return;
    }

    finishDrawing(type, currentShapeRef.current);
    setIsDrawing(false);
  };

  const finishDrawing = (type: FeatureType, layer: L.Layer) => {
    let geometry: GeoJSON.Geometry | null = null;

    if (layer instanceof L.Circle) {
      const center = layer.getLatLng();
      const radius = layer.getRadius();
      const centerPoint = { type: 'Point' as const, coordinates: [center.lng, center.lat] };
      const circlePolygon = turf.circle(centerPoint, radius / 1000, { steps: 64, units: 'kilometers' });
      geometry = circlePolygon.geometry;
    } else if (layer instanceof L.Rectangle) {
      const bounds = layer.getBounds();
      const coords = [
        [
          [bounds.getWest(), bounds.getSouth()],
          [bounds.getEast(), bounds.getSouth()],
          [bounds.getEast(), bounds.getNorth()],
          [bounds.getWest(), bounds.getNorth()],
          [bounds.getWest(), bounds.getSouth()],
        ],
      ];
      geometry = {
        type: 'Polygon',
        coordinates: coords,
      };
    } else if (layer instanceof L.Polygon) {
      const latlngs = polygonPointsRef.current;
      if (latlngs.length < 3) {
        alert('Polygon needs at least 3 points');
        return;
      }
      const coords = latlngs.map((ll) => [ll.lng, ll.lat]);
      coords.push(coords[0]); // Close the ring
      geometry = {
        type: 'Polygon',
        coordinates: [coords],
      };
    } else if (layer instanceof L.Polyline) {
      const latlngs = polygonPointsRef.current;
      if (latlngs.length < 2) {
        alert('Line string needs at least 2 points');
        return;
      }
      const coords = latlngs.map((ll) => [ll.lng, ll.lat]);
      geometry = {
        type: 'LineString',
        coordinates: coords,
      };
    }

    if (!geometry) return;

    const currentFeatures = useMapStore.getState().features;

    // Handle polygon overlap constraints
    if (isPolygonType(type)) {
      const existingPolygonGeometries = currentFeatures
        .filter((f) => isPolygonType(f.type))
        .map((f) => f.geometry);

      // Check for full enclosure
      for (const existingGeom of existingPolygonGeometries) {
        if (doesPolygonEnclose(existingGeom, geometry!)) {
          alert('Cannot draw: This polygon would be fully enclosed by an existing polygon');
          return;
        }
        if (doesPolygonEnclose(geometry!, existingGeom)) {
          alert('Cannot draw: This polygon would fully enclose an existing polygon');
          return;
        }
      }

      // Check for overlaps and trim
      let hasOverlap = false;
      for (const existingGeom of existingPolygonGeometries) {
        if (doPolygonsOverlap(geometry!, existingGeom)) {
          hasOverlap = true;
          break;
        }
      }

      if (hasOverlap) {
        const trimmedGeometry = trimPolygonOverlap(geometry!, existingPolygonGeometries);
        if (!trimmedGeometry) {
          alert('Cannot draw: Overlap trimming resulted in invalid geometry');
          return;
        }
        geometry = trimmedGeometry;
      }
    }

    // Create and add feature
    const feature: Feature = {
      id: generateFeatureId(),
      type,
      geometry,
      properties: {
        color: getFeatureColor(type),
      },
    };

    addFeature(feature);
    
    if (drawingLayerRef.current) {
      drawingLayerRef.current.removeLayer(layer);
    }
    currentShapeRef.current = null;
    polygonPointsRef.current = [];
  };
}

