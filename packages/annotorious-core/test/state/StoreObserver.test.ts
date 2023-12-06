import { describe, it, expect } from 'vitest';
import { dequal } from 'dequal/lite';
import { mergeChanges, type ChangeSet } from '../../src/state';
import { CHANGES } from './StoreObserver.fixtures';
import type { Annotation } from '../../src/model';

const EXPECTED = {
  "created": [{
    "id": "98fe2de2-ed9a-4dc0-808d-5cebf611e4be",
    "bodies": [],
    "target": {
      "annotation": "98fe2de2-ed9a-4dc0-808d-5cebf611e4be",
      "selector": {
        "type": "RECTANGLE",
        "geometry": {
          "bounds": {
            "minX": 308.4296875,
            "minY": 77.0703125,
            "maxX": 427.09765625,
            "maxY": 236.3671875
          },
          "x": 308.4296875,
          "y": 77.0703125,
          "w": 118.66796875,
          "h": 159.296875
        }
      },
      "creator": {
        "isGuest": true,
        "id": "pSmekFNpfoQ5ZYTQ9Tx4"
      },
      "created": "2023-12-06T14:49:34.189Z"
    }
  }],
  "updated": [{
    "oldValue": {
      "@context": "http://www.w3.org/ns/anno.jsonld",
      "id": "#a88b22d0-6106-4872-9435-c78b5e89fede",
      "type": "Annotation",
      "body": [
        {
          "type": "TextualBody",
          "value": "It's Hallstatt in Upper Austria"
        },
        {
          "type": "TextualBody",
          "purpose": "tagging",
          "value": "Hallstatt"
        },
        {
          "type": "TextualBody",
          "purpose": "tagging",
          "value": "Upper Austria"
        }
      ],
      "target": {
        "annotation": "#a88b22d0-6106-4872-9435-c78b5e89fede",
        "selector": {
          "type": "RECTANGLE",
          "geometry": {
            "x": 273,
            "y": 171,
            "w": 123,
            "h": 94,
            "bounds": {
              "minX": 273,
              "minY": 171,
              "maxX": 396,
              "maxY": 265
            }
          }
        }
      },
      "bodies": [
        {
          "id": "temp--490253676",
          "annotation": "#a88b22d0-6106-4872-9435-c78b5e89fede",
          "type": "TextualBody",
          "value": "It's Hallstatt in Upper Austria"
        },
        {
          "id": "temp--604705042",
          "annotation": "#a88b22d0-6106-4872-9435-c78b5e89fede",
          "type": "TextualBody",
          "purpose": "tagging",
          "value": "Hallstatt"
        },
        {
          "id": "temp--1305583970",
          "annotation": "#a88b22d0-6106-4872-9435-c78b5e89fede",
          "type": "TextualBody",
          "purpose": "tagging",
          "value": "Upper Austria"
        }
      ]
    },
    "newValue": {
      "@context": "http://www.w3.org/ns/anno.jsonld",
      "id": "#a88b22d0-6106-4872-9435-c78b5e89fede",
      "type": "Annotation",
      "body": [
        {
          "type": "TextualBody",
          "value": "It's Hallstatt in Upper Austria"
        },
        {
          "type": "TextualBody",
          "purpose": "tagging",
          "value": "Hallstatt"
        },
        {
          "type": "TextualBody",
          "purpose": "tagging",
          "value": "Upper Austria"
        }
      ],
      "target": {
        "annotation": "#a88b22d0-6106-4872-9435-c78b5e89fede",
        "selector": {
          "type": "RECTANGLE",
          "geometry": {
            "x": 487.109375,
            "y": 31.7109375,
            "w": 123,
            "h": 94,
            "bounds": {
              "minX": 487.109375,
              "minY": 31.7109375,
              "maxX": 610.109375,
              "maxY": 125.7109375
            }
          }
        },
        "updated": "2023-12-06T14:43:32.922Z",
        "updatedBy": {
          "isGuest": true,
          "id": "pSmekFNpfoQ5ZYTQ9Tx4"
        }
      },
      "bodies": [
        {
          "id": "temp--490253676",
          "annotation": "#a88b22d0-6106-4872-9435-c78b5e89fede",
          "type": "TextualBody",
          "value": "It's Hallstatt in Upper Austria"
        },
        {
          "id": "temp--604705042",
          "annotation": "#a88b22d0-6106-4872-9435-c78b5e89fede",
          "type": "TextualBody",
          "purpose": "tagging",
          "value": "Hallstatt"
        },
        {
          "id": "temp--1305583970",
          "annotation": "#a88b22d0-6106-4872-9435-c78b5e89fede",
          "type": "TextualBody",
          "purpose": "tagging",
          "value": "Upper Austria"
        }
      ]
    },
    "targetUpdated": {
      "oldTarget": {
        "annotation": "#a88b22d0-6106-4872-9435-c78b5e89fede",
        "selector": {
          "type": "RECTANGLE",
          "geometry": {
            "x": 273,
            "y": 171,
            "w": 123,
            "h": 94,
            "bounds": {
              "minX": 273,
              "minY": 171,
              "maxX": 396,
              "maxY": 265
            }
          }
        }
      },
      "newTarget": {
        "annotation": "#a88b22d0-6106-4872-9435-c78b5e89fede",
        "selector": {
          "type": "RECTANGLE",
          "geometry": {
            "x": 487.109375,
            "y": 31.7109375,
            "w": 123,
            "h": 94,
            "bounds": {
              "minX": 487.109375,
              "minY": 31.7109375,
              "maxX": 610.109375,
              "maxY": 125.7109375
            }
          }
        },
        "updated": "2023-12-06T14:43:32.922Z",
        "updatedBy": {
          "isGuest": true,
          "id": "pSmekFNpfoQ5ZYTQ9Tx4"
        }
      }
    }
  }],
  "deleted": []
} as unknown as ChangeSet<Annotation>;

describe('mergeChanges', () => {

  it('should properly merge change events', () => {
    const [first, ...rest] = CHANGES as unknown as ChangeSet<Annotation>[];

    const merged = rest.reduce((merged, change) => mergeChanges(merged, change), first);

    expect(dequal(merged.created, EXPECTED.created)).toBe(true);
    expect(dequal(merged.deleted, EXPECTED.deleted)).toBe(true);

    expect(merged.updated.length).toBe(1);

    const mergedUpdate = merged.updated[0];
    const expectedUpdate = EXPECTED.updated[0];

    expect(dequal(mergedUpdate.oldValue, expectedUpdate.oldValue)).toBe(true);
    expect(dequal(mergedUpdate.newValue, expectedUpdate.newValue)).toBe(true);
    expect(dequal(mergedUpdate.targetUpdated, expectedUpdate.targetUpdated)).toBe(true);
  });


});