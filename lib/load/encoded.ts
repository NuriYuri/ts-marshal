import type { MarshalUserObject } from '../types';
import { MarshalContext, r_long, r_entry, r_bytes, r_byte } from './r_helper';
import { r_symbol, r_unique } from './r_symbol';
import { r_object, withSubContext } from './withSubContext';

const discardEncoding = (context: MarshalContext) => {
  let num = r_long(context);
  while (num-- > 0) {
    r_symbol(context);
    r_object(context);
  } // TODO: handle encoding later
};

export const marshalLoadString = (context: MarshalContext): string => {
  const string = r_entry(context, r_bytes(context).toString('utf-8'));
  if (context.ivar) {
    withSubContext(context, false, discardEncoding);
    context.ivar = false;
  }
  return string;
};

export const marshalLoadSymbol = (context: MarshalContext): symbol => {
  const symbol = Symbol.for(r_bytes(context).toString('utf-8'));
  context.symbols.push(symbol);
  if (context.ivar) {
    withSubContext(context, false, discardEncoding);
    context.ivar = false;
  }
  return symbol;
};

export const marshalLoadRegexp = (context: MarshalContext): RegExp => {
  const raw = r_bytes(context);
  const options = r_byte(context); // 0 = none, 1 = i, 4 = m, 2 = x
  const flags = [undefined, 'i', undefined, 'i', 'm', 'mi', 'm', 'mi'][options & 0x07]; // Note: x is not supported in JS
  const regexp = r_entry(context, new RegExp(raw.toString('utf-8'), flags));
  if (context.ivar) {
    withSubContext(context, false, discardEncoding);
    context.ivar = false;
  }
  return regexp;
};

export const marshalLoadUserDef = (context: MarshalContext): MarshalUserObject => {
  const path = withSubContext(context, false, r_unique);
  // Ruby calls _load with the given buffer so we set object.__load with that buffer
  const object: MarshalUserObject = r_entry(context, { __class: path, __load: r_bytes(context) });
  if (context.ivar) {
    withSubContext(context, false, discardEncoding);
    context.ivar = false;
  }
  return object;
};
