import { ReactNode, createContext, useContext, useState } from 'react';
import { Viewer } from '@annotorious/react';

interface OSDViewerContextValue {

  viewers: Map<string, Viewer>;

  setViewers: React.Dispatch<React.SetStateAction<Map<string, Viewer>>>

}

export const OSDViewerContext = createContext<OSDViewerContextValue>({

  viewers: undefined,

  setViewers: undefined,

});

export const OSDViewerManifold = (props: { children: ReactNode }) => {

  const [viewers, setViewers] = useState(new Map<string, Viewer>());

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