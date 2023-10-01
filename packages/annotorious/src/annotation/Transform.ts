export interface Transform { 

  elementToImage: (offsetX: number, offsetY: number) => [ number, number ] 

}

export const IdentityTransform: Transform = {

  elementToImage:  (offsetX: number, offsetY: number) => ([ offsetX, offsetY ])

}

export const createSVGTransform = (svg: SVGSVGElement): Transform => ({

  elementToImage: (offsetX: number, offsetY: number) => {
    const pt = svg.createSVGPoint();
    pt.x = offsetX;
    pt.y = offsetY;
  
    const { x, y } = pt.matrixTransform(svg.getCTM().inverse());
    return [x, y];
  }

});