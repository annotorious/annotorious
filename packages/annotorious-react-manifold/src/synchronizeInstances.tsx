import { Annotation, Annotator } from '@annotorious/react';

export const synchronizeInstances = <I extends Annotation = Annotation, E extends unknown = Annotation>(
  instances: Annotator<I, E>[]
) => {

  // TODO listen on all instances, broadcast changes on one instance to the others

  return null;

}