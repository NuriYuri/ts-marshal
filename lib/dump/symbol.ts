import { MarshalError } from '../errors';
import { COMMON_ENCODING_SYMBOL } from '../load/encoded';
import { marshalDumpSymbolLink } from './link';
import { MarshalDumpContext, w_byte, w_bytes, w_long } from './r_helpers';

const w_symbol = (context: MarshalDumpContext, name: string) => {
  w_byte(context, 58);
  w_bytes(context, Buffer.from(name, 'utf-8'));
};

export const marshalDumpSymbol = (context: MarshalDumpContext, object: symbol) => {
  if (context.symbols.includes(object)) return marshalDumpSymbolLink(context, object);
  context.symbols.push(object);
  const name = Symbol.keyFor(object);
  if (!name) throw new MarshalError(`${object.toString()} is unknown to the JS realm.`);
  if (name.match(/^[a-z0-9_@]+$/i) !== null) return w_symbol(context, name);
  // Add IVAR to specify it contains UTF-8 chars
  w_byte(context, 73);
  w_symbol(context, name);
  w_long(context, 1);
  marshalDumpSymbol(context, COMMON_ENCODING_SYMBOL);
  w_byte(context, 84);
};
