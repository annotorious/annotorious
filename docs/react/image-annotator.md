> This is documentation for the upcoming v3 of Annotorious. For the latest official v2.x release see the [Annotorious project website](_https://annotorious.github.io_)

# Getting Started: React
## Installation
Install the Annotorious React integration package. The package contains React bindings
for both versions of Annotorious - standard images and OpenSeadragon. 

```
npm install @annotorious/react
```

## Image Annotation
Add an annotation layer to an image. 

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
Provides context for all parts of an annotation layer on an image. Annotorious hooks can be used anywhere below this component.

#### ImageAnnotator
Wraps an image component and applies an annotation layer to it.

| Prop                | Type                        | Default     |
|---------------------|-----------------------------|-------------|
| adapter             | FormatAdapter               | -           |
| autoSave            | boolean                     | false       |
| drawingEnabled      | boolean                     | true        |
| drawingMode         | 'click' \| 'drag'           | 'drag'      |
| filter              | FilterDefinition            | -           |
| pointerSelectAction | PointerSelectDefinition     | EDIT        |
| style               | StyleDefinition             | -           |
| theme               | 'dark' \| 'light' \| 'auto' | 'light'     |
| tool                | 'rectangle' \| 'light'      | 'rectangle' |

### Hooks
Interaction with Annotorious works through the following hooks.

#### useAnnotations(debounced?: number)

```tsx
const annotations: ImageAnnotation[] = useAnnotations(250);
```
Live annotation state. You can optionally debounce updates to `annotations`
by a set amount of milliseconds.

#### useAnnotator
Access to the vanilla `anno` Annotator instance.

#### useSelection

```tsx
// selected: Array<{ annotation: ImageAnnotation, editable: boolean }>
// pointerEvent: PointerEvent
const { selected, pointerEvent } = useSelection();
```
The current selection state. If selection happend via a user pointer event,
the event is included.

#### useAnnotatorUser
The current annotator user set via the `anno.setUser()` method, if any.

```tsx
const user: User = useAnnotatorUser();
```
