import { forwardRef, useContext, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import OpenSeadragon from 'openseadragon';
import { OpenSeadragonAnnotatorContext } from './OpenSeadragonAnnotator';

export interface OpenSeadragonViewerProps {

  className?: string;

  options: OpenSeadragon.Options;

}

export const OpenSeadragonViewer = forwardRef<OpenSeadragon.Viewer, OpenSeadragonViewerProps>((props: OpenSeadragonViewerProps, ref) => {

  const { className, options } = props;

  const element = useRef<HTMLDivElement>(null);

  const { viewer, setViewer } = useContext(OpenSeadragonAnnotatorContext);

  useLayoutEffect(() => {    
    if (element.current) {
      const v = OpenSeadragon({...options, element: element.current });

      // Checking for setViewer is just a convenience so we can
      // use this component also without an OpenSeadragonAnnotator
      if (setViewer)
        setViewer(v);

      return () => {
        if (setViewer)
          setViewer(undefined);

        v.destroy();
      }
    }
  }, [JSON.stringify(options)]);

  useImperativeHandle(ref, () => viewer);

  return (
    <div className={className} ref={element} />
  );

});