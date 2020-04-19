![Annotorious Logo](annotorious-logo-1280x160.png)

A JavaScript library for image annotation. Annotorious 2 is a 
modernized reboot of the (now outdated) original 
[Annotorious](http://annotorious.github.io/).

__!! Work in progress !!__

## Resources

- [API Reference](https://github.com/recogito/annotorious/wiki/API-Reference)
- [Demo](https://recogito.github.io/annotorious/)

## Installing

If you use npm, `npm install @recogito/annotorious`. Otherwise download the 
[latest release](https://github.com/recogito/annotorious/releases/latest).

```html
<script src="annotorious-2.0.1-alpha.min.js"></script>
```

## Using

Make an image annotate-able with just a few lines of JavaScript.

```html
<body>
  <div id="content">
    <img id="hallstatt" src="640px-Hallstatt.jpg">
  </div>
  <script>
    (function() {
      var anno = Annotorious.init({
        image: 'hallstatt' // image element or ID
      });

      anno.loadAnnotations('annotations.w3c.json');
    })()
  </script>
  <script type="text/javascript" src="annotorious-2.0.1-alpha.min.js"></script>
</body>
```


