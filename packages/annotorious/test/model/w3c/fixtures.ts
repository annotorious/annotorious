export const annotations = [{
  '@context': 'http://www.w3.org/ns/anno.jsonld',
  id: 'http://www.example.com/annotation/95f9044c-73f5-4cef-82fb-2b3452bb75b9',
  type: 'Annotation',
  body: {
    type: 'TextualBody',
    value: 'A comment'
  },
  target: {
    source: 'http://www.example.com/source/1',
    selector: {
      type: 'SvgSelector',
      value:
        '<svg><polygon points="-3.3391678328504297,55.981986729065156 -3.3385026450445885,55.98198072676713 -3.3385002412005096,55.982064106273576 -3.339165429006351,55.98207010855867"/></svg>'
    }
  }
},{
  '@context': 'http://www.w3.org/ns/anno.jsonld',
  id: 'http://www.example.com/annotation/185fb0e5-a6e1-42c3-b97d-b7da3ad023b9',
  type: 'Annotation',
  body: {
    type: 'TextualBody',
    value: 'Another comment'
  },
  target: {
    source: 'http://www.example.com/source/1',
    selector: {
      type: 'SvgSelector',
      value:
        '<svg><ellipse cx="60" cy="80" rx="10" ry="10" /></svg>'
    }
  }
},{
  '@context': 'http://www.w3.org/ns/anno.jsonld',
  id: 'http://www.example.com/annotation/185fb0e5-a6e1-42c3-b97d-b7da3ad023b9',
  type: 'Annotation',
  body: {
    type: 'TextualBody',
    value: 'Another comment'
  },
  target: {
    source: 'http://www.example.com/source/1',
    selector: {
      type: 'SvgSelector',
      value:
          '<svg><path d="M150 5 L75 200 L225 200 Z" /></svg>'
    }
  }
}, {
  '@context': 'http://www.w3.org/ns/anno.jsonld',
  id: '31d824ce-089f-4bb3-9871-422bf9f2ef4f',
  type: 'Annotation',
  created: '2025-03-13T09:06:02.869Z',
  creator: {
    isGuest: true,
    id: 'zN5Es1Zl1sBw0JJxrtzF'
  },
  modified: '2025-03-13T10:24:24.531Z',
  body: [],
  target: {
    source: 'sample-image',
    selector: {
      type: 'SvgSelector',
      value: '<svg><g><path fill-rule="evenodd" d="M 478.65133212051086,234.49738591539688 L 583.0160670565832,232.59967525843268 L 595.9948440900438,324.5922113030464 L 461.84661911724714,316.5340511085419 Z M 518.2974615750816,263.18082664581027 L 513.8912115750816,300.21709653835717 L 564.9195329502184,308.68584653835717 L 554.8375017002184,262.56754539581027 Z" /></g></svg>'
    }
  }
}, {
  '@context': 'http://www.w3.org/ns/anno.jsonld',
  id: 'http://www.example.com/annotation/a263656a-3dfe-4720-aae4-7a5a49c2f53f',
  type: 'Annotation',
  body: [
    {
      type: 'TextualBody',
      value: 'Tag',
      purpose: 'tagging'
    }
  ],
  target: [
    {
      source: 'http://www.example.com/source/1',
      selector: [
        {
          type: 'FragmentSelector',
          conformsTo: 'http://www.w3.org/TR/media-frags/',
          value:
            'xywh=pixel:-3.2738759035123137,55.90719058505974,0.0010533766311744408,1.312127865062962E-4'
        }
      ]
    }
  ]
}, {
  '@context': 'http://www.w3.org/ns/anno.jsonld',
  id: 'http://www.example.com/annotation/185fb0e5-a6e1-42c3-b97d-b7da3ad023b9',
  type: 'Annotation',
  body: {
    type: 'TextualBody',
    value: 'Another comment'
  },
  target: {
    source: 'http://www.example.com/source/1',
    selector: {
      type: 'SvgSelector',
      value:
          '<svg><line x1="5" y1="12" x2="80" y2="73" /></svg>'
    }
  }
}, {
  '@context': 'http://www.w3.org/ns/anno.jsonld',
  id: 'e23b9018-54ed-495b-be64-9743f022e042',
  type: 'Annotation',
  body: {
    type: 'TextualBody',
    value: 'An open polyline shape'
  },
  target: {
    source: 'http://www.example.com/source/1',
    selector: {
      type: 'SvgSelector',
      value: '<svg><path d="M 50.78125 219.67578125 C 50.78125 219.67578125 75.96389964071403 157.08267008992672 94.890625 155.28515625 C 117.771484375 153.112109375 113.85371168438269 212.87971005682215 142.1796875 209.60546875 C 183.360546875 204.8453125 172.0125 143.442578125 201.1640625 133.36328125 C 230.315625 123.283984375 239.3515625 176.0078125 239.3515625 176.0078125" /></svg>'
    }
  }
}, {
  '@context': 'http://www.w3.org/ns/anno.jsonld',
  id: 'ce06734b-cc9a-462e-bb9f-b8c22c8c807d',
  type: 'Annotation',
  body: {
    type: 'TextualBody',
    value: 'A closed polyline shape'
  },
  target: {
    source: 'http://www.example.com/source/1',
    selector: {
      type: 'SvgSelector',
      value: '<svg><path d="M 365.265625 189.578125 C 365.265625 189.578125 404.5741221743005 131.09830721351068 458.25390625 95.0703125 C 529.4890625 47.259765625 495.0010688876879 84.52493640336786 543.5625 76.40234375 C 592.476953125 68.220703125 608.901380322465 47.514201252091596 618.984375 61.88671875 C 630.2692285695776 77.9723917645315 615.21875 191.6875 615.21875 191.6875 Z" /></svg>'
    }
  }
}];
