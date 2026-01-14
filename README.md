
# Map Feature Editor

A web application for drawing and managing geometrical features (Polygon, Rectangle, Circle, Line String) on OpenStreetMap tiles with automatic polygon overlap handling and GeoJSON export functionality.

## Features

- 🗺️ **OpenStreetMap Integration**: Renders free OpenStreetMap tiles with smooth zooming and panning
- ✏️ **Drawing Tools**: Draw polygons, rectangles, circles, and line strings
- 🔒 **Non-Overlapping Polygons**: Automatic overlap detection and trimming for polygon features
- 📤 **GeoJSON Export**: Export all drawn features as a GeoJSON file
- ⚙️ **Dynamic Configuration**: Easily adjustable maximum shapes per type
- 🎨 **Modern UI**: Clean, intuitive interface with visual feedback

## Tech Stack

- **React 18** with **TypeScript**
- **Vite** for build tooling
- **Leaflet** for map rendering
- **Turf.js** for spatial operations (polygon overlap detection and trimming)
- **Zustand** for state management

## Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cyber-joar-ai-map-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in the terminal)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

### Drawing Features

1. **Select a drawing tool** from the left toolbar:
   - **Polygon**: Click on the map to add points, double-click to finish
   - **Rectangle**: Click one corner, drag to opposite corner, click again to finish
   - **Circle**: Click center point, drag to set radius, click again to finish
   - **Line String**: Click on the map to add points, double-click to finish

2. **Drawing constraints**:
   - Polygon, Rectangle, and Circle features cannot overlap
   - If overlap occurs, the new polygon is automatically trimmed
   - If a polygon would fully enclose another (or vice versa), the operation is blocked
   - Line Strings are excluded from overlap rules and can freely cross other features

3. **Feature limits**: Each feature type has a maximum limit (configurable in `src/config/index.ts`)

### Exporting Features

Click the **"Export GeoJSON"** button in the top-right corner to download all drawn features as a GeoJSON file.

## Configuration

### Maximum Shapes Per Type

Edit `src/config/index.ts` to adjust the maximum number of shapes allowed per type:

```typescript
export const MAX_SHAPES_CONFIG: Record<string, number> = {
  polygon: 10,
  rectangle: 5,
  circle: 5,
  linestring: 20,
};
```

### Map Default Settings

You can also modify the default map center and zoom level in the same file:

```typescript
export const DEFAULT_MAP_CENTER: [number, number] = [20, 0];
export const DEFAULT_ZOOM = 2;
```

## Polygon Overlap Logic

The application implements sophisticated polygon overlap handling using **Turf.js** to ensure non-overlapping polygonal features (Polygon, Rectangle, Circle).

### Overlap Detection

The system uses two main checks:

1. **Intersection Check**: 
   - Uses `turf.intersect()` to detect if two polygons have any overlapping area
   - Returns `true` if polygons share any common area
   - Implementation: `doPolygonsOverlap()` in `src/utils/polygonUtils.ts`

2. **Enclosure Check**: 
   - Uses `turf.booleanContains()` to detect if one polygon fully encloses another
   - Prevents nested polygons (one completely inside another)
   - Implementation: `doesPolygonEnclose()` in `src/utils/polygonUtils.ts`

### Auto-Trimming Algorithm

When a new polygon overlaps with existing polygons, the system automatically trims the overlapping areas:

1. **Subtract Overlapping Areas**: 
   - Uses `turf.difference()` to remove overlapping regions from the new polygon
   - Iterates through all existing polygons to subtract all overlapping areas

2. **Handle MultiPolygon Results**: 
   - If trimming results in multiple separate polygons (MultiPolygon), the system:
     - Extracts all individual polygons
     - Calculates the area of each
     - Selects the largest polygon to keep
     - Discards smaller fragments

3. **Validation**: 
   - Ensures the trimmed polygon has sufficient area (> 0.0001 square degrees)
   - Validates geometry integrity
   - Returns `null` if the result is invalid or too small

4. **Error Handling**: 
   - If trimming results in invalid geometry, the operation is blocked
   - User receives an alert explaining why the drawing was rejected

### Implementation Details

