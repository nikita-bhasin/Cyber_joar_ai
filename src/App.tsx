import { Map } from './components/Map';
import { DrawingToolbar } from './components/DrawingToolbar';
import { ExportButton } from './components/ExportButton';
import { useMapStore } from './store/mapStore';
import './App.css';

function App() {
  const { drawingState } = useMapStore();
  const drawingMode = drawingState.mode;

  return (
    <div className="app">
      <Map />
      <DrawingToolbar />
      <ExportButton />
      {drawingMode && (
        <div className="drawing-indicator">
          <div className="drawing-indicator-content">
            <span className="drawing-indicator-icon">✏️</span>
            <span className="drawing-indicator-text">
              Drawing: <strong>{drawingMode}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

