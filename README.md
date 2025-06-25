![Aerial view of Schönbrunn Palace in Vienna annotated with Annotorious](/images/splash-image.jpg "Aerial view of Schönbrunn Palace in Vienna annotated with Annotorious")

# Annotorious - JavaScript Image Annotation

Add image annotation functionality to any web page with a few lines of JavaScript. Visit the
[project website](https://annotorious.dev) for documentation and live demos.

```sh
npm install @annotorious/annotorious
```

## Quick Start

```js
import { createImageAnnotator } from '@annotorious/annotorious';

import '@annotorious/annotorious/annotorious.css';

const anno = createImageAnnotator('image-to-annotate');

// Load annotations from a file
anno.loadAnnotations('./annotations.json');

// Listen to user events
anno.on('createAnnotation', function(annotation) {
  console.log('new annotation', annotation);
});
```

## License

Annotorious is licensed under the [BSD 3-Clause](LICENSE) license.

## Community

Visit the [Discussion Forum](https://github.com/annotorious/annotorious/discussions) for community support, or file an
issue on the [Issue Tracker](https://github.com/annotorious/annotorious/issues).

## Professional Support Available

Looking for help with integration, customization, or feature development? I offer consulting and professional services for teams and organizations that need dedicated support or technical guidance.

Contact me at hello@rainersimon.io to discuss your project.

## Older Versions

Documentation for Annotorious version 2.7 [is available here](https://annotorious.github.io).
