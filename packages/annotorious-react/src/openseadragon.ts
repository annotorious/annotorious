export * from './openseadragon';

// This ensures the OpenSeadragon Annotorious stylesheet gets packaged
import '@annotorious/openseadragon/annotorious-openseadragon.css';

// Essential re-exports from @annotorious/openseadragon 
export type {
  OpenSeadragonAnnotator as AnnotoriousOpenSeadragonAnnotator
} from '@annotorious/openseadragon';

export type { Viewer } from 'openseadragon';
