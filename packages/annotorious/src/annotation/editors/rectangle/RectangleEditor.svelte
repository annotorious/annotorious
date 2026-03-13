<script lang="ts">
  import { onMount } from 'svelte';
  import Handle from '../Handle.svelte';
  import { getMaskDimensions } from '../../utils';
  import type { Rectangle, RectangleGeometry, Shape } from '../../../model';
  import type { Transform } from '../../Transform';
  import { Editor } from '..';
  import {
    getRotatedCorners,
    getBoundsFromRotatedRect,
    getRotationHandlePosition,
    transformDeltaToLocalCoords,
    angleFromPoints,
    snapAngle
  } from './rotationUtils';

  /** Props */
  export let shape: Rectangle;
  export let computedStyle: string | undefined;
  export let transform: Transform;
  export let viewportScale: number = 1;
  export let svgEl: SVGSVGElement;

  let shiftPressed = false;

  $: ROTATION_HANDLE_OFFSET = 20 / viewportScale;

  $: geom = shape.geometry;
  $: rotatedCorners = getRotatedCorners(geom.x, geom.y, geom.w, geom.h, geom.rot);
  $: rotationHandlePos = getRotationHandlePosition(geom, ROTATION_HANDLE_OFFSET);

  const editor = (rectangle: Shape, handle: string, delta: [number, number]) => {
    let { x, y, w, h, rot } = (rectangle.geometry as RectangleGeometry);

    const [dx, dy] = delta;

    if (handle === 'ROTATION') {
      const handlePos = getRotationHandlePosition(rectangle.geometry as RectangleGeometry, ROTATION_HANDLE_OFFSET);
      
      // Handle position after moving by delta
      const currentHandleX = handlePos[0] + dx;
      const currentHandleY = handlePos[1] + dy;

      // Calculate the new rotation angle
      const center: [number, number] = [x + w / 2, y + h / 2];
      rot += angleFromPoints([handlePos[0], handlePos[1]], [currentHandleX, currentHandleY], center);
      
      // Snap to 10 degrees if SHIFT is held
      if (shiftPressed)
        rot = snapAngle(rot);
    } else if (handle === 'SHAPE') {
      // Moving the entire shape - translate it without rotation change
      x += dx;
      y += dy;
    } else {
      // Edge or corner handle - resize in local (rotated) coordinate space
      let localX0 = 0;
      let localY0 = 0;
      let localX1 = w;
      let localY1 = h;

      const [localDx, localDy] = rot !== 0 
        ? transformDeltaToLocalCoords(dx, dy, rot)
        : [dx, dy];

      switch (handle) {
        case 'TOP':
        case 'TOP_LEFT':
        case 'TOP_RIGHT':
          localY0 += localDy;
          break;
        case 'BOTTOM':
        case 'BOTTOM_LEFT':
        case 'BOTTOM_RIGHT':
          localY1 += localDy;
          break;
      }

      switch (handle) {
        case 'LEFT':
        case 'TOP_LEFT':
        case 'BOTTOM_LEFT':
          localX0 += localDx;
          break;
        case 'RIGHT':
        case 'TOP_RIGHT':
        case 'BOTTOM_RIGHT':
          localX1 += localDx;
          break;
      }

      // The center shifts as edges move - calculate new center in local space
      const newLocalCx = (localX0 + localX1) / 2;
      const newLocalCy = (localY0 + localY1) / 2;

      w = Math.abs(localX1 - localX0);
      h = Math.abs(localY1 - localY0);

      // Rotate the local center offset back to world space
      const oldCenter: [number, number] = [
        x + (rectangle.geometry as RectangleGeometry).w / 2, 
        y + (rectangle.geometry as RectangleGeometry).h / 2
      ];

      const localCenterOffset: [number, number] = [
        newLocalCx - (rectangle.geometry as RectangleGeometry).w / 2, 
        newLocalCy - (rectangle.geometry as RectangleGeometry).h / 2
      ];

      const cos = Math.cos(rot);
      const sin = Math.sin(rot);

      const worldCx = oldCenter[0] + localCenterOffset[0] * cos - localCenterOffset[1] * sin;
      const worldCy = oldCenter[1] + localCenterOffset[0] * sin + localCenterOffset[1] * cos;

      x = worldCx - w / 2;
      y = worldCy - h / 2;
    }

    // Calculate new bounds
    const bounds = getBoundsFromRotatedRect(x, y, w, h, rot);

    return {
      ...rectangle,
      geometry: {
        x, y, w, h, rot,
        bounds
      }
    };
  }

  onMount(() => {
    // Track SHIFT key
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === 'Shift') shiftPressed = true;
    }

    const onKeyUp = (evt: KeyboardEvent) => {
      if (evt.key === 'Shift') shiftPressed = false;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  });

  $: mask = getMaskDimensions(geom.bounds, 5 / viewportScale);
  
  const maskId = `rect-mask-${Math.random().toString(36).substring(2, 12)}`;
</script>

