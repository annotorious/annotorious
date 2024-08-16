import type { User } from '../model/User';
import type { Appearance } from './Appearance';
import type { PresentUser } from './PresentUser';
import { DEFAULT_PALETTE } from './ColorPalette';

export interface AppearanceProvider {

  addUser(presenceKey: string, user: User): Appearance;

  removeUser(user: PresentUser): void;

}

export const defaultColorProvider = () => {

  const unassignedColors = [...DEFAULT_PALETTE];

  const assignRandomColor = () => {
    const rnd = Math.floor(Math.random() * unassignedColors.length);
    const color = unassignedColors[rnd];

    unassignedColors.splice(rnd, 1);

    return color;
  }

  const releaseColor = (color: string) =>
    unassignedColors.push(color);

  return { assignRandomColor, releaseColor };

}

export const createDefaultAppearanceProvider = () => {

  const colorProvider = defaultColorProvider();

  const addUser = (presenceKey: string, user: User): Appearance => {
    const color = colorProvider.assignRandomColor();

    return {
      label: user.name || user.id,
      avatar: user.avatar,
      color
    };
  }

  const removeUser = (user: PresentUser) =>
    colorProvider.releaseColor(user.appearance.color);

  return { addUser, removeUser }
  
}