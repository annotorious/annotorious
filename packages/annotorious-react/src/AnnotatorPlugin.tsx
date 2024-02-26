import { useEffect } from 'react';
import { Annotator } from '@annotorious/annotorious';
import { useAnnotator } from './Annotorious';

export type Plugin<T extends unknown = Annotator<any, unknown>> =
  (anno: T, opts?: Object) => ({ unmount?: () => void }) | void;

export interface AnnotatorPluginProps<T extends unknown = Annotator<any, unknown>> {

  plugin: Plugin<T>;

  opts?: Object;

}

export const AnnotatorPlugin = <T extends unknown = Annotator<any, unknown>>(props: AnnotatorPluginProps<T>) => {
  const { plugin, opts } = props;

  const anno = useAnnotator<T>();

  useEffect(() => {
    if (!anno) return;

    const p = plugin(anno, opts);
    return () => {
      if (p && 'unmount' in p)
        p.unmount();
    };
  }, [anno]);

  return null;

};
