<script lang="ts">
  import Handle from '../Handle.svelte';
  import type { Rectangle, Shape } from '../../../model';
  import type { Transform } from '../../Transform';
  import { Editor } from '..';

  /** Props */
  export let shape: Rectangle;
  export let computedStyle: string | undefined;
  export let transform: Transform;
  export let viewportScale: number = 1;

  $: geom = shape.geometry;

  const editor = (rectangle: Shape, handle: string, delta: [number, number]) => {
    const initialBounds = rectangle.geometry.bounds;

    let [x0, y0] = [initialBounds.minX, initialBounds.minY];
    let [x1, y1] = [initialBounds.maxX, initialBounds.maxY];

    const [dx, dy] = delta;

    if (handle === 'SHAPE') {
      x0 += dx;
      x1 += dx;
      y0 += dy;
      y1 += dy;
    } else {
      switch (handle) {
        case 'TOP':
        case 'TOP_LEFT':
        case 'TOP_RIGHT': {
          y0 += dy;
          break;
        }

        case 'BOTTOM':
        case 'BOTTOM_LEFT':
        case 'BOTTOM_RIGHT': {
          y1 += dy;
          break;
        }
      }

      switch (handle) {
        case 'LEFT':
        case 'TOP_LEFT':
        case 'BOTTOM_LEFT': {
          x0 += dx;
          break;
        }

        case 'RIGHT':
        case 'TOP_RIGHT':
        case 'BOTTOM_RIGHT': {
          x1 += dx;
          break;
        }
      }
    }

    const x = Math.min(x0, x1);
    const y = Math.min(y0, y1);
    const w = Math.abs(x1 - x0);
    const h = Math.abs(y1 - y0);

    return {
      ...rectangle,
      geometry: {
        x, y, w, h,
        bounds: {
          minX: x,
          minY: y,
          maxX: x + w,
          maxY: y + h
        }
      }
    };
  }
</script>

<Editor
  shape={shape}
  transform={transform}
  editor={editor}
  on:grab
  on:change 
  on:release
  let:grab={grab}>

  <rect 
    class="a9s-outer"
    style={computedStyle ? 'display:none;' : undefined}
    on:pointerdown={grab('SHAPE')}
    x={geom.x} y={geom.y} width={geom.w} height={geom.h} />

  <rect 
    class="a9s-inner a9s-shape-handle"
    style={computedStyle}
    on:pointerdown={grab('SHAPE')}
    x={geom.x} y={geom.y} width={geom.w} height={geom.h} />

  <rect 
    class="a9s-edge-handle a9s-edge-handle-top" 
    on:pointerdown={grab('TOP')}
    x={geom.x} y={geom.y} height={1} width={geom.w} />

  <rect 
    class="a9s-edge-handle a9s-edge-handle-right"
    on:pointerdown={grab('RIGHT')}
    x={geom.x + geom.w} y={geom.y} height={geom.h} width={1}/>

  <rect 
    class="a9s-edge-handle a9s-edge-handle-bottom" 
    on:pointerdown={grab('BOTTOM')}
    x={geom.x} y={geom.y + geom.h} height={1} width={geom.w} />

  <rect 
    class="a9s-edge-handle a9s-edge-handle-left" 
    on:pointerdown={grab('LEFT')}
    x={geom.x} y={geom.y} height={geom.h} width={1} />

  <Handle
    class="a9s-corner-handle-topleft"
    on:pointerdown={grab('TOP_LEFT')}
    x={geom.x} y={geom.y}
    scale={viewportScale} /> 

  <Handle
    class="a9s-corner-handle-topright"
    on:pointerdown={grab('TOP_RIGHT')}
    x={geom.x + geom.w} y={geom.y} 
    scale={viewportScale} />
  
  <Handle 
    class="a9s-corner-handle-bottomright"
    on:pointerdown={grab('BOTTOM_RIGHT')}
    x={geom.x + geom.w} y={geom.y + geom.h} 
    scale={viewportScale} />
    
  <Handle 
    class="a9s-corner-handle-bottomleft"
    on:pointerdown={grab('BOTTOM_LEFT')}
    x={geom.x} y={geom.y + geom.h} 
    scale={viewportScale} />
</Editor>