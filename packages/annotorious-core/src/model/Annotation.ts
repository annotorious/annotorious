import type { User } from './User';

export interface Annotation {

  id: string;

  target: AnnotationTarget;

  bodies: AnnotationBody[];

  properties?: {

    [key: string]: any;

  }

}

export interface AnnotationTarget {

  annotation: string;

  selector: AbstractSelector;

  creator?: User;

  created?: Date;

  updatedBy?: User;

  updated?: Date;

}

export interface AbstractSelector { }

export interface AnnotationBody {

  id: string;

  annotation: string;

  type?: string;

  purpose?: string;

  value: string;

  creator?: User;

  created?: Date;

  updatedBy?: User;

  updated?: Date;

}
