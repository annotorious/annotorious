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

[BSD 3-Clause](LICENSE) (= feel free to use this code in whatever way you wish. But keep the attribution/license file, and if this code breaks something, don't complain to me :-)

## Community

Visit the [Discussion Forum](https://github.com/annotorious/annotorious/discussions) for community support, or file an
issue on the [Issue Tracker](https://github.com/annotorious/annotorious/issues).

## Become a Sponsor

Using Annotorious at work? Become a sponsor! Your support helps me cover hosting costs, spend more 
time supporting the community, and make Annotorious better for everyone. [Make a one-time or monthly
donation via my SteadyHQ account](https://steadyhq.com/rainer-simon).

## Older Versions

Documentation for Annotorious version 2.7 [is available here](https://annotorious.github.io).