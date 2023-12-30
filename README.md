![Aerial view of Schönbrunn Palace in Vienna annotated with Annotorious](/docs/images/splash-image.jpg "Aerial view of Schönbrunn Palace in Vienna annotated with Annotorious")

> __IMPORTANT__ This repository is work in progress. I am building the next major release of Annotorious. If you 
> are looking for the most recent official release, [visit the main project homepage](https://annotorious.github.io). 
> Documentation in this Readme __is only for the upcoming alpha release__ and __will not work with Annotorious 2.7.x!__ 

# Annotorious 3

Add image annotation functionality to any Web page with a few lines of JavaScript. 🚀 Easy to integrate
🎨 fully customizable 🪶 weighs less than 100kB.

## Getting Started

Install from npm.

```sh
npm install --save @annotorious/annotorious
```

Import CSS style and initialize Annotorious.

```js
import { Annotorious } from '@annotorious/annotorious';

import '@annotorious/annotorious/dist/annotorious.css';

// Image element ID or DOM element
const anno = Annotorious('sample-image');

// Load annotations in W3C Web Annotation format
anno.loadAnnotations('./annotations.w3c.json');
       
// Attach listeners to handle annotation events
anno.on('createAnnotation', function(annotation) {
  console.log('created', annotation);
});
```

[Full API documentation](docs/api.md)

## Using with React

Install Annotorious React binding.

```sh
npm install --save @annotorious/react
```

Import Annotorious CSS style and wrap your image with the `ImageAnnotator` component to make it annotatable. 

```jsx
import { Annotorious, ImageAnnotator } from '@annotorious/react';

import '@annotorious/annotorious/dist/annotorious.css';

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

[Full React API documentation](docs/react.md)

## Support this Project

You can support by work with a one-time or recurring donation on [SteadyHQ](https://steadyhq.com/rainer-simon).

## Contributing

Want to help make Annotorious better? There are many ways to get involved - including some that require little
or no coding experience!

Check the list of current [open issues](https://github.com/annotorious/annotorious-v3/issues), in particular those with the [help wanted](https://github.com/annotorious/annotorious-v3/issues?q=is%3Aissue+is%3Aopen+label%3A"help+wanted") or [hacktoberfest](https://github.com/annotorious/annotorious-v3/issues?q=is%3Aissue+is%3Aopen+label%3Ahacktoberfest) tags. See the [Contribution Guide](contributing.md) to learn more.


