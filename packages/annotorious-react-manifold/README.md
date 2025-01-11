# @annotorious/react-manifold

Add image annotation functionality to any web page with a few lines of JavaScript. Visit the
[project website](https://annotorious.dev) for documentation and live demos.

## Community

Visit the [Discussion Forum](https://github.com/annotorious/annotorious/discussions) for community support, or file an
issue on the [Issue Tracker](https://github.com/annotorious/annotorious/issues).

## Become a Sponsor

Using Annotorious at work? Become a sponsor! Your support helps me cover hosting costs, spend more 
time supporting the community, and make Annotorious better for everyone. [Make a one-time or monthly
donation via my SteadyHQ account](https://steadyhq.com/rainer-simon).

## Detailed Documentation

### Core Concepts

Annotorious is a JavaScript library that provides image annotation functionality. It allows users to create, edit, and manage annotations on images. The library is designed to be easy to use and integrate into any web application.

### Installation

To install Annotorious, you can use npm:

```sh
npm install @annotorious/react-manifold
```

### Creating an Annotator

To create an annotator, you can use the `createImageAnnotator` function. This function takes an image element or the ID of an image element as its argument and returns an annotator instance.

```js
import { createImageAnnotator } from '@annotorious/react-manifold';

const anno = createImageAnnotator('image-to-annotate');
```

### Loading Annotations

To load annotations from a file, you can use the `loadAnnotations` method of the annotator instance. This method takes the URL of the annotations file as its argument.

```js
anno.loadAnnotations('./annotations.json');
```

### Listening to Events

Annotorious provides several events that you can listen to. For example, you can listen to the `createAnnotation` event to get notified when a new annotation is created.

```js
anno.on('createAnnotation', function(annotation) {
  console.log('new annotation', annotation);
});
```

### API Reference

#### `createImageAnnotator(image: string | HTMLImageElement | HTMLCanvasElement, options?: AnnotoriousOpts): ImageAnnotator`

Creates an image annotator instance.

- `image`: The image element or the ID of the image element to annotate.
- `options`: Optional configuration options.

#### `ImageAnnotator`

The `ImageAnnotator` interface provides methods to interact with the annotator instance.

- `loadAnnotations(url: string): void`: Loads annotations from a file.
- `on(event: string, callback: Function): void`: Registers an event listener.
- `off(event: string, callback: Function): void`: Unregisters an event listener.
- `destroy(): void`: Destroys the annotator instance and cleans up resources.

### Examples

#### Example 1: Basic Usage

```js
import { createImageAnnotator } from '@annotorious/react-manifold';

const anno = createImageAnnotator('image-to-annotate');

anno.loadAnnotations('./annotations.json');

anno.on('createAnnotation', function(annotation) {
  console.log('new annotation', annotation);
});
```

#### Example 2: Customizing the Annotator

```js
import { createImageAnnotator } from '@annotorious/react-manifold';

const anno = createImageAnnotator('image-to-annotate', {
  drawingEnabled: true,
  drawingMode: 'click',
  userSelectAction: 'EDIT',
  theme: 'dark'
});

anno.loadAnnotations('./annotations.json');

anno.on('createAnnotation', function(annotation) {
  console.log('new annotation', annotation);
});
```
