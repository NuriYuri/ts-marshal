import { MarshalError } from '../errors';
import { marshalLoadSymbol } from './encoded';
import { marshalLoadSymLink } from './link';
import { MarshalContext, r_byte } from './r_helper';
import { withSubContext } from './withSubContext';

export const r_symbol = (context: MarshalContext): symbol => {
  const type = r_byte(context);
  switch (type) {
    case 73: // TYPE_IVAR 'I'
      return withSubContext(context, true, r_symbol);
    case 58: // TYPE_SYMBOL ':'
      return marshalLoadSymbol(context);
    case 59: // TYPE_SYMLINK ';'
      return marshalLoadSymLink(context);
    default:
      throw new MarshalError(`dump format error for symbol(0x${context.buffer.toString('hex', context.index - 1, context.index)})`);
  }
};
export const r_unique = r_symbol;
