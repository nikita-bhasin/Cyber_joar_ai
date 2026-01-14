import { FeatureType } from '../types';
import { useMapStore } from '../store/mapStore';
import { getFeatureColor } from '../utils/polygonUtils';
import './DrawingToolbar.css';

/**
 * Toolbar component for selecting drawing tools
 */
export function DrawingToolbar() {
  const { drawingState, setDrawingMode, features, maxShapes } = useMapStore();

  const tools: { type: FeatureType; label: string; icon: string }[] = [
    { type: 'polygon', label: 'Polygon', icon: '🔷' },
    { type: 'rectangle', label: 'Rectangle', icon: '▬' },
    { type: 'circle', label: 'Circle', icon: '⭕' },
    { type: 'linestring', label: 'Line', icon: '📏' },
  ];

  const handleToolClick = (type: FeatureType) => {
    if (drawingState.mode === type) {
      // Deselect if already selected
      setDrawingMode(null);
    } else {
      setDrawingMode(type);
    }
  };

  const getToolCount = (type: FeatureType) => {
    return features.filter((f) => f.type === type).length;
  };

  return (
    <div className="drawing-toolbar">
      <div className="toolbar-title">Drawing Tools</div>
      <div className="toolbar-buttons">
        {tools.map((tool) => {
          const isActive = drawingState.mode === tool.type;
          const count = getToolCount(tool.type);
          const maxCount = maxShapes[tool.type];
          const isDisabled = count >= maxCount;

          return (
            <button
              key={tool.type}
              className={`tool-button ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && handleToolClick(tool.type)}
              disabled={isDisabled}
              title={`${tool.label} (${count}/${maxCount})`}
              style={{
                borderColor: isActive ? getFeatureColor(tool.type) : undefined,
                backgroundColor: isActive
                  ? `${getFeatureColor(tool.type)}20`
                  : undefined,
              }}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
              <span className="tool-count">{count}/{maxCount}</span>
            </button>
          );
        })}
      </div>
      <div className="toolbar-instructions">
        {drawingState.mode && (
          <div className="instructions">
            {drawingState.mode === 'polygon' && (
              <p>Click to add points. Double-click to finish.</p>
            )}
            {drawingState.mode === 'linestring' && (
              <p>Click to add points. Double-click to finish.</p>
            )}
            {drawingState.mode === 'circle' && (
              <p>Click center, then drag to set radius. Click again to finish.</p>
            )}
            {drawingState.mode === 'rectangle' && (
              <p>Click one corner, then drag to opposite corner. Click again to finish.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

