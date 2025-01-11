# @annotorious/core

The `@annotorious/core` package provides core types and functions used by the Annotorious library. It includes essential components for creating, managing, and interacting with annotations.

## Core Concepts

Annotorious is a JavaScript library that provides image annotation functionality. It allows users to create, edit, and manage annotations on images. The `@annotorious/core` package contains the core types and functions that power the Annotorious library.

## Installation

To install the `@annotorious/core` package, you can use npm:

```sh
npm install @annotorious/core
```

## Usage Examples

### Creating an Annotation

To create an annotation, you can use the `Annotation` type and related functions provided by the `@annotorious/core` package.

```js
import { Annotation } from '@annotorious/core';

const annotation = {
  id: '1',
  target: {
    annotation: 'image-1',
    selector: { type: 'FragmentSelector', value: 'xywh=pixel:10,10,100,100' }
  },
  bodies: [
    {
      id: 'body-1',
      annotation: '1',
      type: 'TextualBody',
      value: 'This is an annotation'
    }
  ]
};

console.log(annotation);
```

### Managing Annotation State

The `@annotorious/core` package provides functions for managing the state of annotations, including selection, hover, and viewport state.

```js
import { createStore, createSelectionState, createHoverState, createViewportState } from '@annotorious/core';

const store = createStore();
const selectionState = createSelectionState(store);
const hoverState = createHoverState(store);
const viewportState = createViewportState();

store.addAnnotation(annotation);
selectionState.setSelected('1');
hoverState.set('1');
viewportState.set(['1']);

console.log(store.all());
console.log(selectionState.selected);
console.log(hoverState.current);
console.log(viewportState);
```

## API Reference

### `Annotation`

The `Annotation` type represents an annotation and includes the following properties:

- `id`: The unique identifier of the annotation.
- `target`: The target of the annotation, including the selector and optional creator and timestamps.
- `bodies`: An array of annotation bodies, each containing properties such as `id`, `type`, `value`, and optional creator and timestamps.
- `properties`: Optional custom properties for the annotation.

### `createStore`

The `createStore` function creates a new annotation store for managing annotations.

```js
import { createStore } from '@annotorious/core';

const store = createStore();
```

### `createSelectionState`

The `createSelectionState` function creates a new selection state for managing selected annotations.

```js
import { createSelectionState } from '@annotorious/core';

const selectionState = createSelectionState(store);
```

### `createHoverState`

The `createHoverState` function creates a new hover state for managing hovered annotations.

```js
import { createHoverState } from '@annotorious/core';

const hoverState = createHoverState(store);
```

### `createViewportState`

The `createViewportState` function creates a new viewport state for managing annotations within the viewport.

```js
import { createViewportState } from '@annotorious/core';

const viewportState = createViewportState();
```

## Community

Visit the [Discussion Forum](https://github.com/annotorious/annotorious/discussions) for community support, or file an issue on the [Issue Tracker](https://github.com/annotorious/annotorious/issues).

## Become a Sponsor

Using Annotorious at work? Become a sponsor! Your support helps me cover hosting costs, spend more time supporting the community, and make Annotorious better for everyone. [Make a one-time or monthly donation via my SteadyHQ account](https://steadyhq.com/rainer-simon).
