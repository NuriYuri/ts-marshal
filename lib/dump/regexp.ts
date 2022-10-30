import { COMMON_ENCODING_SYMBOL } from '../load/encoded';
import { MarshalDumpContext, w_byte, w_bytes, w_long } from './r_helpers';
import { marshalDumpSymbol } from './symbol';

export const marshalDumpRegexp = (context: MarshalDumpContext, regexp: RegExp) => {
  w_byte(context, 73);
  w_byte(context, 47);
  w_bytes(context, Buffer.from(regexp.source, 'utf8'));
  const { flags } = regexp;
  w_byte(context, (flags.includes('i') ? 1 : 0) | (flags.includes('m') ? 4 : 0));
  w_long(context, 1);
  marshalDumpSymbol(context, COMMON_ENCODING_SYMBOL);
  w_byte(context, 84);
};
