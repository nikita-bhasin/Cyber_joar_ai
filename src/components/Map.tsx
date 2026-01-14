import { MapContainer, TileLayer, GeoJSON as GeoJSONLayer } from 'react-leaflet';
import { useMapStore } from '../store/mapStore';
import { useDrawing } from '../hooks/useDrawing';
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from '../config';
import { Feature } from '../types';
import { getFeatureColor } from '../utils/polygonUtils';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

/**
 * Map component that renders OpenStreetMap tiles and drawn features
 */
export function Map() {
  const { features } = useMapStore();

  return (
    <MapContainer
      center={DEFAULT_MAP_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100vh', width: '100%', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapContent features={features} />
    </MapContainer>
  );
}

/**
 * Internal component that handles drawing interactions
 */
function MapContent({ features }: { features: Feature[] }) {
  useDrawing();

  return (
    <>
      {features.map((feature) => (
        <GeoJSONLayer
          key={feature.id}
          data={feature.geometry as any}
          style={{
            color: feature.properties.color || getFeatureColor(feature.type),
            fillColor:
              feature.type === 'linestring'
                ? 'transparent'
                : feature.properties.color || getFeatureColor(feature.type),
            fillOpacity: feature.type === 'linestring' ? 0 : 0.3,
            weight: feature.type === 'linestring' ? 3 : 2,
          }}
        />
      ))}
    </>
  );
}

