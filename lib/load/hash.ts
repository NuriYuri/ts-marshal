import { MarshalError } from '../errors';
import type { MarshalHash } from '../types';
import { MarshalContext, r_long, r_entry } from './r_helper';
import { r_object } from './withSubContext';

export const marshalLoadHash = (context: MarshalContext): MarshalHash => {
  let length = r_long(context);
  if (length < 0) throw new MarshalError(`Negative length are not allowed for hashes, given length: ${length}`);
  const hash: MarshalHash = r_entry(context, { __class: 'Hash' });
  while (length--) {
    const key = r_object(context);
    const value = r_object(context);
    if (typeof key !== 'string' && typeof key !== 'symbol') {
      throw new MarshalError(`Cannot support non symbol or string key in Hashes in JS, received: ${typeof key}`);
    }
    hash[key] = value;
  }
  return hash;
};

export const marshalLoadHashDef = (context: MarshalContext) => {
  const hash = marshalLoadHash(context);
  hash.__default = r_object(context);
  return hash;
};
