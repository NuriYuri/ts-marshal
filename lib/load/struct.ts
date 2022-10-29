import { MarshalError } from '../errors';
import type { MarshalStructObject } from '../types';
import { MarshalContext, r_long, r_entry } from './r_helper';
import { r_unique, r_symbol } from './r_symbol';
import { withSubContext, r_object } from './withSubContext';

export const marshalLoadStruct = (context: MarshalContext) => {
  const path = withSubContext(context, false, r_unique);
  let length = r_long(context);
  if (length < 0) throw new MarshalError(`Negative length are not allowed for structs, given length: ${length}`);
  const struct: MarshalStructObject = r_entry(context, { __class: path, __type: 'Struct' });
  while (length--) {
    const slot = withSubContext(context, false, r_symbol);
    const field = Symbol.keyFor(slot);
    if (!field) throw new MarshalError(`${slot.toString()} is unknown to the JS realm.`);
    struct[field] = r_object(context);
  }
  return struct;
};
