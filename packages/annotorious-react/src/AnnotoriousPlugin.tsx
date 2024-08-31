import { forwardRef, useEffect, MutableRefObject } from 'react';
import { Annotator } from '@annotorious/annotorious';
import { useAnnotator } from './Annotorious';

export type AnnotatorPlugin<T extends unknown = Annotator<any, unknown>> =
  (anno: T, opts?: Object) => ({ unmount?: () => void }) | void;

export interface AnnotoriousPluginProps<T extends unknown = Annotator<any, unknown>> {

  plugin: AnnotatorPlugin<T>;

  opts?: Object;

}

type PluginReturnType<T> = ReturnType<AnnotatorPlugin<T>>;

export const AnnotoriousPlugin = <T extends unknown = Annotator<any, unknown>>(
  props: AnnotoriousPluginProps<T> & { ref?: MutableRefObject<PluginReturnType<T>> }
) => {
  const { plugin, ref, opts } = props;

  const anno = useAnnotator<T>();

  useEffect(() => {
    if (!anno) return;

    const p = plugin(anno, opts);

    if (ref)
      ref.current = p;

    return () => {
      if (p && 'unmount' in p) {
        p.unmount();
      }

      if (ref)
        ref.current = null;
    }
  }, [anno, plugin, opts, ref]);

  return null;

}
