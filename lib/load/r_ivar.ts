import { MarshalError } from '../errors';
import { isMarshalExtendableObject } from '../typeGuards';
import type { MarshalExtendableObject } from '../types';
import { MarshalContext, r_long } from './r_helper';
import { r_symbol } from './r_symbol';
import { r_object, withSubContext } from './withSubContext';

export const r_ivar = (context: MarshalContext, object: MarshalExtendableObject) => {
  let length = r_long(context);
  if (length < 0) throw new MarshalError(`Negative length are not allowed for IVAR, given length: ${length}`);
  if (length === 0) return;

  // How to scare a front-end developer with one keyword
  do {
    const sym = r_symbol(context);
    const field = Symbol.keyFor(sym);
    if (!field) throw new MarshalError(`${sym.toString()} is unknown to the JS realm.`);
    const val = r_object(context);
    // Note we're skipping the encoding stuff because it shouldn't be called with regexp or symbols
    object[field] = val;
  } while (--length > 0);
};

export const marshalLoadIvar = (context: MarshalContext) => {
  return withSubContext(context, true, (subContext) => {
    const object = subContext.marshalLoad(subContext);
    if (subContext.ivar && isMarshalExtendableObject(object)) withSubContext(subContext, false, (ivarContext) => r_ivar(ivarContext, object));

    return object;
  });
};
