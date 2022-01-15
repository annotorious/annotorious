export const polygonArea = points => {
  let area = 0;
  let j = points.length - 1;

  for (let i=0; i < points.length; i++) {
    area += (points[j][0] + points[i][0]) * (points[j][1] - points[i][1]);
    j = i;
  }

  return Math.abs(0.5 * area);
}

export const pointInPolygon = (xy, points) => {
  // Algorithm checks, if xy is in Polygon
  // algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
  const x = xy[0];
  const y = xy[1];
  
  let inside = false;

  for (let i=0, j=points.length-1; i < points.length; j=i++) {
    const xi = points[i][0], yi = points[i][1];
    const xj = points[j][0], yj = points[j][1];
    
    const intersect = ((yi > y) != (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
      if (intersect)
        inside = !inside;
  }
  
  return inside;
}

export const polygonInPolygon = (polygonA, polygonB) => {
  for (let point of polygonA) {
    if (!pointInPolygon(point, polygonB)) 
      return false
  }

  return true;
}