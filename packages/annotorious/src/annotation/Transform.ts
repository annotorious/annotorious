export interface Transform { 

  elementToImage: (offsetX: number, offsetY: number) => [ number, number ] 

}

export const IdentityTransform: Transform = {

  elementToImage:  (offsetX: number, offsetY: number) => ([ offsetX, offsetY ])

}

export const createSVGTransform = (svg: SVGSVGElement): Transform => ({

  // Maps element-offset coordinates to image space proportionally via the
  // viewBox, which always equals the image's natural size. Deliberately
  // avoids getScreenCTM: browsers disagree on whether CSS transforms on HTML
  // ancestors are reflected in the CTM (e.g. WebKit bug 209220), which breaks
  // drawing and editing when the annotator is a descendant of a CSS-transformed
  // container such as a pan-zoom wrapper.
  elementToImage: (offsetX: number, offsetY: number) => {
    const { width, height } = svg.viewBox.baseVal;

    return [
      offsetX / svg.clientWidth * width,
      offsetY / svg.clientHeight * height
    ];
  }

});