/** 
 * Wraps a single DOMRect into an object that properly
 * implements the DOMRectList interface.
 */
export const toClientRects = (rect: DOMRect) => ({
  length: 1,
  item: (index: number) => index === 0 ? rect : undefined,
  [Symbol.iterator]: function* (): IterableIterator<DOMRect> {
    for (let i = 0; i < this.length; i++)
      yield this.item(i)!;
  }
} as DOMRectList);