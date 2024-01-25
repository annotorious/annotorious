import { useContext, useEffect } from 'react';
import { OSDViewerContext } from './OpenSeadragonViewerManifold';
import { 
  OpenSeadragonViewer as OpenSeadragonViewerInstance, 
  OpenSeadragonViewerProps as OpenSeadragonViewerInstanceProps, 
  useViewer 
} from '@annotorious/react';

/** Passes the OSD viewer instance upwards to the manifold **/
const OpenSeadragonViewerInstanceShim = (props: { id: string }) => {

  const viewer = useViewer();

  const { setViewers } = useContext(OSDViewerContext);

  useEffect(() => {
    if (viewer) {
      setViewers(m => new Map(m.entries()).set(props.id, viewer));

      return () => {
        setViewers(m => new Map(Array.from(m.entries()).filter(([key, _]) => key !== props.id)));
      }
    }
  }, [viewer]);

  return null;

}

type OpenSeadragonViewerProps = OpenSeadragonViewerInstanceProps & {

  id: string

};

/**
 * An alternative <OpenSeadragonViewer /> component that mimicks the original
 * from @annotorious/react, but injects a shim component that connects
 * the Viewer to the ViewerManifold.
 */
export const OpenSeadragonViewer = (props: OpenSeadragonViewerProps) => {

  return (
    <>
      <OpenSeadragonViewerInstance {...props} />
      <OpenSeadragonViewerInstanceShim id={props.id} />
    </>
  )

}