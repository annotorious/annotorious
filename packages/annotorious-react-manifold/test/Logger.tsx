import { useEffect } from 'react';
import { useSelection } from '../src';

export const Logger = () => {

  const selection = useSelection();

  useEffect(() => {
    if (selection)
      console.log(selection);
  }, [selection]);

  return null;

}