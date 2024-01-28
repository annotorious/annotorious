# Annotorious: Image Annotation Made Simple

Welcome to Annotorious, a versatile and lightweight library for adding image annotation capability to any web page.

## Annotorious at a Glance

Annotorious supports both regular images and the [OpenSeadragon](https://openseadragon.github.io) viewer for zoomable images and [IIIF](https://iiif.io/). 

- The main `@annotorious/annotorious` package provides a straightforward solution for standard images.
- The `@annotorious/openseadragon` contains everything you need for annotating OpenSeadragon images.
- The `@annotorious/react` package includes React bindings for both versions.

## Quick Start: Standard Images

```bash
npm install --save @annotorious/annotorious
```

```js
import { createImageAnnotator } from '@annotorious/annotorious';

// Import essential CSS styles
import '@annotorious/annotorious/annotorious.css';

// Image element ID or DOM element
const anno = createImageAnnotator('sample-image');
```

Read the [full guide for using Annotorious with standard images](getting-started-image.md) or see the [API docs for the ImageAnnotator](api/ImageAnnotator.md). 

## Quick Start: OpenSeadragon

```bash
npm install --save @annotorious/openseadragon
```

```js
import { createOSDAnnotator } from '@annotorious/openseadragon';

// Import essential CSS styles
import '@annotorious/annotorious/annotorious-openseadragon.css';

window.onload = function() {
  var viewer = OpenSeadragon({
    id: 'openseadragon',
    tileSources: {
      type: 'image',
      url:  '/my-image.jpg'
    }
  });

  var anno = createOSDAnnotator(viewer);
}
```

Read the [full Annotorious OpenSeadragon guide](getting-started-osd.md) or see the [API docs for the OpenSeadragonAnnotator](ap/OpenSeadragonAnnotator.md).

## Quick Start: React

```bash
npm install --save @annotorious/react
```

```tsx
import { Annotorious, ImageAnnotator } from '@annotorious/react';

import '@annotorious/react/annotorious-react.css';

export default function App() {
  return (
    <Annotorious>
      <ImageAnnotator>
        <img src="example.jpg" />
      </ImageAnnotator>
    </Annotorious>
  );
}
```

Annotorious provides hooks for interacting with the `anno` ImageAnnotator instance and other API functions.

```tsx
const anno = useAnnotator();
```

Read the full guides for using Annotorious React [for images](react/getting-started-image.md) or [with OpenSeadragon](react/getting-started-osd.md)).


