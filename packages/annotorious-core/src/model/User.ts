import { customAlphabet } from 'nanoid';

export interface User {

  id: string;

  isGuest?: boolean;

  name?: string;

  avatar?: string;

}

export const createAnonymousGuest = () => {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_', 20);
  
  return { isGuest: true, id: nanoid() }
}