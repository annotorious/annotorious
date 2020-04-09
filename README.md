# Annotorious 2

A JavaScript library for image annotation. Modernized reboot of the 
outdated original [Annotorious](http://annotorious.github.io/).

__Work in progress__

## Resources

- [Demo](https://recogito.github.io/annotorious/)

## Installing

An initial release will be published here and on the npm registry soon. 
Watch this space.

## Using

Make in image annotate-able with just a few lines of JavaScript.

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
  <script type="text/javascript" src="annotorious-2.0.0-alpha.min.js"></script>
</body>
```


