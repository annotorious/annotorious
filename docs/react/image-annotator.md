> This is documentation for the upcoming v3 of Annotorious. For the latest official v2.x release see the [Annotorious project website](_https://annotorious.github.io_)

# Getting Started: React

## Installation

To use Annotorious with React, install the React integration package. The package contains React bindings for both standard images and OpenSeadragon. 

```bash
npm install @annotorious/react
```

## Image Annotation
Add an annotation layer to an image using the Annotorious React components. 

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

### Components

#### Annotorious
This component provides context for all parts of an annotation layer on an image. Annotorious hooks can be used below this component.

#### ImageAnnotator
This component wraps an image component and applies an annotation layer to it.

| Prop             | Type                                     | Default       |
|------------------|------------------------------------------|---------------|
| `adapter`        | [FormatAdapter](#formatadapter)          | -             |
| `autoSave`       | `boolean`                                | `false`       |
| `drawingEnabled` | `boolean`                                | `true`        |
| `drawingMode`    | `'click'` \| `'drag'`                    | `'drag'`      |
| `filter`         | [FilterDefinition](#filter)              | -             |
| `selectAction`   | [selectDefinition](#selectaction)        | `'EDIT'`      |
| `style`          | [StyleDefinition](#style)                | -             |
| `theme`          | `'dark'` \| `'light'` \| `'auto'`        | `'light'`     |
| `tool`           | `'rectangle'` \| `'light'`               | `'rectangle'` |
 
#### FormatAdapter

The `adapter` prop is an optional object that introduces crosswalk functionality between Annotorious' internal annotation data model and different standards. This allows seamless integration of external annotation standards, such as the [W3C Web Annotation standard](https://www.w3.org/TR/annotation-model/), into Annotorious. The adapter will handle the process of parsing and serializing annotations between Annotorious' internal format and the chosen external standard for you. 

When using a format adapter, it impacts all methods of the vanilla `anno` Annotator instance. Currently, the W3C adapter is only available adapter for Annotorious.

```tsx
import { Annotorious, ImageAnnotator, W3CImageFormat } from '@annotorious/react';

<Annotorious>
  <ImageAnnotator adapter={W3CImageFormat()}>
    <img src="example.jpg" />
  </ImageAnnotator>
</Annotorious>

```

#### Filter

Using a filter, you can dynamically control annotation visibility based on specified conditions. The filter is a function that takes an annotation as an input, and must return a boolean. Return `true` to make the annotation visible, and `false` to hide it.

```tsx
const showImportantFilter = (annotation: Annotation) => {
  const isImportant = annotation.bodies.some(b => b.purpose === 'highlighting');

  return isImportant;
};

<ImageAnnotator filter={showImportantFilter}>
  <img src="example.jpg" />
</ImageAnnotator>;
```

#### selectAction

The `selectAction` prop controls the behavior when a user clicks or taps on an annotation. Valid values for selectAction are `EDIT`, `SELECT`, and `NONE`.

- __EDIT__ makes the annotation editable, allowing the users to modify its shape.

- __SELECT__ ensures that clicking an annotation will trigger the relevant selection lifecycle events of the API. However, the annotation will not become editable.

- __NONE__ renders the annotation inert. Clicking on it will have no effect.

You can directly assign one of these values to selectAction. For example:

```tsx
import { SelectAction } from '@annotorious/react'; 

<ImageAnnotator selectAction={SelectAction.EDIT}>
  <img src="example.jpg" />
</ImageAnnotator>
```

Alternatively, you can use a function that dynamically determines the `selectAction`` based on annotation properties or other conditions:

```tsx
const dynamicSelectAction = (annotation: Annotation) => {
  const isMine = annotation.target.creator.id == 'me';
  return isMine ? SelectAction.EDIT : SelectAction.SELECT;
};

<ImageAnnotator selectAction={dynamicSelectAction}>
  <img src="example.jpg" />
</ImageAnnotator>
```

__Note:__

For TypeScript users, the valid values for `selectAction` are provided as enums for type safety. However, in plain JavaScript, you can use the string values ('EDIT', 'SELECT', 'NONE') directly.

```ts 
// TypeScript
const action: SelectAction = SelectAction.EDIT;

// JavaScript
const action = 'EDIT';
```

#### Style

The `style` prop allows you to customize the visual appearance of annotations. You can define a style as either an object or a function.

The object should have the following shape:

```tsx
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
const dynamicStyle = (annotation: Annotation) => {
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

### Hooks
Interaction with Annotorious works through the following hooks.

#### useAnnotations(debounced?: number)

```tsx
const annotations: ImageAnnotation[] = useAnnotations(250);
```
Returns the live annotation state. Optionally, you can debounce updates to `annotations` by a specified amount of milliseconds.

#### useAnnotator
Access to the vanilla `anno` Annotator instance.

#### useSelection

```ts
// selected: Array<{ annotation: ImageAnnotation, editable: boolean }>
// pointerEvent: PointerEvent
const { selected, pointerEvent } = useSelection();
```
Returns the current selection state. If selection happend via a user pointer event, the event is included.

#### useAnnotatorUser
Returns the current annotator user set via the `anno.setUser()` method, if any.

```tsx
const user: User = useAnnotatorUser();
```
