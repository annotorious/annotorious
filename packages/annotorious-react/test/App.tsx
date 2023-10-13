import React, { useEffect } from 'react';
import { W3CImageFormat } from '@annotorious/openseadragon';
import { 
  OpenSeadragonViewer, 
  OpenSeadragonAnnotator, 
  OpenSeadragonPopup, 
  useAnnotator
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

export const App = () => {

  const anno = useAnnotator();

  useEffect(() => {
    if (anno) {
      fetch('annotations.json')
        .then((response) => response.json())
        .then(annotations => { 
          anno.setAnnotations(annotations)
        });
    }
  }, [anno]);

  const onDelete = () => {
    anno.clearAnnotations();
  }

  return (
    <OpenSeadragonAnnotator 
      adapter={W3CImageFormat(
        'https://iiif.bodleian.ox.ac.uk/iiif/image/af315e66-6a85-445b-9e26-012f729fc49c')}>
          
      <OpenSeadragonViewer className="openseadragon" options={OSD_OPTIONS} />

      <button style={{ position: 'absolute', top: 0, left: 0, zIndex:99999 }} onClick={onDelete}>DELETE</button>

      <OpenSeadragonPopup 
        popup={() => (
          <div className="popup">Hello World</div>
        )} />
    </OpenSeadragonAnnotator>
  )

}