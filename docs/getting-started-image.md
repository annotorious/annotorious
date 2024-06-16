> This is documentation for the upcoming v3 of Annotorious. For the latest official v2.x release see the [Annotorious project website](_https://annotorious.github.io_)

# Getting Started

This guide is for the vanilla JavaScript version of Annotorious. For React documentation, [see here](react/image-annotator.md)

## Installation

```sh
npm install --save @annotorious/annotorious
```

Create an annotator instance on an existing Image element.

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

## createImageAnnotator(image, options?)

`createImageAnnotator` creates a new [ImageAnnotator](api/ImageAnnotator.md) instance on an existing HTML image element.

| Arg     | Type                                  | Description               |
|---------|---------------------------------------|---------------------------|
| `image`   | `string` \| `HTMLImageElement`      | DOM element ID or element |
| `options` | [AnnotoriousOpts](#annotoriousopts) | Init options (optional)   |

## AnnotoriousOpts

| Arg                   | Type                                            | Default       |
|-----------------------|-------------------------------------------------|---------------|
| `adapter`             | [FormatAdapter](#formatadapter)                 | -             |
| `autoSave`            | `boolean`                                       | `false`       |
| `drawingEnabled`      | `boolean`                                       | `true`        |
| `drawingMode`         | `'click'` \| `'drag'`                           | `'drag'`      |
| `pointerSelectAction` | [PointerSelectDefinition](#pointerselectaction) | `'EDIT'`      |
| `style`               | [StyleDefinition](#style)                       | -             |
| `theme`               | `'dark'` \| `'light'` \| `'auto'`               | `'light'`     |

## FormatAdapter

The `adapter` prop is an optional object that introduces crosswalk functionality between Annotorious' internal annotation data model and different standards. This allows seamless integration of external annotation standards, such as the [W3C Web Annotation standard](https://www.w3.org/TR/annotation-model/), into Annotorious. The adapter will handle the process of parsing and serializing annotations between Annotorious' internal format and the chosen external standard for you. 

When using a format adapter, it impacts all methods of the vanilla `anno` ImageAnnotator instance. Currently, the W3C adapter is only available adapter for Annotorious.

```js
import { createImageAnnotator, W3CImageFormat } from '@annotorious/annotorious';

const anno = createImageAnnotator('sample-image', {
  adapter: W3CImageFormat()
});
```

## PointerSelectAction

The `pointerSelectAction` prop controls the behavior when a user clicks or taps on an annotation. Valid values for pointerSelectAction are `EDIT`, `SELECT`, and `NONE`.

- __EDIT__ makes the annotation editable, allowing the users to modify its shape.

- __SELECT__ ensures that clicking an annotation will trigger the relevant selection lifecycle events of the API. However, the annotation will not become editable.

- __NONE__ renders the annotation inert. Clicking on it will have no effect.

You can directly assign one of these values to pointerSelectAction. For example:

```ts
import { createImageAnnotator, PointerSelectionAction, W3CImageFormat } from '@annotorious/annotorious';

const anno = createImageAnnotator('sample-image', {
  pointerSelectAction: PointerSelectAction.EDIT
});
```

Alternatively, you can use a function that dynamically determines the `pointerSelectAction`` based on annotation properties or other conditions:

```ts
import { createImageAnnotator, PointerSelectionAction, W3CImageFormat } from '@annotorious/annotorious';

const dynamicSelectAction = (annotation: Annotation) => {
  const isMine = annotation.target.creator.id == 'me';
  return isMine ? PointerSelectAction.EDIT : PointerSelectAction.SELECT;
};

const anno = createImageAnnotator('sample-image', {
  pointerSelectAction: dynamicSelectAction
});
```

__Note:__

For TypeScript users, the valid values for `pointerSelectAction` are provided as enums for type safety. However, in plain JavaScript, you can use the string values ('EDIT', 'SELECT', 'NONE') directly.

## Style

The `style` argument allows you to customize the visual appearance of annotations. You can define a style as either an object or a function.

The object should have the following shape:

```js
const style = {
  fill: '#ff2222',     // Fill color in hex format
  fillOpacity: 0.25,   // Fill opacity (0 to 1)
  stroke: '#ff0000',   // Stroke color in hex format
  strokeOpacity: 0.9,  // Stroke opacity (0 to 1)
  strokeWidth: 2       // Stroke width in pixels
}
```

Alternatively, you can use a function that takes the annotation as input and returns a style object:

```ts
const dynamicStyle = (annotation) => {
  const isImportant = annotation.bodies.some(b => b.purpose === 'highlighting');

  return {
    fill: '#ffff00',
    fillOpacity: isImportant ? 0.5 : 0,
    stroke: '#000000',
    strokeOpacity: 1,
    strokeWidth: 2
  };
};
```
