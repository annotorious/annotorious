<script type="ts">
  import type { PresentUser } from '@annotorious/core';
  import type { ImageAnnotation, PolygonGeometry } from '@annotorious/annotorious/src';
  import SVGPresenceLabel from '../SVGPresenceLabel.svelte';

  export let annotation: ImageAnnotation;

  export let user: PresentUser;

  export let scale: number;

  $: geom = annotation.target.selector.geometry as PolygonGeometry;

  $: origin = getHighestPoint(geom);

  const getHighestPoint = (geom: PolygonGeometry) => {
    let [highestPoint, ...rest] = geom.points;

    rest.forEach(([x, y]) => {
      if (y < highestPoint[1])
        highestPoint = [x,y];
    });

    return highestPoint;
  }
</script>

<g class="a9s-presence-overlay">
  <SVGPresenceLabel 
    scale={scale} 
    user={user} 
    x={origin[0]} y={origin[1]} 
    hAlign="CENTER" />
  
  <polygon
    class="a9s-presence-shape a9s-presence-polygon"
    stroke={user.appearance.color}
    fill="transparent"
    points={geom.points.map(xy => xy.join(',')).join(' ')} />
</g>

<style>
  polygon {
    stroke-width: 1.2;
    vector-effect: non-scaling-stroke;
  }
</style>