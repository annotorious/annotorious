import React, { useMemo, useState } from 'react';
import type OpenSeadragon from 'openseadragon';
import { OpenSeadragonAnnotator, OpenSeadragonViewer } from '@annotorious/react';
import { Annotorious } from '../src';

import '@annotorious/react/annotorious-react.css';

type Mode = 'draw' | 'select';

const ViewerTile = (props: { id: string, url: string, mode: Mode }) => {

  const options: OpenSeadragon.Options = useMemo(() => ({
    prefixUrl: 'https://cdn.jsdelivr.net/npm/openseadragon@3.1/build/openseadragon/images/', 
    tileSources: {
      type: 'image',
      url: props.url
    },
    gestureSettingsMouse: {
      clickToZoom: false
    },
    showRotationControl: true,
    crossOriginPolicy: 'Anonymous'
  }), []);

  return (
    <div className="viewer-tile">
      <Annotorious id={props.id}>
        <OpenSeadragonAnnotator 
          drawingMode="click"
          tool="rectangle"
          drawingEnabled={props.mode === 'draw'}>

          <OpenSeadragonViewer
            className="osd-container"
            options={options} />
        </OpenSeadragonAnnotator>
      </Annotorious>
    </div>
  )

}

export const App = () => {

  const [mode, setMode] = useState<Mode>('draw');

  const toggleMode = () => setMode(current => current === 'draw' ? 'select' : 'draw');

  return (
    <div className="container">
      <div id="toolbar">
        <button onClick={toggleMode}>
          Mode: {mode.toUpperCase()}
        </button>
      </div>

      <ViewerTile 
        id="01" 
        url="33054-000002-0001.jpg" 
        mode={mode} />

      <ViewerTile 
        id="02" 
        url="33054-000002-0001.jpg" 
        mode={mode} />

      <ViewerTile 
        id="03" 
        url="33054-000002-0001.jpg" 
        mode={mode} />

      <ViewerTile 
        id="04" 
        url="33054-000002-0001.jpg" 
        mode={mode} />
    </div>
  )

}

