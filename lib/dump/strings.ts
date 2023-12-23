import { COMMON_ENCODING_SYMBOL } from '../load/encoded';
import { MarshalDumpContext, w_byte, w_bytes, w_long, w_remember } from './r_helpers';
import { marshalDumpSymbol } from './symbol';

const w_string = (context: MarshalDumpContext, object: string) => {
  w_byte(context, 34);
  w_bytes(context, Buffer.from(object, 'utf-8'));
};

export const marshalDumpString = (context: MarshalDumpContext, object: string) => {
  w_remember(context, object);
  if (context.config.dump.omitStringEncoding) {
    w_string(context, object);
    return;
  }
  // Add IVAR to specify it contains UTF-8 chars
  w_byte(context, 73);
  w_string(context, object);
  w_long(context, 1);
  marshalDumpSymbol(context, COMMON_ENCODING_SYMBOL);
  w_byte(context, 84);
};
