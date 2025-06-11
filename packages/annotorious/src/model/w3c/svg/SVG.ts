export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export const sanitize = (doc: Element | Document) => {
  // Cf. https://github.com/mattkrick/sanitize-svg#readme  
  // for the basic approach
  const cleanEl = (el: Element) => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on'))
        el.removeAttribute(attr.name)
    });
  }

  // Remove script tags
  const scripts = doc.getElementsByTagName('script');

  Array.from(scripts).reverse().forEach(el => el.parentNode!.removeChild(el));

  Array.from(doc.querySelectorAll('*')).forEach(cleanEl);

  return doc;
}

/** Helper that forces an un-namespaced node to SVG **/
export const insertSVGNamespace = (originalDoc: Document): Element => {
  // Serialize and parse for the namespace to take effect on every node
  const serializer = new XMLSerializer();
  const str = serializer.serializeToString(originalDoc.documentElement);

  // Doesn't seem that there's a clean cross-browser way for this...
  const namespaced = str.replace('<svg>', `<svg xmlns="${SVG_NAMESPACE}">`);

  const parser = new DOMParser();
  const namespacedDoc = parser.parseFromString(namespaced, "image/svg+xml");
  return namespacedDoc.documentElement;
}

export const parseSVGXML = (value: string): Element => {
  const parser = new DOMParser();

  const doc = parser.parseFromString(value, 'image/svg+xml');

  // SVG needs a namespace declaration - check if it's set or insert if not
  const isPrefixDeclared = doc.lookupPrefix(SVG_NAMESPACE); // SVG declared via prefix
  const isDefaultNamespaceSVG = doc.lookupNamespaceURI(null); // SVG declared as default namespace

  if (isPrefixDeclared || isDefaultNamespaceSVG) {
    return sanitize(doc).firstChild as Element;
  } else {
    return sanitize(insertSVGNamespace(doc)).firstChild as Element;
  }
}