import RBush from 'rbush';
import { ShapeType,computeArea, intersects } from '../model';
import type { ImageAnnotationTarget } from '../model';

interface IndexedTarget {

  minX: number;

  minY: number;

  maxX: number;

  maxY: number;

  target: ImageAnnotationTarget;

}

export const createSpatialTree = () => {

  const tree = new RBush<IndexedTarget>();

  const index = new Map<string, IndexedTarget>();

  const all = () => [...index.values()];

  const clear = () => {
    tree.clear();
    index.clear();
  }

  const insert = (target: ImageAnnotationTarget) => {
    const { minX, minY, maxX, maxY } = target.selector.geometry.bounds;

    const t = { minX, minY, maxX, maxY, target };

    tree.insert(t);
    index.set(target.annotation, t);
  };

  const remove = (target: ImageAnnotationTarget) => {
    const item = index.get(target.annotation);
    tree.remove(item);
    index.delete(target.annotation);
  };

  const update = (previous: ImageAnnotationTarget, updated: ImageAnnotationTarget) => {
    remove(previous);
    insert(updated);
  };

  const set = (targets: ImageAnnotationTarget[], replace: boolean = true) => {
    if (replace) 
      clear();

    const indexedTargets = targets.map(target => {
      const { minX, minY, maxX, maxY } = target.selector.geometry.bounds;
      return { minX, minY, maxX, maxY, target };
    });

    indexedTargets.forEach(t => index.set(t.target.annotation, t));
    tree.load(indexedTargets);
  };

  const getAt = (x: number, y: number): ImageAnnotationTarget | null => {
    const idxHits = tree.search({
      minX: x,
      minY: y,
      maxX: x,
      maxY: y
    }).map(item => item.target);

    // Exact hit test on shape (not needed for rectangles!)
    const exactHits = idxHits.filter(target => {
      return (target.selector.type === ShapeType.RECTANGLE) ||
        intersects(target.selector, x, y);
    });

    // Get smallest shape
    if (exactHits.length > 0) {
      exactHits.sort((a, b) => computeArea(a.selector) - computeArea(b.selector));
      return exactHits[0];
    }
  };

  const getIntersecting = (x: number, y: number, width: number, height: number) =>
    tree.search({
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height
    }).map(item => item.target);
  
  const size = () => tree.all().length;

  return {
    all,
    clear,
    getAt,
    getIntersecting,
    insert,
    remove,
    set,
    size,
    update
  }

}
