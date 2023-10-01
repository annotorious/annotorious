# API

Create a new Annotorious instance on an image.

```js
const anno = Annotorious(arg);
```

__Parameters__

| __Parameter__                   | __Description__         |
|---------------------------------|-------------------------|
| arg: string \| HTMLImageElement | Image ID or DOM element |

### Methods

#### getUser(): User

#### loadAnnotations(url: string): Promise<W3CAnnotation[]>

#### setAnnotations(annotations: W3CAnnotation[]): void;

#### setDrawingTool(tool: string): void;

#### setUser(user: User)  

#### on(event: string, callback: function)

#### off(event: string, callback: function)
