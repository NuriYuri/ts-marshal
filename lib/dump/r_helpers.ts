import { MarshalConfig } from '../config';
import type { MarshalObject } from '../types';

export type MarshalDumpContext = {
  buffer: Buffer;
  length: number;
  objects: unknown[];
  symbols: symbol[];
  marshalDump: (context: MarshalDumpContext, object: MarshalObject) => void;
  config: MarshalConfig;
};

export const expandBuffer = (context: MarshalDumpContext, needed: number) => {
  const buffer = context.buffer;
  if (needed > 64) {
    context.buffer = Buffer.allocUnsafe(context.buffer.length + needed);
  } else {
    context.buffer = Buffer.allocUnsafe(context.buffer.length + 64);
  }
  buffer.copy(context.buffer);
};

export const w_byte = (context: MarshalDumpContext, byte: number) => {
  if (context.length >= context.buffer.length) expandBuffer(context, 1);
  context.buffer.writeUInt8(byte, context.length++);
};

export const w_bytes = (context: MarshalDumpContext, bytes: Buffer) => {
  const length = bytes.length;
  w_long(context, length);
  if (context.length + length > context.buffer.length) expandBuffer(context, length);
  bytes.copy(context.buffer, context.length);
  context.length += length;
};

export const w_short = (context: MarshalDumpContext, short: number) => {
  if (context.length + 2 > context.buffer.length) expandBuffer(context, 2);
  context.buffer.writeUInt16LE(short, context.length);
  context.length += 2;
};

export const w_remember = (context: MarshalDumpContext, object: unknown) => {
  context.objects.push(object);
};

export const w_long = (context: MarshalDumpContext, long: number) => {
  if (long == 0) return w_byte(context, 0);
  if (0 < long && long < 123) return w_byte(context, long + 5);
  if (-124 < long && long < 0) return w_byte(context, (long - 5) & 0xff);
  const buff = Buffer.allocUnsafe(5);
  let i: number;
  let x = long;
  for (i = 1; i < 5; i++) {
    buff.writeUInt8(x & 0xff, i);
    x = x >> 8;
    if (x == 0) {
      buff.writeUint8(i, 0);
      break;
    }
    if (x == -1) {
      buff.writeUInt8(-i, 0);
      break;
    }
  }
  i++;
  if (context.length + i >= context.buffer.length) expandBuffer(context, i);
  buff.copy(context.buffer, context.length, 0, i);
  context.length += i;
};
