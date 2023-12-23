import { MarshalError } from '../errors';
import type { MarshalHash, MarshalObject } from '../types';
import { MarshalContext, r_long, r_entry } from './r_helper';
import { r_object } from './withSubContext';

const marshalLoadHashAsMap = (context: MarshalContext, length: number) => {
  const hash: Map<MarshalObject, MarshalObject> = r_entry(context, new Map());
  while (length--) {
    const key = r_object(context);
    const value = r_object(context);
    hash.set(key, value);
  }
  return hash;
};

const marshalLoadHashAsObject = (context: MarshalContext, length: number) => {
  const hash: MarshalHash = r_entry(context, { __class: 'Hash' });
  while (length--) {
    const key = r_object(context);
    const value = r_object(context);
    switch (typeof key) {
      case 'string':
      case 'symbol':
        hash[key] = value;
        break;
      case 'number':
        hash[key.toString()] = value;
        break;
      case 'boolean':
        hash[key ? 'true' : 'false'] = value;
        break;
      case 'object':
        hash[key ? key.toString() : 'null'] = value;
        break;
      default:
        throw new MarshalError(`Cannot support non symbol or string key in Hashes in JS, received: ${typeof key}`);
    }
  }
  return hash;
};

export const marshalLoadHash = (context: MarshalContext): MarshalHash | Map<MarshalObject, MarshalObject> => {
  let length = r_long(context);
  if (length < 0) throw new MarshalError(`Negative length are not allowed for hashes, given length: ${length}`);
  if (context.config.load.hashToJS === 'map') {
    return marshalLoadHashAsMap(context, length);
  } else {
    return marshalLoadHashAsObject(context, length);
  }
};

export const marshalLoadHashDef = (context: MarshalContext) => {
  const hash = marshalLoadHash(context);
  if (hash instanceof Map) {
    hash.set('__default', r_object(context));
  } else {
    hash.__default = r_object(context);
  }
  return hash;
};
