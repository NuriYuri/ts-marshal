import { MarshalError } from '../errors';
import { r_long, MarshalContext, r_bytes, r_entry, r_byte } from './r_helper';

export const marshalLoadFixnum = r_long;

export const marshalLoadFloat = (context: MarshalContext): number => {
  const floatData = r_bytes(context).toString('binary');
  // if (floatData === 'nan') return r_entry(context, NaN); // Number('nan') => NaN
  if (floatData === 'inf') return r_entry(context, Infinity);
  if (floatData === '-inf') return r_entry(context, -Infinity);
  return Number(floatData);
};

export const marshalLoadBigNum = (context: MarshalContext): bigint => {
  const sign = r_byte(context);
  const length = r_long(context);
  if (length < 0) throw new MarshalError(`Negative length are not allowed for buffer, given length: ${length}`);
  const data = context.buffer.slice(context.index, context.index + length * 2);
  context.index += length * 2;
  const value = BigInt(`0x${data.reverse().toString('hex')}`);
  if (sign === 45) return r_entry(context, -value);
  return r_entry(context, value);
};
