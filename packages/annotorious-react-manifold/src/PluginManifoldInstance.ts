import { Annotation, Annotator } from '@annotorious/react';
import { AnnotoriousPlugin } from './AnnotoriousManifoldInstance';

export const createPluginManifold = <
  P extends AnnotoriousPlugin,
  I extends Annotation = Annotation, 
  E extends { id: string } = Annotation
>(
  annotators: Annotator<I, E>[],
  mountFn: (anno: Annotator<I, E>, opts?: any) => P, 
  opts?: any, 
): P => {

  const instances = annotators.map(anno => mountFn(anno, opts));

  return new Proxy({} as P, {
    get: (_, prop: string | symbol) => {
      const firstInstance = instances[0];
      if (!firstInstance) return undefined;
      
      const propValue = (firstInstance as any)[prop];
      
      if (typeof propValue === 'function') {
        return function(...args: any[]) {
          return instances.map(instance => {
            const method = (instance as any)[prop];
            if (typeof method === 'function') {
              return method.apply(instance, args);
            }
            return undefined;
          });
        };
      }

      return propValue;
    }
  });

}