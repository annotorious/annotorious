import { useEffect, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import {
  AnnotoriousOpenSeadragonAnnotator,
  ImageAnnotation,
  OpenSeadragonAnnotator,
  OpenSeadragonViewer,
  RectangleGeometry,
  ShapeType,
  useAnnotations,
  useAnnotator,
  useSelection
} from '../../src';

const INITIAL_ANNOTATION: ImageAnnotation = {
  id: 'test-rectangle',
  bodies: [],
  target: {
    annotation: 'test-rectangle',
    selector: {
      type: ShapeType.RECTANGLE,
      geometry: {
        bounds: { minX: 180, minY: 85, maxX: 370, maxY: 230 },
        x: 180,
        y: 85,
        w: 190,
        h: 145
      } as RectangleGeometry
    }
  }
};

const VIEWER_OPTIONS: OpenSeadragon.Options = {
  prefixUrl: 'https://cdn.jsdelivr.net/npm/openseadragon@5.0/build/openseadragon/images/',
  showNavigator: true,
  tileSources: {
    type: 'image',
    url: '/test/image/640px-Hallstatt.jpg'
  },
  gestureSettingsMouse: { clickToZoom: false },
  maxZoomPixelRatio: 8,
  zoomPerClick: 2,
  zoomPerScroll: 1.5
};

const Diagnostics = () => {
  const annotations = useAnnotations();
  const selection = useSelection();

  return (
    <output className="diagnostics" aria-live="polite">
      <div><strong>Selected:</strong> {selection.selected.map(({ annotation }) => annotation.id).join(', ') || 'none'}</div>
      <div><strong>Annotations:</strong> {annotations.length}</div>
      <pre>{JSON.stringify(annotations.map(({ id, target }) => ({ id, geometry: target.selector.geometry })), null, 2)}</pre>
    </output>
  )

}

export const App = () => {
  const anno = useAnnotator<AnnotoriousOpenSeadragonAnnotator>();
  const [drawing, setDrawing] = useState(false);
  const [transformed, setTransformed] = useState(true);

  useEffect(() => {
    if (anno)
      anno.setAnnotations([INITIAL_ANNOTATION]);
  }, [anno]);

  useEffect(() => {
    anno?.setDrawingEnabled(drawing);
  }, [anno, drawing]);

  return (
    <main>
      <header>
        <div>
          <h1>OpenSeadragon coordinate-mapping playground</h1>
          <p>
            The viewer is inside a CSS-transformed ancestor by default. Select the red
            rectangle, drag it or a handle, then enable drawing and add another rectangle.
          </p>
        </div>
        <div className="controls">
          <button onClick={() => setTransformed(value => !value)}>
            {transformed ? 'Disable CSS transform' : 'Enable CSS transform'}
          </button>
          <button onClick={() => setDrawing(value => !value)}>
            {drawing ? 'Stop drawing' : 'Draw rectangle'}
          </button>
        </div>
      </header>

      <section className={transformed ? 'transformed' : undefined}>
        <OpenSeadragonAnnotator drawingMode="drag">
          <OpenSeadragonViewer className="viewer" options={VIEWER_OPTIONS} />
        </OpenSeadragonAnnotator>
      </section>

      <Diagnostics />
    </main>
  )

}
