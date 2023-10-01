import type { User } from '../model';
import type { Appearance } from './Appearance';

export interface PresentUser extends User {

  presenceKey: string;

  appearance: Appearance

}