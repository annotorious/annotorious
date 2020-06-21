import { SVG_NAMESPACE } from '../../SVGConst';
import { Environment } from '@recogito/recogito-client-core';

/** Helper that forces an un-namespaced node to SVG **/
const insertSVGNamespace = originalDoc => {
  // Set the attribute
  originalDoc.firstChild.setAttribute('xmlns', SVG_NAMESPACE);

  // Serialize and parse for the namespace to take effect on every node
  const serializer = new XMLSerializer();
  const str = serializer.serializeToString(originalDoc);

  const parser = new DOMParser();
  const updateDoc = parser.parseFromString(str, "image/svg+xml");   
  return updateDoc.firstChild;
}

/** Parse SVG from string **/
const parseSVG = str => {
  const parser = new DOMParser();

  // Parse the XML document, assuming SVG
  let doc = parser.parseFromString(str, "image/svg+xml");    

  // SVG needs a namespace declaration - check if it's set
  const isPrefixDeclared = doc.lookupPrefix(SVG_NAMESPACE); // SVG declared via prefix
  const isDefaultNamespaceSVG = doc.lookupNamespaceURI(null); // SVG declared as default namespace

  if (!(isPrefixDeclared || isDefaultNamespaceSVG)) 
    doc = insertSVGNamespace(doc);

  return doc.firstChild;
}

export const parseSVGFragment = annotation => {
  const selector = annotation.selector('SvgSelector');
  if (selector) {
    const { value } = selector;
    const shape = parseSVG(value);
 
    const g = document.createElementNS(SVG_NAMESPACE, 'g');
    
    const inner = shape.cloneNode(true);
    inner.setAttribute('class', 'inner');

    const outer = shape.cloneNode(true);
    outer.setAttribute('class', 'outer');

    g.appendChild(outer);
    g.appendChild(inner);

    return g;
  }
}

export const toSVGTarget = shape => {
  const inner = shape.querySelector('.inner').cloneNode(true);
  inner.removeAttribute('class');
  inner.removeAttribute('xmlns');

  return {
    source: Environment.image?.src,
    selector: {
      type: "SvgSelector",
      value: `<svg>${inner.outerHTML}</svg>`
    }
  }
};

export const drawEmbeddedSVG = annotation => {
  return parseSVGFragment(annotation);
}