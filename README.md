<p align="center">
  <img width="345" src="https://raw.githubusercontent.com/recogito/annotorious/master/annotorious-logo-white-small.png" />
  <br/><br/>
</p>

A JavaScript library for image annotation. Add drawing, commenting and labeling functionality to images
in Web pages with just a few lines of code. This project is a modernized reboot of the outdated 
original [Annotorious](https://github.com/annotorious/annotorious). See the 
[project website](https://recogito.github.io/site/annotorious/) for details and live demos.

<img width="620" src="https://raw.githubusercontent.com/recogito/annotorious/master/screenshot.jpg" />

## Installing

If you use npm, `npm install @recogito/annotorious` and 

```javascript
import { Annotorious } from '@recogito/annotorious';

const anno = new Annotorious({ image: 'hallstatt' }); // image element or ID
```

Otherwise download the [latest release](https://github.com/recogito/annotorious/releases/latest)
and include it in your web page.

```html
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
Full documentation is [on the project website](https://recogito.github.io/site/annotorious/). Questions? Feedack? Feature requests? Join the 
[Annotorious chat on Gitter](https://gitter.im/recogito/annotorious).

[![Join the chat at https://gitter.im/recogito/annotorious](https://badges.gitter.im/recogito/annotorious.svg)](https://gitter.im/recogito/annotorious?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## License

[BSD 3-Clause](LICENSE) (= feel free to use this code in whatever way
you wish. But keep the attribution/license file, and if this code
breaks something, don't complain to us :-)


