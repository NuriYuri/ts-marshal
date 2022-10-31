import { MarshalError } from '../errors';
import type { MarshalUserObject } from '../types';
import { MarshalContext, r_long, r_entry, r_bytes, r_byte } from './r_helper';
import { r_symbol, r_unique } from './r_symbol';
import { r_object, withSubContext } from './withSubContext';

const discardEncoding = (context: MarshalContext) => {
  const { map, ...discardingContext } = context;
  r_long(discardingContext);
  r_symbol(discardingContext);
  r_object(discardingContext);
  context.index = discardingContext.index;
};

export const COMMON_ENCODING_SYMBOL = Symbol.for('E');
export const ENCODING_SYMBOL = Symbol.for('encoding');

const lookUpForEncoding = (context: MarshalContext): BufferEncoding | undefined => {
  const objectSize = context.objects.length;
  const symbolSize = context.symbols.length;
  return withSubContext(context, false, (subContext) => {
    const num = r_long(subContext);
    if (num !== 1) throw new MarshalError('Invalid encoding description in IVAR');

    const symbol = r_symbol(subContext);
    const value = r_object(subContext);
    subContext.index = context.index;
    if (objectSize !== context.objects.length) context.objects.pop();
    if (symbolSize !== context.symbols.length) context.symbols.pop();
    if (symbol === COMMON_ENCODING_SYMBOL) return value === true ? 'utf8' : 'ascii'; // Note: string uses this as ascii while regexp use it both for ascii and binary
    if (symbol !== ENCODING_SYMBOL) throw new MarshalError('Invalid encoding description in IVAR');
    if (typeof value !== 'string') throw new MarshalError('Expected string value in encoding description IVAR');

    switch (value) {
      case 'UTF-8':
        return 'utf8';
      case 'US-ASCII':
        return 'ascii';
      case 'UTF-16LE':
        return 'utf16le';
      case 'ISO-8859-1':
        return 'latin1';
      default:
        return undefined;
    }
  });
};

const EntryWithEncodingLookup = <T>(context: MarshalContext, buffer: Buffer, transformation: (value: string) => T): T => {
  // Lookup for encoding, encode value and transform it
  let transformedValue = transformation(buffer.toString(lookUpForEncoding(context)));
  if (typeof transformedValue === 'symbol') {
    context.symbols.push(transformedValue);
  } else {
    transformedValue = r_entry(context, transformedValue);
  }
  // Discard encoding in ivar
  withSubContext(context, false, discardEncoding);
  context.ivar = false;
  return transformedValue;
};

export const marshalLoadString = (context: MarshalContext): string => {
  if (context.ivar) {
    return EntryWithEncodingLookup(context, r_bytes(context), (v) => v);
  } else {
    return r_entry(context, r_bytes(context).toString('utf-8'));
  }
};

export const marshalLoadSymbol = (context: MarshalContext): symbol => {
  if (context.ivar) {
    return EntryWithEncodingLookup(context, r_bytes(context), (v) => Symbol.for(v));
  }
  const symbol = Symbol.for(r_bytes(context).toString('utf-8'));
  context.symbols.push(symbol);
  return symbol;
};

export const marshalLoadRegexp = (context: MarshalContext): RegExp => {
  const raw = r_bytes(context);
  const options = r_byte(context); // 0 = none, 1 = i, 4 = m, 2 = x
  const flags = [undefined, 'i', undefined, 'i', 'm', 'mi', 'm', 'mi'][options & 0x07]; // Note: x is not supported in JS
  if (context.ivar) {
    return EntryWithEncodingLookup(context, raw, (regexp) => new RegExp(regexp, flags));
  }
  return r_entry(context, new RegExp(raw.toString('utf-8'), flags));
};

export const marshalLoadUserDef = (context: MarshalContext): MarshalUserObject => {
  const path = withSubContext(context, false, r_unique);
  // Ruby calls _load with the given buffer so we set object.__load with that buffer
  const object: MarshalUserObject = r_entry(context, { __class: path, __load: r_bytes(context) });
  if (context.ivar) {
    object.__encoding = lookUpForEncoding(context);
    withSubContext(context, false, discardEncoding);
    context.ivar = false;
  }
  return object;
};
