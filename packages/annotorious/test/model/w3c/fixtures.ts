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
  "id": "31d824ce-089f-4bb3-9871-422bf9f2ef4f",
  "target": {
    "source": "sample-image",
    "selector": {
      "type": "SvgSelector",
      "value": "<svg><g><path fill-rule=\"evenodd\" d=\"M 478.65133212051086,234.49738591539688 L 583.0160670565832,232.59967525843268 L 595.9948440900438,324.5922113030464 L 461.84661911724714,316.5340511085419 Z M 518.2974615750816,263.18082664581027 L 513.8912115750816,300.21709653835717 L 564.9195329502184,308.68584653835717 L 554.8375017002184,262.56754539581027 Z\" /></g></svg>"
    }
  },
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "type": "Annotation",
  "body": [],
  "created": "2025-03-13T09:06:02.869Z",
  "creator": {
    "isGuest": true,
    "id": "zN5Es1Zl1sBw0JJxrtzF"
  },
  "modified": "2025-03-13T10:24:24.531Z"
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
}];
