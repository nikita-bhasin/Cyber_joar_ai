import { create } from 'zustand';
import { Feature, MapStore, DrawingState, FeatureType } from '../types';
import { MAX_SHAPES_CONFIG } from '../config';

const initialDrawingState: DrawingState = {
  mode: null,
  isDrawing: false,
};

export const useMapStore = create<MapStore>((set) => ({
  features: [],
  drawingState: initialDrawingState,
  maxShapes: { ...MAX_SHAPES_CONFIG } as Record<FeatureType, number>,

  setMaxShapes: (type: FeatureType, max: number) =>
    set((state) => ({
      maxShapes: { ...state.maxShapes, [type]: max },
    })),

  addFeature: (feature: Feature) =>
    set((state) => ({
      features: [...state.features, feature],
    })),

  removeFeature: (id: string) =>
    set((state) => ({
      features: state.features.filter((f) => f.id !== id),
    })),

  setDrawingMode: (mode: FeatureType | null) =>
    set((state) => ({
      drawingState: { ...state.drawingState, mode },
    })),

  setIsDrawing: (isDrawing: boolean) =>
    set((state) => ({
      drawingState: { ...state.drawingState, isDrawing },
    })),

  clearAllFeatures: () =>
    set({
      features: [],
      drawingState: initialDrawingState,
    }),
}));

