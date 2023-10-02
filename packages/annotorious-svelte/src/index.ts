export * from './osd';

export { default as MouseOverTooltip } from './MouseOverTooltip.svelte';

// Re-export essentials from @annotorious/core
export type {
  SvelteAnnotator,
  SvelteAnnotatorState
} from '@annotorious/core';

// Re-export essentials from @annotorious/annotorious
export type {
  ImageAnnotation
} from '@annotorious/annotorious';