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

  const all = () => tree.all().map(item => item.target);

  const clear = () => tree.clear();

  const insert = (target: ImageAnnotationTarget) => {
    const { minX, minY, maxX, maxY } = target.selector.geometry.bounds;
    tree.insert({ minX, minY, maxX, maxY, target });
  };

  const remove = (target: ImageAnnotationTarget) => {
    const item = {
      ...target.selector.geometry.bounds,
      target
    };

    tree.remove(item, (a, b) => a.target.annotation === b.target.annotation);
  };

  const update = (previous: ImageAnnotationTarget, updated: ImageAnnotationTarget) => {
    remove(previous);
    insert(updated);
  };

  const set = (targets: ImageAnnotationTarget[], replace: boolean = true) => {
    if (replace) tree.clear();

    tree.load(
      targets.map(target => {
        const { minX, minY, maxX, maxY } = target.selector.geometry.bounds;
        return { minX, minY, maxX, maxY, target };
      })
    );
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
