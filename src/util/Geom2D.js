/**
 * Computes the area of the polygon defined by
 * the given conrner points.
 * @param {Array} points 
 * @returns {number} the area
 */
export const polygonArea = points => {
  let area = 0;
  let j = points.length - 1;

  for (let i=0; i < points.length; i++) {
    area += (points[j][0] + points[i][0]) * (points[j][1] - points[i][1]);
    j = i;
  }

  return Math.abs(0.5 * area);
}

/**
 * Hit test: checks if this point is inside the circle.
 * @param {Array} point the point [x, y]
 * @param {number} cx circle center x
 * @param {number} cy circle center y
 * @param {number} r circle radius
 * @returns {boolean} 
 */
export const pointInCircle = (point, cx, cy, r) => {
  const dx = point[0] - cx;
  const dy = point[1] - cy;

  const d = Math.sqrt(dx * dx + dy * dy);
  return d <= r;
}

/**
 * Hit test: checks if this point is inside the ellipse.
 * Cf. https://github.com/w8r/point-in-ellipse
 * @param {Array} point the point [x, y] 
 * @param {number} cx ellipse center x 
 * @param {number} cy ellipse center y
 * @param {number} rx ellipse x radius
 * @param {number} ry ellipse y radius
 * @param {number=} rotation ellipse rotation 
 * @returns {boolean}
 */
export const pointInEllipse = (point, cx, cy, rx, ry, rotation) => {
  const rot = rotation || 0;

  const cos = Math.cos(rot);
  const sin = Math.sin(rot);

  const dx  = point[0] - cx;
  const dy  = point[1] - cy;

  const tdx = cos * dx + sin * dy;
  const tdy = sin * dx - cos * dy;

  return (tdx * tdx) / (rx * rx) + (tdy * tdy) / (ry * ry) <= 1;
}

/**
 * Hit test: checks if this point is inside the polygon.
 * @param {Array} xy the point [x, y]
 * @param {Array<number>} points polygon corner points 
 * @returns {boolean}
 */
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

/**
 * Checks if polygon A is contained fully inside polygon B.
 * @param {Array<Array<number>>} polygonA array of points [x, y] 
 * @param {Array<Array<number>>} polygonB array of points [x, y]
 * @returns {boolean}
 */
export const polygonInPolygon = (polygonA, polygonB) => {
  for (let point of polygonA) {
    if (!pointInPolygon(point, polygonB)) 
      return false
  }

  return true;
}

/**
 * A utility helper that parses an SVG path into 
 * a list of polygons.
 * @param {SVGElement} path the SVG path
 * @returns {Array<Array<Array<number>>>} list of polygons 
 */
export const svgPathToPolygons = path => {
  const commands = path.getAttribute('d')
    .split(/(?=M|m|L|l|H|h|V|v|Z|z)/g)
    .map(str => str.trim());

  const polygons = [];

  let points = [];

  for (let cmd of commands) {
    const op = cmd.substring(0, 1);

    if (op.toLowerCase() === 'z') {
      polygons.push([...points]);
      points = [];
    } else {
      const xy = cmd.substring(1).split(' ')
        .map(str => parseFloat(str.trim()));
  
      // Uppercase ops are absolute coords -> transform
      const isUppercase = op === op.toUpperCase();

      const x = isUppercase ? xy[0] : xy[0] + points[points.length - 1][0];
      const y = isUppercase ? xy[1] : xy[1] + points[points.length - 1][1];

      points.push([x, y]);
    }
  }

  if (points.length > 0) // Unclosed path - close for area computation
    polygons.push([...points]); 

  return polygons;
}