import { MarshalError } from '../errors';

export type MarshalContext = {
  readonly buffer: Buffer;
  index: number;
  symbols: symbol[];
  objects: unknown[];
  ivar: boolean;
  marshalLoad: (context: MarshalContext) => unknown;
};

export const r_byte = (context: MarshalContext): number => {
  return context.buffer.readUint8(context.index++);
};

// More or less equivalent to r_long
export const r_long = (context: MarshalContext): number => {
  const c = context.buffer.readInt8(context.index++);
  if (c === 0) return 0;
  if (c > 0) {
    if (4 < c && c < 128) return c - 5;
    if (c > 8) throw new MarshalError(`long too big for this architecture (size 8), given ${c}`);
    let x = 0;
    for (let i = 0; i < c; i++) x |= r_byte(context) << (8 * i);
    return x;
  }
  if (-129 < c && c < -4) return c + 5;
  const m = -c;
  if (m > 8) throw new MarshalError(`long too big for this architecture (size 8), given ${m}`);
  let x = -1;
  for (let i = 0; i < m; i++) {
    x &= ~(0xff << (8 * i));
    x |= r_byte(context) << (8 * i);
  }
  return x;
};

export const r_bytes = (context: MarshalContext): Buffer => {
  const length = r_long(context);
  if (length < 0) throw new MarshalError(`Negative length are not allowed for buffer, given length: ${length}`);
  const buffer = context.buffer.slice(context.index, context.index + length);
  context.index += length;
  return buffer;
};

export const r_entry = <T>(context: MarshalContext, object: T): T => {
  context.objects.push(object);
  return object;
};
