import { useMapStore } from '../store/mapStore';
import { exportToGeoJSON, downloadFile } from '../utils/geojsonExport';
import './ExportButton.css';

/**
 * Button component for exporting features as GeoJSON
 */
export function ExportButton() {
  const { features } = useMapStore();

  const handleExport = () => {
    if (features.length === 0) {
      alert('No features to export');
      return;
    }

    const geoJSON = exportToGeoJSON(features);
    downloadFile(geoJSON, 'map-features.geojson', 'application/geo+json');
  };

  return (
    <div className="export-button-container">
      <button
        className="export-button"
        onClick={handleExport}
        disabled={features.length === 0}
        title="Export all features as GeoJSON"
      >
        <span className="export-icon">📥</span>
        <span>Export GeoJSON</span>
        {features.length > 0 && (
          <span className="export-count">({features.length})</span>
        )}
      </button>
    </div>
  );
}

