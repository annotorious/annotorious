import EventEmitter from 'tiny-emitter';
import { drawEmbeddedSVG } from '../../annotations/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '../../SVGConst';

/**
 * An editable rectangle shape.
 */
export default class EditablePolygon extends EventEmitter {

  constructor(annotation, g) {
    super();

    this.annotation = annotation;

    // SVG element
    this.svg = g.closest('svg');

    // 'g' for the editable polygon compound shape
    this.group = document.createElementNS(SVG_NAMESPACE, 'g');
    this.shape = drawEmbeddedSVG(annotation);
    this.shape.setAttribute('class', 'a9s-annotation editable selected');
    this.group.appendChild(this.shape);

    /*
    this.rectangle.querySelector('.inner')
      .addEventListener('mousedown', this.onGrab(this.rectangle));
    
    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

    this.handles = [
      [ x, y, 'topleft' ], 
      [ x + w, y, 'topright'], 
      [ x + w, y + h, 'bottomright' ], 
      [ x, y + h, 'bottomleft' ]
    ].map(t => { 
      const [ x, y, className ] = t;
      const handle = drawHandle(x, y, className);

      handle.addEventListener('mousedown', this.onGrab(handle));
      this.group.appendChild(handle);

      return handle;
    });
    */

    g.appendChild(this.group);

    // The grabbed element (handle or entire group), if any
    // this.grabbedElem = null; 

    // Mouse xy offset inside the shape, if mouse pressed
    // this.mouseOffset = null;

    // this.enableResponsive()
  }

  get element() {
    return this.shape;
  }


  destroy = () => {
    this.group.parentNode.removeChild(this.group);

    // if (this.resizeObserver)
    //  this.resizeObserver.disconnect();
    
    // this.resizeObserver = null;
  }

}