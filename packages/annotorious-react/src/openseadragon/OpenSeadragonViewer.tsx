import { forwardRef, useContext, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import OpenSeadragon from 'openseadragon';
import { dequal } from 'dequal/lite';
import { OpenSeadragonAnnotatorContext } from './OpenSeadragonAnnotator';

export interface OpenSeadragonViewerProps {

  className?: string;

  options: OpenSeadragon.Options;

}

/**
 * If the only thing that changes about the options are the tileSources, 
 * there's no need to destroy and re-create the viewer, which can introduce
 * dangerous race conditions and break interop with plugins. (Changing 
 * tileSources is probably the main use case by far.)
 */
const onlyTileSourcesChanged = (prev: OpenSeadragon.Options | undefined, next: OpenSeadragon.Options): boolean => {
    if (!prev) return false;

    const { tileSources: prevTiles, ...prevRest } = prev;
    const { tileSources: nextTiles, ...nextRest } = next;

    const tileSourcesChanged = !dequal(prevTiles, nextTiles);
    const otherOptionsChanged = !dequal(prevRest, nextRest);

    return tileSourcesChanged && !otherOptionsChanged;
  };

export const OpenSeadragonViewer = forwardRef<OpenSeadragon.Viewer, OpenSeadragonViewerProps>((props: OpenSeadragonViewerProps, ref) => {

  const { className, options } = props;

  const element = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<OpenSeadragon.Viewer | undefined>(null);
  const prevOptionsRef = useRef<OpenSeadragon.Options>(null);

  const { viewer, setViewer } = useContext(OpenSeadragonAnnotatorContext);

  // Init and destroy the OSD viewer on mount/unmount
  useLayoutEffect(() => {  
    if (element.current && !viewerRef.current) {
      const v = OpenSeadragon({...options, element: element.current });
      viewerRef.current = v;
      prevOptionsRef.current = options;

      // Checking for setViewer is just a convenience so we can
      // use this component also without an OpenSeadragonAnnotator
      if (setViewer)
        setViewer(v);

      return () => {
        if (setViewer)
          setViewer(undefined);

        v.destroy();
        viewerRef.current = undefined;
      }
    }
  }, []);

  useLayoutEffect(() => {    
    const v = viewerRef.current;
    const prev = prevOptionsRef.current;
    if (!v || !prev) return; 

    if (onlyTileSourcesChanged(prev, options)) {      
      const tileSources: OpenSeadragon.Options['tileSources'][] = 
        Array.isArray(options.tileSources) ? options.tileSources : [options.tileSources];
      
      v.world.removeAll();

      tileSources.forEach((tileSource, index) => {
        const tileConfig = typeof tileSource === 'string' 
          ? { tileSource } : tileSource;

        v.addTiledImage({
          ...tileConfig,
          index,
          success: () => {
            if (index === 0) {
              v.viewport.goHome();
            }
          }
        } as OpenSeadragon.TiledImageOptions);
      });

      prevOptionsRef.current = options;
    } else if (!dequal(prev, options)) {
      console.warn('Forced re-creation of OpenSeadragon viewer. Beware of race conditions!');
      
      if (setViewer)
        setViewer(undefined);
      
      v.destroy();

      if (element.current) {
        const newViewer = OpenSeadragon({...options, element: element.current });
        viewerRef.current = newViewer;
        prevOptionsRef.current = options;

        if (setViewer)
          setViewer(newViewer);
      }
    }
  }, [options]);

  useImperativeHandle(ref, () => viewer);

  return (
    <div className={className} ref={element} />
  );

});