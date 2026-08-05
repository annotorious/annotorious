# OpenSeadragon coordinate-mapping playground

Run `npm run playground:osd` from the repository root. The page starts with a
translated and scaled ancestor around the viewer — the setup that previously
sent pointer coordinates to the wrong image position.

Verify these interactions with the transform both enabled and disabled:

1. Select the seeded red rectangle, then select another shape to verify that the selection switches.
2. Drag the shape and each resize handle; the live geometry should follow the pointer.
3. Enable drawing and drag out a second rectangle; it should appear where the drag began.
4. Pan and zoom the image up to 8× its native pixel resolution, then repeat
   selection and editing.
