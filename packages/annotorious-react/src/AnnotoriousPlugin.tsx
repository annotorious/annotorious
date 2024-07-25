import { useEffect } from 'react';
import { Annotator } from '@annotorious/annotorious';
import { useAnnotator } from './Annotorious';

export type AnnotatorPlugin<T extends unknown = Annotator<any, unknown>> =
  (anno: T, opts?: Object) => ({ destroy?: () => void }) | void;

export interface AnnotoriousPluginProps<T extends unknown = Annotator<any, unknown>> {

  plugin: AnnotatorPlugin<T>;

  opts?: Object;

}

export const AnnotoriousPlugin = <T extends unknown = Annotator<any, unknown>>(props: AnnotoriousPluginProps<T>) => {
  const { plugin, opts } = props;

  const anno = useAnnotator<T>();

  useEffect(() => {
    if (!anno) return;

    const p = plugin(anno, opts);
    if (p && 'destroy' in p) {
      return () => p.destroy();
    }
  }, [anno]);

  return null;

};
