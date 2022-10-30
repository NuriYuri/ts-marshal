import { MarshalError } from '../errors';
import type { MarshalObject } from '../types';
import { MarshalContext, r_long, r_entry } from './r_helper';
import { r_object } from './withSubContext';

export const marshalLoadArray = (context: MarshalContext): MarshalObject[] => {
  let length = r_long(context);
  if (length < 0) throw new MarshalError(`Negative length are not allowed for array, given length: ${length}`);
  const array = r_entry(context, [] as MarshalObject[]);
  while (length--) array.push(r_object(context));
  return array;
};
