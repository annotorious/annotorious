import type { User } from './User';

export interface Annotation {

  id: string;

  target: AnnotationTarget;

  bodies: AnnotationBody[];

  properties?: {

    [key: string]: any;

  };

}

export interface AnnotationTarget extends AnnotationLifecycleInfo {

  annotation: string;

  selector: AbstractSelector;

}

/**
 * Lifecycle info is co-located with the target because:
 * > The targets and bodies can be created pretty much independently
 * > created / creator info at the annotation level as a piece of derived information -
 * > whoever was the first creator of the first part of the annotation.
 * @see https://github.com/annotorious/annotorious/issues/325#issuecomment-1855697146
 * @see https://www.w3.org/TR/annotation-model/#lifecycle-information
 */
export interface AnnotationLifecycleInfo {

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

  purpose?: Purpose | string;

  value?: string;

  creator?: User;

  created?: Date;

  updatedBy?: User;

  updated?: Date;

}

// Pre-defined purposes from https://www.w3.org/TR/annotation-model/#motivation-and-purpose
export type Purpose =
  'assessing' |
  'bookmarking' |
  'classifying' |
  'commenting' |
  'describing' |
  'editing' |
  'highlighting' |
  'identifying' |
  'linking' |
  'moderating' |
  'questioning' |
  'replying' |
  'tagging';


export const parseLifecycleInfo = <T extends AnnotationLifecycleInfo>(
  infoContainer: T
): AnnotationLifecycleInfo => ({
  created: infoContainer.created,
  creator: infoContainer.creator,
  updated: infoContainer.updated,
  updatedBy: infoContainer.updatedBy
});
