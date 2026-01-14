export type FeatureType = 'polygon' | 'rectangle' | 'circle' | 'linestring';

export interface Feature {
  id: string;
  type: FeatureType;
  geometry: GeoJSON.Geometry;
  properties: {
    name?: string;
    color?: string;
  };
}

export interface DrawingState {
  mode: FeatureType | null;
  isDrawing: boolean;
}

export interface MapStore {
  features: Feature[];
  drawingState: DrawingState;
  maxShapes: Record<FeatureType, number>;
  setMaxShapes: (type: FeatureType, max: number) => void;
  addFeature: (feature: Feature) => void;
  removeFeature: (id: string) => void;
  setDrawingMode: (mode: FeatureType | null) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  clearAllFeatures: () => void;
}