The overlap logic is implemented in:
- **`src/utils/polygonUtils.ts`**: Core spatial operations using Turf.js
- **`src/hooks/useDrawing.ts`**: Drawing interaction and constraint enforcement

**Key Functions:**
- `isPolygonType(type)`: Determines if a feature type is subject to overlap rules
- `geometryToPolygon(geometry)`: Converts GeoJSON geometry to Turf Polygon for operations
- `doPolygonsOverlap(geom1, geom2)`: Checks if two polygons overlap
- `doesPolygonEnclose(geom1, geom2)`: Checks if one polygon fully encloses another
- `trimPolygonOverlap(newGeometry, existingGeometries)`: Automatically trims overlapping areas

### Rules Applied

- **Polygon, Rectangle, Circle**: Subject to overlap rules
- **Line String**: Excluded from overlap rules, can freely cross or overlap other features
- **Enclosure Prevention**: If a new polygon would fully enclose an existing one (or vice versa), the operation is blocked
- **Auto-Trim**: Overlapping areas are automatically removed from the new polygon

## Project Structure

```
src/
├── components/          # React components
│   ├── Map.tsx         # Main map component
│   ├── DrawingToolbar.tsx  # Drawing tools sidebar
│   └── ExportButton.tsx    # GeoJSON export button
├── hooks/              # Custom React hooks
│   └── useDrawing.ts   # Drawing interaction logic
├── store/              # State management
│   └── mapStore.ts     # Zustand store for features and drawing state
├── utils/              # Utility functions
│   ├── polygonUtils.ts # Polygon overlap detection and trimming
│   └── geojsonExport.ts # GeoJSON export functionality
├── types/              # TypeScript type definitions
│   └── index.ts
├── config/             # Configuration files
│   └── index.ts        # Max shapes and map defaults
└── App.tsx             # Main application component
```

## Sample GeoJSON Export

The exported GeoJSON follows the standard GeoJSON FeatureCollection format. Each feature includes geometry and properties (id, type, color).

### Example Export

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-74.0059, 40.7128],
            [-73.9857, 40.7128],
            [-73.9857, 40.7289],
            [-74.0059, 40.7289],
            [-74.0059, 40.7128]
          ]
        ]
      },
      "properties": {
        "id": "feature_1703123456789_abc123",
        "type": "rectangle",
        "color": "#10b981"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-74.01, 40.71],
            [-73.99, 40.71],
            [-73.99, 40.73],
            [-74.01, 40.73],
            [-74.01, 40.71]
          ]
        ]
      },
      "properties": {
        "id": "feature_1703123457890_def456",
        "type": "circle",
        "color": "#f59e0b"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-74.02, 40.70],
          [-73.98, 40.70],
          [-73.98, 40.75]
        ]
      },
      "properties": {
        "id": "feature_1703123458901_ghi789",
        "type": "linestring",
        "color": "#ef4444"
      }
    }
  ]
}
```

### GeoJSON Structure

- **FeatureCollection**: Top-level container for all features
- **Feature**: Individual drawn shape with:
  - **geometry**: GeoJSON geometry (Polygon, LineString)
  - **properties**: Metadata including:
    - `id`: Unique identifier
    - `type`: Feature type (polygon, rectangle, circle, linestring)
    - `color`: Hex color code for visualization

## Code Quality

- **TypeScript**: Strict typing throughout the codebase
- **Modular Architecture**: Separated concerns (components, hooks, utils, store)
- **Inline Comments**: Complex logic (especially polygon operations) is well-documented
- **Error Handling**: Graceful error handling for edge cases
- **User Feedback**: Clear alerts and visual indicators for user actions

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

This project is created as a frontend development assignment.

## Deployment

The application can be deployed to:
- **Vercel**: `vercel --prod`
- **Netlify**: Connect your GitHub repository
- **GitHub Pages**: Use the `dist` folder after building

For Vercel deployment:
```bash
npm install -g vercel
vercel --prod
```

## Future Enhancements

Potential improvements:
- Feature editing (move, resize, delete individual features)
- Undo/Redo functionality
- Feature properties editor
- Import GeoJSON files
- Different map tile providers
- Feature styling customization

=======
# Cyber_joar_ai

