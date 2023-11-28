import React, { useEffect, useState } from 'react';
import { ImageAnnotation, W3CImageFormat } from '@annotorious/openseadragon';
import { 
  OpenSeadragonViewer, 
  OpenSeadragonAnnotator, 
  OpenSeadragonPopup, 
  useAnnotator,
  useSelection,
  AnnotoriousOpenSeadragonAnnotator
} from '../src';

import '@annotorious/openseadragon/annotorious-openseadragon.css';
import OpenSeadragon from 'openseadragon';

const IIIF_SAMPLE = {
  "@context" : "http://iiif.io/api/image/2/context.json",
  "protocol" : "http://iiif.io/api/image",
  "width" : 7808,
  "height" : 5941,
  "sizes" : [
     { "width" : 244, "height" : 185 },
     { "width" : 488, "height" : 371 },
     { "width" : 976, "height" : 742 }
  ],
  "tiles" : [
     { "width" : 256, "height" : 256, "scaleFactors" : [ 1, 2, 4, 8, 16, 32 ] }
  ],
  "@id" : "https://iiif.bodleian.ox.ac.uk/iiif/image/af315e66-6a85-445b-9e26-012f729fc49c",
  "profile" : [
     "http://iiif.io/api/image/2/level2.json",
     { "formats" : [ "jpg", "png", "webp" ],
       "qualities" : ["native","color","gray","bitonal"],
       "supports" : ["regionByPct","regionSquare","sizeByForcedWh","sizeByWh","sizeAboveFull","sizeUpscaling","rotationBy90s","mirroring"],
       "maxWidth" : 1000,
       "maxHeight" : 1000
     }
  ]
};

const OSD_OPTIONS: OpenSeadragon.Options = {
  prefixUrl: 'https://cdn.jsdelivr.net/npm/openseadragon@3.1/build/openseadragon/images/',
  tileSources: IIIF_SAMPLE,
  crossOriginPolicy: 'Anonymous',
  gestureSettingsMouse: {
    clickToZoom: false
  }
};

const FILTERS = [ 
  { key: 'SHOW_ALL', filter: undefined },
  { key: 'SHOW_RECTANGLES', filter: (a: ImageAnnotation) => a.target.selector.type === 'RECTANGLE' },
  { key: 'SHOW_POLYGONS', filter: (a: ImageAnnotation) => a.target.selector.type === 'POLYGON' }
];

export const App = () => {

  const anno = useAnnotator<AnnotoriousOpenSeadragonAnnotator>();

  const [mode, setMode] = useState<'move' | 'draw'>('move');

  const [filter, setFilter] = useState<{ key: String, filter: ((a: ImageAnnotation) => boolean) | undefined }>(FILTERS[0]);

  const { selected } = useSelection()

  useEffect(() => {
    if (anno) {
      fetch('annotations.json')
        .then((response) => response.json())
        .then(annotations => { 
          anno.setAnnotations(annotations)
        });
    }
  }, [anno]);

  useEffect(() => {
    if (anno)
      anno.setDrawingEnabled(mode === 'draw');
  }, [mode]);

  const toggleFilter = () => {
    // @ts-ignore
    const idx = FILTERS.indexOf(filter);
    const next = (idx + 1) % FILTERS.length;
    setFilter(FILTERS[next]);
  }

  return (
    <div>
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 999 }}>
        <button
          onClick={toggleFilter}>
          {filter.key}
        </button>

        <button
          onClick={() => setMode(mode => mode === 'draw' ? 'move' : 'draw')}>
          {mode}
        </button>
      </div>

      <OpenSeadragonAnnotator 
        adapter={W3CImageFormat(
          'https://iiif.bodleian.ox.ac.uk/iiif/image/af315e66-6a85-445b-9e26-012f729fc49c')}
        drawingEnabled={false}
        drawingMode="click"
        filter={filter.filter}>
            
        <OpenSeadragonViewer className="openseadragon" options={OSD_OPTIONS} />

        <OpenSeadragonPopup 
          popup={() => (
            <div className="popup">Hello World</div>
          )} />
      </OpenSeadragonAnnotator>
    </div>
  )

}