import { useEffect } from 'react';
import { Annotation, Annotator } from '@annotorious/annotorious';
import { useAnnotator } from './Annotorious';

export interface AnnotoriousPluginProps <I extends Annotation, E extends unknown> {

  plugin: (anno: Annotator<I, E>, opts?: Object) => ({ unmount?: () => void }) | void;

  opts?: Object;

}

export const AnnotoriousPlugin = <I extends Annotation = Annotation, E extends unknown = unknown>(props: AnnotoriousPluginProps<I, E>) => {
  const { plugin, opts } = props;

  const anno = useAnnotator<Annotator<I, E>>();

  useEffect(() => {
    if (anno) {
      const p = plugin(anno, opts);

      return () => {
        if (p && 'unmount' in p)
          p.unmount();
      }
    }
  }, [anno, plugin]);

  return null;

}
