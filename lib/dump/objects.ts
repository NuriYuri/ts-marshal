import { COMMON_ENCODING_SYMBOL, ENCODING_SYMBOL } from '../load/encoded';
import { isMarshalExtendableObject } from '../typeGuards';
import type {
  MarshalDataObject,
  MarshalHash,
  MarshalMarshalObject,
  MarshalObject,
  MarshalStandardObject,
  MarshalStructObject,
  MarshalUserObject,
} from '../types';
import { marshalDumpObjectLink } from './link';
import { MarshalDumpContext, w_byte, w_bytes, w_long, w_remember } from './r_helpers';
import { marshalDumpString } from './strings';
import { marshalDumpSymbol } from './symbol';

export const w_class = (context: MarshalDumpContext, byte: number, object: { __class: symbol | string }) => {
  if (isMarshalExtendableObject(object)) {
    object.__extendedModules?.forEach((module) => {
      w_byte(context, 101);
      marshalDumpSymbol(context, Symbol.for(module.name));
    });
  }
  w_byte(context, byte);
  marshalDumpSymbol(context, typeof object.__class === 'symbol' ? object.__class : Symbol.for(object.__class));
};

export const marshalDumpDataObject = (context: MarshalDumpContext, object: MarshalDataObject) => {
  w_remember(context, object);
  w_class(context, 100, object);
  context.marshalDump(context, object.__load_data);
};

export const marshalDumpUsrMarshalObject = (context: MarshalDumpContext, object: MarshalMarshalObject) => {
  w_remember(context, object);
  w_class(context, 85, object);
  context.marshalDump(context, object.__marshal_load);
};

const GENERIC_ENCODING: readonly BufferEncoding[] = ['utf8', 'utf-8', 'ascii'] as const;

export const marshalDumpUserDefObject = (context: MarshalDumpContext, object: MarshalUserObject) => {
  w_remember(context, object);
  if (object.__encoding) w_byte(context, 73);
  w_class(context, 117, object);
  w_bytes(context, object.__load);
  if (!object.__encoding) return;

  w_long(context, 1);
  if (GENERIC_ENCODING.includes(object.__encoding)) {
    marshalDumpSymbol(context, COMMON_ENCODING_SYMBOL);
    return w_byte(context, object.__encoding === 'ascii' ? 70 : 84);
  }

  marshalDumpSymbol(context, ENCODING_SYMBOL);
  switch (object.__encoding) {
    case 'utf8':
    case 'utf-8':
      return marshalDumpString(context, 'UTF-8');
    case 'ascii':
      return marshalDumpString(context, 'US-ASCII');
    case 'utf16le':
    case 'ucs2':
    case 'ucs-2':
      return marshalDumpString(context, 'UTF-16LE');
    case 'latin1':
      return marshalDumpString(context, 'ISO-8859-1');
    default:
      return marshalDumpString(context, 'ASCII-8BIT');
  }
};

export const marshalDumpHash = (context: MarshalDumpContext, object: MarshalHash) => {
  w_remember(context, object);
  const ivar = Object.keys(object).filter((key) => key.startsWith('@'));
  if (ivar.length > 0) w_byte(context, 73);
  object.__extendedModules?.forEach((module) => {
    w_byte(context, 101);
    marshalDumpSymbol(context, Symbol.for(module.name));
  });
  w_byte(context, object.__default ? 125 : 123);
  const keys = (Object.keys(object).filter((key) => !key.startsWith('__') && !key.startsWith('@')) as (string | symbol)[]).concat(
    Object.getOwnPropertySymbols(object),
  );
  w_long(context, keys.length);
  keys.forEach((key) => {
    if (typeof key === 'symbol') {
      marshalDumpSymbol(context, key);
    } else if (context.objects.includes(key)) {
      marshalDumpObjectLink(context, key);
    } else {
      marshalDumpString(context, key);
    }
    context.marshalDump(context, object[key] as MarshalObject);
  });
  if (object.__default) context.marshalDump(context, object.__default);
  if (ivar.length > 0) {
    w_long(context, ivar.length);
    ivar.forEach((key) => {
      marshalDumpSymbol(context, Symbol.for(key));
      context.marshalDump(context, object[key] as MarshalObject);
    });
  }
};

export const marshalDumpStruct = (context: MarshalDumpContext, object: MarshalStructObject) => {
  w_remember(context, object);
  const ivar = Object.keys(object).filter((key) => key.startsWith('@'));
  if (ivar.length > 0) w_byte(context, 73);
  w_class(context, 83, object);
  const keys = Object.keys(object).filter((key) => !key.startsWith('__') && !key.startsWith('@'));
  w_long(context, keys.length);
  keys.forEach((key) => {
    marshalDumpSymbol(context, Symbol.for(key));
    context.marshalDump(context, object[key] as MarshalObject);
  });
  if (ivar.length > 0) {
    w_long(context, ivar.length);
    ivar.forEach((key) => {
      marshalDumpSymbol(context, Symbol.for(key));
      context.marshalDump(context, object[key] as MarshalObject);
    });
  }
};

export const marshalDumpStandardObject = (context: MarshalDumpContext, object: MarshalStandardObject) => {
  w_remember(context, object);
  w_class(context, 111, object);
  const ivar = Object.keys(object).filter((key) => key.startsWith('@'));
  w_long(context, ivar.length);
  ivar.forEach((key) => {
    marshalDumpSymbol(context, Symbol.for(key));
    context.marshalDump(context, object[key] as MarshalObject);
  });
};
