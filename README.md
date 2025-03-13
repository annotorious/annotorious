<p align="center">
  <img width="345" src="https://raw.githubusercontent.com/recogito/annotorious/master/annotorious-logo-white-small.png" />
  <br/><br/>
</p>

[![](https://data.jsdelivr.com/v1/package/npm/@recogito/annotorious/badge)](https://www.jsdelivr.com/package/npm/@recogito/annotorious)

A JavaScript image annotation library. Add drawing, commenting and labeling functionality to images
in Web pages with just a few lines of code. Weighs less than 300kB. See the [project website](https://annotorious.github.io/)
for details and live demos.


## New Features in v2.7.14

*   **Edge Dragging for Rectangles:**  Rectangular annotations can now be resized by dragging directly on their edges, providing a more intuitive resizing experience.
*   **Automatic Cursor Updates:** The appropriate resize cursors (e.g., `ew-resize`, `ns-resize`, `nwse-resize`, `nesw-resize`) are automatically displayed when hovering over the edges or handles of a rectangle, giving a clear visual indication of available resizing actions.

<img width="620" src="https://raw.githubusercontent.com/recogito/annotorious/master/screenshot.jpg" />

## Installing

If you use npm, `npm install @recogito/annotorious` and 

```javascript
import { Annotorious } from '@recogito/annotorious';

import '@recogito/annotorious/dist/annotorious.min.css';

const anno = new Annotorious({ image: 'hallstatt' }); // image element or ID
```

Otherwise download the [latest release](https://github.com/annotorious/annotorious/releases/latest)
and include it in your web page.

```html
<link rel="stylesheet" href="annotorious.min.css">
<script src="annotorious.min.js"></script>
```

## Using

```html
<body>
  <div id="content">
    <img id="hallstatt" src="640px-Hallstatt.jpg">
  </div>
  <script>
    (function() {
      var anno = Annotorious.init({
        image: 'hallstatt'
      });

      anno.loadAnnotations('annotations.w3c.json');
    })()
  </script>
  <script type="text/javascript" src="annotorious.min.js"></script>
</body>
```
Full documentation is [on the project website](https://annotorious.github.io/). Questions? Feedack? Feature requests? Join the 
[Annotorious chat on Gitter](https://gitter.im/recogito/annotorious).

[![Join the chat at https://gitter.im/recogito/annotorious](https://badges.gitter.im/recogito/annotorious.svg)](https://gitter.im/recogito/annotorious?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## License

[BSD 3-Clause](LICENSE) (= feel free to use this code in whatever way
you wish. But keep the attribution/license file, and if this code
breaks something, don't complain to us :-)

## Who's Using Annotorious

![NHS Wales Logo](logos/NHSWalesCavLogo.png) &nbsp; [![MicroPasts Logo](logos/MicroPasts.png)](https://crowdsourced.micropasts.org/)

Using Annotorious? [Let us know!](https://gitter.im/recogito/annotorious)

## Contributing

Contributions to both the code and documentation are welcome! More details can be found in the [Hacker's Guide](https://annotorious.github.io/guides/hackers-guide/) on the project website.
