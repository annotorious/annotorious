![Aerial view of Schönbrunn Palace in Vienna annotated with Annotorious](https://raw.githubusercontent.com/annotorious/annotorious/main/images/splash-image.jpg "Aerial view of Schönbrunn Palace in Vienna annotated with Annotorious")

# @annotorious/openseadragon

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
npm install @annotorious/openseadragon
```

### Creating an Annotator

To create an annotator, you can use the `createOSDAnnotator` function. This function takes an OpenSeadragon viewer instance and an options object as its arguments and returns an annotator instance.

```js
import { createOSDAnnotator } from '@annotorious/openseadragon';

const viewer = OpenSeadragon({
  id: "openseadragon-viewer",
  prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
  tileSources: "https://openseadragon.github.io/example-images/highsmith/highsmith.dzi"
});

const anno = createOSDAnnotator(viewer);
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

#### `createOSDAnnotator(viewer: OpenSeadragon.Viewer, options?: AnnotoriousOpts): OpenSeadragonAnnotator`

Creates an OpenSeadragon annotator instance.

- `viewer`: The OpenSeadragon viewer instance.
- `options`: Optional configuration options.

#### `OpenSeadragonAnnotator`

The `OpenSeadragonAnnotator` interface provides methods to interact with the annotator instance.

- `loadAnnotations(url: string): void`: Loads annotations from a file.
- `on(event: string, callback: Function): void`: Registers an event listener.
- `off(event: string, callback: Function): void`: Unregisters an event listener.
- `destroy(): void`: Destroys the annotator instance and cleans up resources.
- `cancelDrawing(): void`: Cancels the current drawing operation.
- `getDrawingTool(): string | undefined`: Gets the current drawing tool.
- `isDrawingEnabled(): boolean`: Checks if drawing is enabled.
- `fitBounds(arg: { id: string } | string, opts?: FitboundsOptions): void`: Fits the viewer to the bounds of the specified annotation.
- `fitBoundsWithConstraints(arg: { id: string } | string, opts?: FitboundsOptions): void`: Fits the viewer to the bounds of the specified annotation with constraints.
- `listDrawingTools(): string[]`: Lists all available drawing tools.
- `registerDrawingTool(name: string, tool: typeof SvelteComponent, opts?: DrawingToolOpts): void`: Registers a new drawing tool.
- `registerShapeEditor(shapeType: ShapeType, editor: typeof SvelteComponent): void`: Registers a new shape editor.
- `setDrawingTool(name: DrawingTool): void`: Sets the current drawing tool.
- `setDrawingEnabled(enabled: boolean): void`: Enables or disables drawing.
- `setModalSelect(modalSelect: boolean): void`: Enables or disables modal selection.
- `setTheme(theme: 'light' | 'dark' | 'auto'): void`: Sets the theme.

### Examples

#### Example 1: Basic Usage

```js
import { createOSDAnnotator } from '@annotorious/openseadragon';

const viewer = OpenSeadragon({
  id: "openseadragon-viewer",
  prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
  tileSources: "https://openseadragon.github.io/example-images/highsmith/highsmith.dzi"
});

const anno = createOSDAnnotator(viewer);

anno.loadAnnotations('./annotations.json');

anno.on('createAnnotation', function(annotation) {
  console.log('new annotation', annotation);
});
```

#### Example 2: Customizing the Annotator

```js
import { createOSDAnnotator } from '@annotorious/openseadragon';

const viewer = OpenSeadragon({
  id: "openseadragon-viewer",
  prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
  tileSources: "https://openseadragon.github.io/example-images/highsmith/highsmith.dzi"
});

const anno = createOSDAnnotator(viewer, {
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
