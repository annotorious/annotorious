![Aerial view of Schönbrunn Palace in Vienna annotated with Annotorious](/docs/images/splash-image.jpg "Aerial view of Schönbrunn Palace in Vienna annotated with Annotorious")

> __IMPORTANT__ This repository is work in progress. I am building the next major release of Annotorious. If you 
> are looking for the most recent official release, [visit the main project homepage](https://annotorious.github.io). 
> Documentation in this Readme __is only for the upcoming alpha release__ and __will not work with Annotorious 2.7.x!__ 

# Annotorious 3.0 Beta

Add image annotation functionality to any Web page with a few lines of JavaScript.

- [Getting Started](#getting-started)
- [Using with OpenSeadragon](#using-with-openseadragon)
- [Using in React](#using-in-react)
- [Contributing](#contributing)

Support this project with a one-time or recurring donation on [SteadyHQ](https://steadyhq.com/rainer-simon).

## Getting Started

```sh
npm install --save @annotorious/annotorious
```

```js
import { createImageAnnotator } from '@annotorious/annotorious';

// Import essential CSS styles
import '@annotorious/annotorious/annotorious.css';

// Image element ID or DOM element
const anno = createImageAnnotator('sample-image');

// Load annotations in W3C Web Annotation format
anno.loadAnnotations('./annotations.w3c.json');
       
// Attach listeners to handle annotation events
anno.on('createAnnotation', function(annotation) {
  console.log('created', annotation);
});
```

### Script Import via CDN

```html
<html>
  <head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@annotorious/annotorious@latest/dist/annotorious.css">
    <script src="https://cdn.jsdelivr.net/npm/@annotorious/annotorious@latest/dist/annotorious.js"></script>
  </head>
  <body>
    <img id="my-image" src="my-image.jpg" />

    <script>
      window.onload = function() {
        var anno = Annotorious.createImageAnnotator('my-image');
      }
    </script>
  </body>
</html>
```

## Using with OpenSeadragon

Annotorious provides seamless integration with the [OpenSeadragon](https://openseadragon.github.io/)
viewer for zoomable images and IIIF. __Note that Annotorious requires OpenSeadragon 3 or higher__.

```sh
npm install @annotorious/openseadragon
```

```js
import { createOSDAnnotator } from '@annotorious/openseadragon';

// Import essential CSS styles
import '@annotorious/annotorious/annotorious-openseadragon.css';

// Create OpenSeadragon viewer first
window.onload = function() {
  var viewer = OpenSeadragon({
    id: 'openseadragon',
    tileSources: {
      type: 'image',
      url:  '/my-image.jpg'
    }
  });

  // Create Annotorious
  var anno = createOSDAnnotator(viewer);

  // Load annotations in W3C Web Annotation format
  anno.loadAnnotations('./annotations.w3c.json');
       
  // Attach listeners to handle annotation events
  anno.on('createAnnotation', function(annotation) {
    console.log('created', annotation);
  });
}
```

### Script Import via CDN

```html
<html>
  <head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@annotorious/openseadragon@latest/dist/annotorious-openseadragon.css">
    <script src="https://cdn.jsdelivr.net/npm/@annotorious/openseadragon@latest/dist/annotorious-openseadragon.js"></script>
  </head>
  <body>
    <div id="openseadragon"></div>

    <script>
      window.onload = function() {
        var viewer = OpenSeadragon({
          id: 'openseadragon',
          tileSources: {
            type: 'image',
            url:  '/my-image.jpg'
          }
        });
        
        var anno = AnnotoriousOSD.createOSDAnnotator(viewer);
      }
    </script>
  </body>
</html>
```

## Using with React

Annotorious provides React bindings for both the standard and the OpenSeadragon module.

```sh
npm install @annotorious/react
```

```jsx
import { Annotorious, ImageAnnotator } from '@annotorious/react';

import '@annotorious/react/annotorious-react.css';

export function AnnotatableImage() => {

  return (
    <Annotorious>
      <ImageAnnotator>
        <img src="my-image.jpg" alt="Example" />
      </ImageAnnotator>
    </Annotorious>
  )

}
```

## Contributing

Want to help make Annotorious better? There are many ways to get involved - including some that require little
or no coding experience!

Check the list of current [open issues](https://github.com/annotorious/annotorious/issues), in particular those with the [help wanted](https://github.com/annotorious/annotorious-v3/issues?q=is%3Aissue+is%3Aopen+label%3A"help+wanted") tag. See the [Contribution Guide](contributing.md) to learn more.


