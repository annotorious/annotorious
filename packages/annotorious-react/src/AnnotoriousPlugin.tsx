import { useEffect } from 'react';
import { Annotator } from '@annotorious/annotorious';
import { useAnnotator } from './Annotorious';

export type AnnotoriousPlugin<T extends unknown = Annotator<any, unknown>> =
  (anno: T, opts?: Object) => ({ unmount?: () => void }) | void;

export interface AnnotoriousPluginProps<T extends unknown = Annotator<any, unknown>> {

  plugin: AnnotoriousPlugin<T>;

  opts?: Object;

}

export const AnnotoriousPlugin = <T extends unknown = Annotator<any, unknown>>(props: AnnotoriousPluginProps<T>) => {
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
