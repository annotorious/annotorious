import assert from 'assert';
import { svgArea } from '../../src/selectors/EmbeddedSVG';

const POINTS = [
  [172,210],
  [456,169],
  [440.6346478496909,62.56682900761504],
  [156.6346478496909,103.56682900761504]
];

describe('polygonArea', function() {
  it('should return a non-zero value for the test point array', () => {
    const area = svgArea(POINTS);
    assert(area > 0);
  });
});