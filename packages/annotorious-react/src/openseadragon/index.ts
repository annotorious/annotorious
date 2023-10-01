export { 
  OpenSeadragonAnnotator, 
  useViewer 
} from './OpenSeadragonAnnotator';

export type { 
  OpenSeadragonAnnotatorProps 
} from './OpenSeadragonAnnotator';

export { 
  OpenSeadragonPopup, 
  type OpenSeadragonPopupProps 
} from './OpenSeadragonPopup';

export * from './OpenSeadragonViewer';

// Re-export essentials from @annotorious/openseadragon 
export type {
  OpenSeadragonAnnotator as AnnotoriousOpenSeadragonAnnotator
} from '@annotorious/openseadragon';
