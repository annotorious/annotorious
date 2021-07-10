import assert from 'assert';
import WebAnnotation from '@recogito/recogito-client-core/src/WebAnnotation';
import { svgArea } from '../../src/selectors/EmbeddedSVG';

const fixtureAnnotation = new WebAnnotation({ 
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "#218d01ff-f077-4cc3-992d-1c81c426e51b",
  "type": "Annotation",
  "body": [{
    "type": "TextualBody",
    "value": "Evangelische Pfarrkirche Hallstatt"
  }],
  "target": {
    "selector": [{
      "type": "SvgSelector",
      "value": "<svg><polygon points='172,160 199,15 223,6 239,132 244,173 285,179 313,208 313,251 218,306 170,290 172,160'></polygon></svg>"
    }]
  }
});

describe('svgArea', function() {
  it('should return a non-zero value for polygon annotations', () => {
    const area = svgArea(fixtureAnnotation);
    assert(area > 0);
  });
});