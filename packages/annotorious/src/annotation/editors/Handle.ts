export type Handle = string;

export const Handle = (value: string | number) => `HANDLE-${value}`;

Handle.SHAPE = 'SHAPE';

Handle.TOP = 'TOP';

Handle.RIGHT = 'RIGHT';

Handle.BOTTOM = 'BOTTOM';

Handle.LEFT = 'LEFT';

Handle.TOP_LEFT = 'TOP_LEFT';

Handle.TOP_RIGHT = 'TOP_RIGHT';

Handle.BOTTOM_RIGHT = 'BOTTOM_RIGHT';

Handle.BOTTOM_LEFT = 'BOTTOM_LEFT';