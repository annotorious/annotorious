import { ReactNode, createContext, useContext, useState } from 'react';
import OpenSeadragon from 'openseadragon';

interface OSDViewerContextValue {

  viewers: Map<string, OpenSeadragon.Viewer>;

  setViewers: React.Dispatch<React.SetStateAction<Map<string, OpenSeadragon.Viewer>>>

}

export const OSDViewerContext = createContext<OSDViewerContextValue>({

  viewers: undefined,

  setViewers: undefined,

});

export const OSDViewerManifold = (props: { children: ReactNode }) => {

  const [viewers, setViewers] = useState(new Map<string, OpenSeadragon.Viewer>());

  return (
    <OSDViewerContext.Provider value={{ viewers, setViewers }}>
      {props.children}
    </OSDViewerContext.Provider>
  )

}

export const useViewers = () => {
  const { viewers } = useContext(OSDViewerContext);
  return viewers;
}