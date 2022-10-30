import { MarshalError } from '../errors';
import {
  isMarshalClassObject,
  isMarshalDataObject,
  isMarshalHash,
  isMarshalMarshalObject,
  isMarshalModuleObject,
  isMarshalModuleOrClassObject,
  isMarshalStandardObject,
  isMarshalStructObject,
  isMarshalUserObject,
} from '../typeGuards';
import { MarshalObject } from '../types';
import { marshalDumpArray } from './array';
import { marshalDumpObjectLink } from './link';
import { marshalDumpClass, marshalDumpModule, marshalDumpModuleOld } from './module';
import { marshalDumpBigNum, marshalDumpNumber } from './numbers';
import {
  marshalDumpDataObject,
  marshalDumpHash,
  marshalDumpStandardObject,
  marshalDumpStruct,
  marshalDumpUserDefObject,
  marshalDumpUsrMarshalObject,
} from './objects';
import { marshalDumpRegexp } from './regexp';
import { MarshalDumpContext, w_byte } from './r_helpers';
import { marshalDumpString } from './strings';
import { marshalDumpSymbol } from './symbol';

const marshalDump = (context: MarshalDumpContext, object: MarshalObject) => {
  if (object === null) return w_byte(context, 48);
  if (object === true) return w_byte(context, 84);
  if (object === false) return w_byte(context, 70);
  if (typeof object === 'number') return marshalDumpNumber(context, object);
  if (typeof object === 'symbol') return marshalDumpSymbol(context, object);
  if (context.objects.includes(object)) return marshalDumpObjectLink(context, object);
  if (typeof object === 'bigint') return marshalDumpBigNum(context, object);
  if (typeof object === 'string') return marshalDumpString(context, object);
  if (object instanceof RegExp) return marshalDumpRegexp(context, object);
  if (Array.isArray(object)) return marshalDumpArray(context, object);
  if (isMarshalModuleOrClassObject(object)) return marshalDumpModuleOld(context, object);
  if (isMarshalClassObject(object)) return marshalDumpClass(context, object);
  if (isMarshalModuleObject(object)) return marshalDumpModule(context, object);
  if (isMarshalDataObject(object)) return marshalDumpDataObject(context, object);
  if (isMarshalMarshalObject(object)) return marshalDumpUsrMarshalObject(context, object);
  if (isMarshalUserObject(object)) return marshalDumpUserDefObject(context, object);
  if (isMarshalHash(object)) return marshalDumpHash(context, object);
  if (isMarshalStructObject(object)) return marshalDumpStruct(context, object);
  if (isMarshalStandardObject(object)) return marshalDumpStandardObject(context, object);
  throw new MarshalError(`Cannot dump ${object}`);
};

export const dump = (object: MarshalObject): Buffer => {
  const buffer = Buffer.allocUnsafe(64);
  const context: MarshalDumpContext = {
    buffer,
    length: 0,
    objects: [],
    symbols: [],
    marshalDump,
  };

  w_byte(context, 4);
  w_byte(context, 8);
  context.marshalDump(context, object);

  return context.buffer.slice(0, context.length);
};
