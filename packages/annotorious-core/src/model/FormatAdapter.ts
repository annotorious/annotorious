import type { Annotation } from './Annotation';

export interface FormatAdapter<A extends Annotation, T extends unknown> {

  parse(serialized: T): ParseResult<A>;

  serialize(core: A): T;

}

export interface ParseResult<A extends Annotation> {

  parsed?: A;
  
  error?: Error;

}

export const serializeAll = 
  <A extends Annotation, T extends unknown>(adapter: FormatAdapter<A, T>) =>
    (annotations: A[]) => annotations.map(a => adapter.serialize(a));

export const parseAll = 
  <A extends Annotation, T extends unknown>(adapter: FormatAdapter<A, T>) =>
    (serialized: T[]) => serialized.reduce((result, next) => {
      const { parsed, error } = adapter.parse(next);
      
      return error ? {
        parsed: result.parsed,
        failed: [...result.failed, next ]
      } : parsed ? {
        parsed: [...result.parsed, parsed ],
        failed: result.failed
      } : {
        ...result
      }
    }, { parsed: [] as A[], failed: [] as T[]});
  