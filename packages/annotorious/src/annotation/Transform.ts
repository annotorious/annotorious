export interface Transform { 

  elementToImage: (offsetX: number, offsetY: number) => [ number, number ] 

}

export const IdentityTransform: Transform = {

  elementToImage:  (offsetX: number, offsetY: number) => ([ offsetX, offsetY ])

}

export const createSVGTransform = (svg: SVGSVGElement): Transform => ({

  elementToImage: (offsetX: number, offsetY: number) => {
    const bbox = svg.getBoundingClientRect();

    const pt = svg.createSVGPoint();
    pt.x = offsetX + bbox.x;
    pt.y = offsetY + bbox.y;
  
    const { x, y } = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return [x, y];
  }

});