import { marshalDumpObjectLink } from './link';
import { expandBuffer, MarshalDumpContext, w_byte, w_bytes, w_long, w_remember } from './r_helpers';

const marshalDumpFixnum = (context: MarshalDumpContext, object: number) => {
  w_byte(context, 105);
  w_long(context, object);
};

export const marshalDumpBigNum = (context: MarshalDumpContext, object: number | BigInt) => {
  if (typeof object !== 'number') w_remember(context, object);
  w_byte(context, 108);
  w_byte(context, object < 0 ? 45 : 43);
  const hex = object.toString(16);
  const newBuffer = Buffer.from((hex.length & 1) === 1 ? `0${hex}` : hex, 'hex').reverse();
  const mustAppendZero = (newBuffer.length & 1) === 1;
  const totalLength = mustAppendZero ? (newBuffer.length + 1) / 2 : newBuffer.length / 2;
  w_long(context, totalLength);
  if (context.length + newBuffer.length > context.buffer.length) expandBuffer(context, newBuffer.length);
  newBuffer.copy(context.buffer, context.length);
  context.length += newBuffer.length;
  if (mustAppendZero) w_byte(context, 0);
};

const marshalDumpFloat = (context: MarshalDumpContext, object: number) => {
  w_remember(context, object);
  w_byte(context, 102);
  if (Number.isNaN(object)) return w_bytes(context, Buffer.from('nan'));
  if (object === -Infinity) return w_bytes(context, Buffer.from('-inf'));
  if (object === Infinity) return w_bytes(context, Buffer.from('inf'));
  w_bytes(context, Buffer.from(object.toString()));
};

export const marshalDumpNumber = (context: MarshalDumpContext, object: number) => {
  if (context.objects.includes(object)) return marshalDumpObjectLink(context, object);
  if (Number.isInteger(object)) {
    if (object <= 1073741823 && object >= -1073741824) return marshalDumpFixnum(context, object);
    return marshalDumpBigNum(context, object);
  }
  return marshalDumpFloat(context, object);
};