<Editor
  shape={shape}
  transform={transform}
  editor={editor}
  svgEl={svgEl}
  on:grab
  on:change 
  on:release
  let:grab={grab}>

  <defs>
    <mask id={maskId} class="a9s-rectangle-editor-mask">
      <rect class="rect-mask-bg" x={mask.x} y={mask.y} width={mask.w} height={mask.h} />
      <polygon
        class="rect-mask-fg"
        points={rotatedCorners.map(c => `${c[0]},${c[1]}`).join(' ')} />
    </mask>
  </defs>

  <!-- Rotation handle -->
  <g>
    <line
      class="a9s-rotation-handle-line-bg"
      x1={rotatedCorners[0][0] + (rotatedCorners[1][0] - rotatedCorners[0][0]) / 2}
      y1={rotatedCorners[0][1] + (rotatedCorners[1][1] - rotatedCorners[0][1]) / 2}
      x2={rotationHandlePos[0]}
      y2={rotationHandlePos[1]}
      pointer-events="none" />

    <line
      class="a9s-rotation-handle-line-fg"
      x1={rotatedCorners[0][0] + (rotatedCorners[1][0] - rotatedCorners[0][0]) / 2}
      y1={rotatedCorners[0][1] + (rotatedCorners[1][1] - rotatedCorners[0][1]) / 2}
      x2={rotationHandlePos[0]}
      y2={rotationHandlePos[1]}
      pointer-events="none" />

    <Handle
      class="a9s-rotation-handle"
      on:pointerdown={grab('ROTATION')}
      x={rotationHandlePos[0]} y={rotationHandlePos[1]}
      scale={viewportScale} />
  </g>

  <!-- Rectangle shape -->
  <g>
    <polygon
      class="a9s-outer"
      mask={`url(#${maskId})`}
      on:pointerdown={grab('SHAPE')}
      points={rotatedCorners.map(c => `${c[0]},${c[1]}`).join(' ')} />

    <polygon
      class="a9s-inner a9s-shape-handle"
      style={computedStyle}
      on:pointerdown={grab('SHAPE')}
      points={rotatedCorners.map(c => `${c[0]},${c[1]}`).join(' ')} />
  </g>

  <!-- Edge handles -->
  <line
    class="a9s-edge-handle a9s-edge-handle-top"
    x1={rotatedCorners[0][0]} y1={rotatedCorners[0][1]}
    x2={rotatedCorners[1][0]} y2={rotatedCorners[1][1]}
    on:pointerdown={grab('TOP')} />

  <line
    class="a9s-edge-handle a9s-edge-handle-right"
    x1={rotatedCorners[1][0]} y1={rotatedCorners[1][1]}
    x2={rotatedCorners[2][0]} y2={rotatedCorners[2][1]}
    on:pointerdown={grab('RIGHT')} />

  <line
    class="a9s-edge-handle a9s-edge-handle-bottom"
    x1={rotatedCorners[2][0]} y1={rotatedCorners[2][1]}
    x2={rotatedCorners[3][0]} y2={rotatedCorners[3][1]}
    on:pointerdown={grab('BOTTOM')} />

  <line
    class="a9s-edge-handle a9s-edge-handle-left"
    x1={rotatedCorners[3][0]} y1={rotatedCorners[3][1]}
    x2={rotatedCorners[0][0]} y2={rotatedCorners[0][1]}
    on:pointerdown={grab('LEFT')} />

  <!-- Corner handles -->
  <Handle
    class="a9s-corner-handle-topleft"
    on:pointerdown={grab('TOP_LEFT')}
    x={rotatedCorners[0][0]} y={rotatedCorners[0][1]}
    scale={viewportScale} /> 

  <Handle
    class="a9s-corner-handle-topright"
    on:pointerdown={grab('TOP_RIGHT')}
    x={rotatedCorners[1][0]} y={rotatedCorners[1][1]} 
    scale={viewportScale} />
  
  <Handle 
    class="a9s-corner-handle-bottomright"
    on:pointerdown={grab('BOTTOM_RIGHT')}
    x={rotatedCorners[2][0]} y={rotatedCorners[2][1]} 
    scale={viewportScale} />
    
  <Handle 
    class="a9s-corner-handle-bottomleft"
    on:pointerdown={grab('BOTTOM_LEFT')}
    x={rotatedCorners[3][0]} y={rotatedCorners[3][1]} 
    scale={viewportScale} />
</Editor>

<style>
  mask.a9s-rectangle-editor-mask rect.rect-mask-bg {
    fill: #fff;
  }

  mask.a9s-rectangle-editor-mask polygon.rect-mask-fg {
    fill: #000;
  }

  :global(.a9s-edge-handle) {
    stroke-width: 4px;
    stroke: rgba(0, 0, 0, 0.1);
    pointer-events: stroke;
    vector-effect: non-scaling-stroke;
  }

  :global(.a9s-rotation-handle-line-bg) {
    stroke: rgba(0, 0, 0, 0.5);
    stroke-width: 1.5px;
    vector-effect: non-scaling-stroke;
  }

  :global(.a9s-rotation-handle-line-fg) {
    stroke: #fff;
    stroke-width: 1px;
    stroke-dasharray: 3 1;
    vector-effect: non-scaling-stroke;
  }
</style>